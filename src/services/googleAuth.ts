import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

export const GMAIL_SCOPES = [
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/gmail.metadata",
  "https://www.googleapis.com/auth/gmail.settings.basic",
  "https://www.googleapis.com/auth/gmail.settings.sharing",
  "https://www.googleapis.com/auth/gmail.insert",
  "https://www.googleapis.com/auth/gmail.addons.current.message.readonly",
  "https://www.googleapis.com/auth/gmail.addons.current.message.metadata",
  "https://www.googleapis.com/auth/gmail.addons.current.message.action",
  "https://www.googleapis.com/auth/gmail.addons.current.action.compose",
];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);

// 1. Clean, unrestricted provider for App Login (no sensitive/restricted scopes, works for all users)
const loginProvider = new GoogleAuthProvider();
loginProvider.setCustomParameters({ prompt: "select_account" });

// 2. Workspace provider for Gmail access (requests Gmail scopes when user explicitly connects Gmail)
const gmailProvider = new GoogleAuthProvider();
GMAIL_SCOPES.forEach((scope) => gmailProvider.addScope(scope));
gmailProvider.setCustomParameters({ prompt: "consent" });

// In-memory token cache (NEVER stored in localStorage or sessionStorage per skill security instructions)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initGoogleAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(firebaseAuth, async (user: FirebaseUser | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If we have a Firebase user but no memory-cached access token, prompt sign-in to refresh token
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google.
 * By default (requestGmailScopes = false), uses standard Google identity provider without restricted scopes.
 * This ensures ANY Google account (e.g. harsheaj2000@gmail.com) can log in without triggering Google's
 * "Access blocked: has not completed the Google verification process" (Error 403: access_denied) screen.
 */
export const googleSignIn = async (options?: {
  requestGmailScopes?: boolean;
}): Promise<{ user: FirebaseUser; accessToken?: string } | null> => {
  try {
    isSigningIn = true;
    const targetProvider = options?.requestGmailScopes ? gmailProvider : loginProvider;
    const result = await signInWithPopup(firebaseAuth, targetProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }

    return { user: result.user, accessToken: cachedAccessToken || undefined };
  } catch (error: any) {
    console.error("Google sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Specifically connects Gmail Workspace with full email scopes.
 */
export const googleSignInForGmail = async () => {
  return googleSignIn({ requestGmailScopes: true });
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null): void => {
  cachedAccessToken = token;
};

export const googleLogout = async (): Promise<void> => {
  await signOut(firebaseAuth);
  cachedAccessToken = null;
};
