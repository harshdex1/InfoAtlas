import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, Bookmark, SearchHistoryItem, RecentlyViewedItem, UserRole, StoredUserAccount } from "../types";
import { googleLogout } from "../services/googleAuth";

// Bulletproof Storage implementation that gracefully handles iframe restrictions and quota limits
class SafeStorage {
  private mem = new Map<string, string>();

  getItem(key: string): string | null {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch {
      // Storage access blocked or restricted in iframe
    }
    return this.mem.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.mem.set(key, value);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Storage access blocked or quota exceeded
    }
  }

  removeItem(key: string): void {
    this.mem.delete(key);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Storage access blocked
    }
  }

  getJSON<T>(key: string, fallback: T): T {
    try {
      const raw = this.getItem(key);
      if (!raw || raw === "undefined" || raw === "null") return fallback;
      const parsed = JSON.parse(raw);
      return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
}

export const safeStorage = new SafeStorage();

const INITIAL_DEFAULT_ACCOUNTS: StoredUserAccount[] = [
  {
    uid: "dev_root",
    email: "developer@infoatlas.app",
    displayName: "InfoAtlas Lead Developer",
    role: "developer",
    provider: "password",
    password: "2368",
    createdAt: new Date("2026-01-01").toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    uid: "editor_root",
    email: "editor@infoatlas.app",
    displayName: "InfoAtlas Senior Editor",
    role: "editor",
    provider: "password",
    password: "2368",
    createdAt: new Date("2026-01-01").toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    uid: "admin_root",
    email: "admin@infoatlas.app",
    displayName: "InfoAtlas Super Admin",
    role: "admin",
    provider: "password",
    password: "2368",
    createdAt: new Date("2026-01-01").toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
];

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDeveloper: boolean;
  isEditor: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (email: string, displayName?: string, photoURL?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (displayName: string, newPassword?: string) => Promise<{ success: boolean; error?: string }>;
  sendEmailOtp: (email: string) => Promise<{ success: boolean; previewCode?: string; expiresAt?: number; error?: string }>;
  verifyEmailOtp: (
    email: string,
    code: string,
    displayName?: string,
    password?: string
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  // Account administration (Admin only)
  accounts: StoredUserAccount[];
  refreshAccounts: () => Promise<void>;
  updateUserRole: (uid: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  resetUserPassword: (uid: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  deleteUserAccount: (uid: string) => Promise<{ success: boolean; error?: string }>;
  createUserAccount: (name: string, email: string, role: UserRole, password?: string) => Promise<{ success: boolean; error?: string }>;
  // Personal data
  bookmarks: Bookmark[];
  addBookmark: (bookmark: Omit<Bookmark, "id" | "userId" | "createdAt">) => void;
  removeBookmark: (url: string) => void;
  isBookmarked: (url: string) => boolean;
  history: SearchHistoryItem[];
  addHistory: (query: string) => void;
  clearHistory: () => void;
  recentlyViewed: RecentlyViewedItem[];
  addRecentlyViewed: (item: Omit<RecentlyViewedItem, "id" | "userId" | "viewedAt">) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = safeStorage.getJSON<User | null>("infoatlas_current_user", null);
    if (
      saved &&
      (saved.email === "explorer@infoatlas.app" ||
        saved.provider === "guest" ||
        saved.email.toLowerCase().startsWith("guest@"))
    ) {
      safeStorage.removeItem("infoatlas_current_user");
      return null;
    }
    return saved;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Accounts state - strictly removing any guest/explorer demo accounts
  const [accounts, setAccounts] = useState<StoredUserAccount[]>(() => {
    let saved = safeStorage.getJSON<StoredUserAccount[]>("infoatlas_users", []);
    if (Array.isArray(saved)) {
      saved = saved.filter(
        (u) =>
          u &&
          u.email &&
          u.email.toLowerCase() !== "explorer@infoatlas.app" &&
          !u.email.toLowerCase().startsWith("guest@") &&
          u.provider !== "guest"
      );
    }
    if (!Array.isArray(saved) || saved.length === 0) {
      safeStorage.setItem("infoatlas_users", JSON.stringify(INITIAL_DEFAULT_ACCOUNTS));
      return INITIAL_DEFAULT_ACCOUNTS;
    }
    // Ensure all default core accounts (developer, editor, admin) are present with password 2368
    for (const defAcc of INITIAL_DEFAULT_ACCOUNTS) {
      const idx = saved.findIndex((u) => u && u.email && u.email.toLowerCase() === defAcc.email.toLowerCase());
      if (idx === -1) {
        saved.unshift(defAcc);
      } else {
        saved[idx].password = "2368";
        saved[idx].role = defAcc.role;
        saved[idx].displayName = saved[idx].displayName || defAcc.displayName;
      }
    }
    safeStorage.setItem("infoatlas_users", JSON.stringify(saved));
    return saved;
  });

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    return safeStorage.getJSON<Bookmark[]>("infoatlas_bookmarks", []);
  });

  const [history, setHistory] = useState<SearchHistoryItem[]>(() => {
    return safeStorage.getJSON<SearchHistoryItem[]>("infoatlas_history", []);
  });

  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>(() => {
    return safeStorage.getJSON<RecentlyViewedItem[]>("infoatlas_recent", []);
  });

  // Keep user sync
  useEffect(() => {
    if (user) {
      safeStorage.setItem("infoatlas_current_user", JSON.stringify(user));
    } else {
      safeStorage.removeItem("infoatlas_current_user");
    }
  }, [user]);

  useEffect(() => {
    safeStorage.setItem("infoatlas_users", JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    safeStorage.setItem("infoatlas_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    safeStorage.setItem("infoatlas_history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    safeStorage.setItem("infoatlas_recent", JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  // Sync accounts from server API on mount and periodically
  const refreshAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/accounts");
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.accounts)) {
          // Merge server accounts with local password cache
          setAccounts((prevAccounts) => {
            const mergedMap = new Map<string, StoredUserAccount>();
            for (const a of prevAccounts) {
              if (a && a.uid) mergedMap.set(a.uid, a);
            }
            for (const s of data.accounts) {
              if (s && s.uid) {
                const existing = mergedMap.get(s.uid);
                mergedMap.set(s.uid, {
                  ...s,
                  password: existing?.password || (s.email === "admin@infoatlas.app" ? "2368" : existing?.password),
                });
              }
            }
            // Ensure admin account always exists
            const list = Array.from(mergedMap.values());
            if (!list.some((u) => u.email.toLowerCase() === "admin@infoatlas.app")) {
              list.unshift(INITIAL_DEFAULT_ACCOUNTS[0]);
            }
            safeStorage.setItem("infoatlas_users", JSON.stringify(list));
            return list;
          });
        }
      }
    } catch {
      // Offline fallback: rely on safeStorage
    }
  }, []);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 350));

      const cleanEmail = (email || "").trim().toLowerCase();
      const cleanPass = (pass || "").trim();

      if (!cleanEmail || !cleanPass) {
        setIsLoading(false);
        return { success: false, error: "Please enter both email and password." };
      }

      // Check special Developer Credentials: developer@infoatlas.app with password 2368
      if (cleanEmail === "developer@infoatlas.app") {
        if (cleanPass !== "2368") {
          setIsLoading(false);
          return { success: false, error: "Incorrect password for Developer account. (Default: 2368)" };
        }
        const devUser: User = {
          uid: "dev_root",
          email: "developer@infoatlas.app",
          displayName: "InfoAtlas Lead Developer",
          role: "developer",
          provider: "password",
          createdAt: new Date("2026-01-01").toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        setUser(devUser);
        safeStorage.setItem("infoatlas_current_user", JSON.stringify(devUser));
        setIsLoading(false);
        return { success: true };
      }

      // Check special Editor Credentials: editor@infoatlas.app with password 2368
      if (cleanEmail === "editor@infoatlas.app") {
        if (cleanPass !== "2368") {
          setIsLoading(false);
          return { success: false, error: "Incorrect password for Editor account. (Default: 2368)" };
        }
        const editorUser: User = {
          uid: "editor_root",
          email: "editor@infoatlas.app",
          displayName: "InfoAtlas Senior Editor",
          role: "editor",
          provider: "password",
          createdAt: new Date("2026-01-01").toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        setUser(editorUser);
        safeStorage.setItem("infoatlas_current_user", JSON.stringify(editorUser));
        setIsLoading(false);
        return { success: true };
      }

      // Check special Admin Credentials: admin@infoatlas.app with password 2368
      if (cleanEmail === "admin@infoatlas.app") {
        if (cleanPass !== "2368") {
          setIsLoading(false);
          return { success: false, error: "Incorrect password for Administrator account. (Default: 2368)" };
        }
        const adminUser: User = {
          uid: "admin_root",
          email: "admin@infoatlas.app",
          displayName: "InfoAtlas Super Admin",
          role: "admin",
          provider: "password",
          createdAt: new Date("2026-01-01").toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        setUser(adminUser);
        safeStorage.setItem("infoatlas_current_user", JSON.stringify(adminUser));
        setIsLoading(false);
        return { success: true };
      }

      if (cleanPass.length < 4) {
        setIsLoading(false);
        return { success: false, error: "Password must be at least 4 characters." };
      }

      const usersList = Array.isArray(accounts) ? [...accounts] : [];
      const found = usersList.find((u) => u && typeof u === "object" && u.email && u.email.toLowerCase() === cleanEmail);

      if (found) {
        if (found.password && found.password !== cleanPass) {
          setIsLoading(false);
          return { success: false, error: "Incorrect password. Please try again." };
        }
        const loggedUser: User = {
          uid: found.uid || `user_${Date.now()}`,
          email: found.email || cleanEmail,
          displayName: found.displayName || cleanEmail.split("@")[0] || "Explorer",
          role: found.role || "user",
          provider: found.provider || "password",
          photoURL: found.photoURL,
          createdAt: found.createdAt || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        setUser(loggedUser);
        safeStorage.setItem("infoatlas_current_user", JSON.stringify(loggedUser));
        setIsLoading(false);
        return { success: true };
      } else {
        // Create user
        const newUser: StoredUserAccount = {
          uid: "user_" + Math.random().toString(36).substring(2, 9),
          email: cleanEmail,
          displayName: cleanEmail.split("@")[0] || "Explorer",
          role: "user",
          provider: "password",
          password: cleanPass,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        const updated = [...usersList, newUser];
        setAccounts(updated);
        safeStorage.setItem("infoatlas_users", JSON.stringify(updated));
        setUser(newUser);
        safeStorage.setItem("infoatlas_current_user", JSON.stringify(newUser));

        // Sync with server
        try {
          fetch("/api/auth/accounts/upsert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUser),
          }).catch(() => {});
        } catch {}

        setIsLoading(false);
        return { success: true };
      }
    } catch (err: any) {
      console.error("Login failure handled safely:", err);
      setIsLoading(false);
      return { success: false, error: err?.message || "Login encountered an error. Please try again." };
    }
  };

  const loginWithGoogle = async (
    email: string,
    displayName?: string,
    photoURL?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      const cleanEmail = (email || "").trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        setIsLoading(false);
        return { success: false, error: "A valid email address is required." };
      }

      const cleanName =
        (displayName || "").trim() ||
        cleanEmail.split("@")[0].replace(/[._]/g, " ") ||
        "Google User";
      const role: UserRole =
        cleanEmail === "developer@infoatlas.app"
          ? "developer"
          : cleanEmail === "editor@infoatlas.app"
          ? "editor"
          : cleanEmail === "admin@infoatlas.app"
          ? "admin"
          : "user";
      const now = new Date().toISOString();

      const usersList = Array.isArray(accounts) ? [...accounts] : [];
      const existing = usersList.find((u) => u && u.email && u.email.toLowerCase() === cleanEmail);

      let loggedUser: User;
      if (existing) {
        loggedUser = {
          ...existing,
          displayName: existing.displayName || cleanName,
          provider: "google",
          photoURL: photoURL || existing.photoURL,
          role: existing.role || role,
          isEmailVerified: true,
          lastLoginAt: now,
        };
        const updated = usersList.map((u) => (u.uid === existing.uid ? { ...u, ...loggedUser } : u));
        setAccounts(updated);
        safeStorage.setItem("infoatlas_users", JSON.stringify(updated));
      } else {
        const newAccount: StoredUserAccount = {
          uid: "g_user_" + Math.random().toString(36).substring(2, 9),
          email: cleanEmail,
          displayName: cleanName,
          role: role,
          provider: "google",
          photoURL: photoURL || undefined,
          isEmailVerified: true,
          createdAt: now,
          lastLoginAt: now,
        };
        const updated = [...usersList, newAccount];
        setAccounts(updated);
        safeStorage.setItem("infoatlas_users", JSON.stringify(updated));
        loggedUser = newAccount;
      }

      setUser(loggedUser);
      safeStorage.setItem("infoatlas_current_user", JSON.stringify(loggedUser));

      // Sync with server backend
      try {
        fetch("/api/auth/accounts/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loggedUser),
        }).catch(() => {});
      } catch {}

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error("Google sign in failure:", err);
      setIsLoading(false);
      return { success: false, error: err?.message || "Google sign-in could not be completed." };
    }
  };

  const register = async (name: string, email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 400));

      const cleanName = (name || "").trim();
      const cleanEmail = (email || "").trim().toLowerCase();
      const cleanPass = (pass || "").trim();

      if (!cleanName || !cleanEmail || !cleanPass) {
        setIsLoading(false);
        return { success: false, error: "All fields are required." };
      }
      if (cleanPass.length < 4) {
        setIsLoading(false);
        return { success: false, error: "Password must be at least 4 characters." };
      }

      const usersList = Array.isArray(accounts) ? [...accounts] : [];
      const exists = usersList.find((u) => u && typeof u === "object" && u.email && u.email.toLowerCase() === cleanEmail);
      if (exists) {
        setIsLoading(false);
        return { success: false, error: "An account with this email already exists." };
      }

      const role: UserRole = cleanEmail === "admin@infoatlas.app" ? "admin" : "user";
      const newUser: StoredUserAccount = {
        uid: "user_" + Math.random().toString(36).substring(2, 9),
        email: cleanEmail,
        displayName: cleanName,
        role: role,
        provider: "password",
        password: cleanPass,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      const updated = [...usersList, newUser];
      setAccounts(updated);
      safeStorage.setItem("infoatlas_users", JSON.stringify(updated));

      setUser(newUser);
      safeStorage.setItem("infoatlas_current_user", JSON.stringify(newUser));

      // Sync with server
      try {
        fetch("/api/auth/accounts/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newUser),
        }).catch(() => {});
      } catch {}

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error("Register failure handled safely:", err);
      setIsLoading(false);
      return { success: false, error: err?.message || "Registration encountered an error." };
    }
  };

  const updateProfile = async (
    displayName: string,
    newPassword?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: "You must be signed in to update your profile settings." };
    }
    const cleanName = (displayName || "").trim();
    if (!cleanName) {
      return { success: false, error: "Your full name cannot be blank." };
    }
    if (newPassword && newPassword.trim().length < 4) {
      return { success: false, error: "Password must be at least 4 characters long." };
    }

    try {
      const updatedUser: User = {
        ...user,
        displayName: cleanName,
      };
      setUser(updatedUser);
      safeStorage.setItem("infoatlas_current_user", JSON.stringify(updatedUser));

      // Update in accounts array
      const cleanPass = newPassword ? newPassword.trim() : undefined;
      const updatedAccounts = accounts.map((acc) => {
        if (acc.uid === user.uid) {
          return {
            ...acc,
            displayName: cleanName,
            ...(cleanPass ? { password: cleanPass } : {}),
            lastLoginAt: new Date().toISOString(),
          };
        }
        return acc;
      });
      setAccounts(updatedAccounts);
      safeStorage.setItem("infoatlas_users", JSON.stringify(updatedAccounts));

      // Push to server API
      try {
        await fetch("/api/auth/profile/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user.uid,
            displayName: cleanName,
            ...(cleanPass ? { newPassword: cleanPass } : {}),
          }),
        });
      } catch (err) {
        console.warn("Server profile update sync fallback:", err);
      }

      return { success: true };
    } catch (err: any) {
      console.error("Profile update error:", err);
      return { success: false, error: err?.message || "Failed to update profile settings." };
    }
  };

  const sendEmailOtp = async (
    email: string
  ): Promise<{ success: boolean; previewCode?: string; expiresAt?: number; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanEmail = (email || "").trim().toLowerCase();
      if (!cleanEmail) {
        setIsLoading(false);
        return { success: false, error: "Email address is required." };
      }
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      setIsLoading(false);
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed to dispatch 6-digit verification code." };
      }
      return {
        success: true,
        previewCode: data.previewCode,
        expiresAt: data.expiresAt,
      };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || "Failed to communicate with verification service." };
    }
  };

  const verifyEmailOtp = async (
    email: string,
    code: string,
    displayName?: string,
    password?: string
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanEmail = (email || "").trim().toLowerCase();
      const cleanCode = (code || "").trim();
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          code: cleanCode,
          displayName: displayName?.trim(),
          password: password?.trim(),
        }),
      });
      const data = await res.json();
      setIsLoading(false);
      if (!res.ok || !data.success || !data.user) {
        return { success: false, error: data.error || "Verification failed." };
      }

      const verifiedUser: User = {
        ...data.user,
        isEmailVerified: true,
      };

      setUser(verifiedUser);
      safeStorage.setItem("infoatlas_current_user", JSON.stringify(verifiedUser));

      // Synchronize in accounts list
      setAccounts((prev) => {
        const existingIdx = prev.findIndex((a) => a.email.toLowerCase() === cleanEmail);
        if (existingIdx >= 0) {
          const copy = [...prev];
          copy[existingIdx] = {
            ...copy[existingIdx],
            ...verifiedUser,
            isEmailVerified: true,
            password: password?.trim() || copy[existingIdx].password,
          };
          safeStorage.setItem("infoatlas_users", JSON.stringify(copy));
          return copy;
        } else {
          const newAcc: StoredUserAccount = {
            ...verifiedUser,
            isEmailVerified: true,
            password: password?.trim(),
          };
          const updated = [...prev, newAcc];
          safeStorage.setItem("infoatlas_users", JSON.stringify(updated));
          return updated;
        }
      });

      return { success: true, user: verifiedUser };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || "Verification request failed." };
    }
  };

  const logout = () => {
    setUser(null);
    safeStorage.removeItem("infoatlas_current_user");
    googleLogout().catch(() => {});
  };

  // ADMIN OPERATIONS
  const updateUserRole = async (uid: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    try {
      const updated = accounts.map((acc) => (acc.uid === uid ? { ...acc, role } : acc));
      setAccounts(updated);
      safeStorage.setItem("infoatlas_users", JSON.stringify(updated));

      // If current user modified, update self
      if (user && user.uid === uid) {
        const updatedSelf = { ...user, role };
        setUser(updatedSelf);
        safeStorage.setItem("infoatlas_current_user", JSON.stringify(updatedSelf));
      }

      // Sync server
      try {
        await fetch("/api/auth/accounts/update-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, role }),
        });
      } catch {}

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to update role." };
    }
  };

  const resetUserPassword = async (uid: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!newPassword || newPassword.trim().length < 4) {
        return { success: false, error: "Password must be at least 4 characters long." };
      }
      const updated = accounts.map((acc) => (acc.uid === uid ? { ...acc, password: newPassword.trim() } : acc));
      setAccounts(updated);
      safeStorage.setItem("infoatlas_users", JSON.stringify(updated));

      try {
        await fetch("/api/auth/accounts/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, newPassword: newPassword.trim() }),
        });
      } catch {}

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to reset password." };
    }
  };

  const deleteUserAccount = async (uid: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const target = accounts.find((a) => a.uid === uid);
      if (target && target.email.toLowerCase() === "admin@infoatlas.app") {
        return { success: false, error: "Primary root administrator cannot be deleted." };
      }

      const updated = accounts.filter((a) => a.uid !== uid);
      setAccounts(updated);
      safeStorage.setItem("infoatlas_users", JSON.stringify(updated));

      // Also clean up bookmarks and history of deleted user
      const updatedBookmarks = bookmarks.filter((b) => b.userId !== uid);
      setBookmarks(updatedBookmarks);
      safeStorage.setItem("infoatlas_bookmarks", JSON.stringify(updatedBookmarks));

      const updatedHistory = history.filter((h) => h.userId !== uid);
      setHistory(updatedHistory);
      safeStorage.setItem("infoatlas_history", JSON.stringify(updatedHistory));

      try {
        await fetch(`/api/auth/accounts/${encodeURIComponent(uid)}`, {
          method: "DELETE",
        });
      } catch {}

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to delete account." };
    }
  };

  const createUserAccount = async (
    name: string,
    email: string,
    role: UserRole,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = (email || "").trim().toLowerCase();
      const cleanName = (name || "").trim();
      const cleanPass = (password || "infoatlas123").trim();

      if (!cleanEmail || !cleanName) {
        return { success: false, error: "Name and email are required." };
      }
      if (accounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
        return { success: false, error: "An account with this email already exists." };
      }

      const newAcc: StoredUserAccount = {
        uid: "user_" + Math.random().toString(36).substring(2, 9),
        email: cleanEmail,
        displayName: cleanName,
        role,
        provider: "password",
        password: cleanPass,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      const updated = [...accounts, newAcc];
      setAccounts(updated);
      safeStorage.setItem("infoatlas_users", JSON.stringify(updated));

      try {
        await fetch("/api/auth/accounts/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newAcc),
        });
      } catch {}

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to create user account." };
    }
  };

  const addBookmark = (bm: Omit<Bookmark, "id" | "userId" | "createdAt">) => {
    if (!user || !bm || !bm.url) return;
    const currentList = Array.isArray(bookmarks) ? bookmarks : [];
    if (currentList.some((b) => Boolean(b && b.url === bm.url && b.userId === user.uid))) return;
    const newBm: Bookmark = {
      ...bm,
      id: "bm_" + Math.random().toString(36).substring(2, 9),
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };
    setBookmarks([newBm, ...currentList]);
  };

  const removeBookmark = (url: string) => {
    if (!user || !url) return;
    const currentList = Array.isArray(bookmarks) ? bookmarks : [];
    setBookmarks(currentList.filter((b) => !(b && b.url === url && b.userId === user.uid)));
  };

  const isBookmarked = (url: string): boolean => {
    if (!user || !url || !Array.isArray(bookmarks)) return false;
    return bookmarks.some((b) => Boolean(b && b.url === url && b.userId === user.uid));
  };

  const addHistory = (query: string) => {
    if (!user || !query || !query.trim()) return;
    const trimmed = query.trim();
    const currentList = Array.isArray(history) ? history : [];
    const newItem: SearchHistoryItem = {
      id: "hist_" + Math.random().toString(36).substring(2, 9),
      userId: user.uid,
      query: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + new Date().toLocaleDateString(),
    };
    setHistory([newItem, ...currentList.filter((h) => Boolean(h && h.query && h.query.toLowerCase() !== trimmed.toLowerCase()))].slice(0, 50));
  };

  const clearHistory = () => {
    if (!user) return;
    const currentList = Array.isArray(history) ? history : [];
    setHistory(currentList.filter((h) => Boolean(h && h.userId !== user.uid)));
  };

  const addRecentlyViewed = (item: Omit<RecentlyViewedItem, "id" | "userId" | "viewedAt">) => {
    if (!user || !item || !item.url) return;
    const currentList = Array.isArray(recentlyViewed) ? recentlyViewed : [];
    const newItem: RecentlyViewedItem = {
      ...item,
      id: "rec_" + Math.random().toString(36).substring(2, 9),
      userId: user.uid,
      viewedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setRecentlyViewed([newItem, ...currentList.filter((r) => Boolean(r && r.url !== item.url))].slice(0, 20));
  };

  const safeUserBookmarks = Array.isArray(bookmarks)
    ? bookmarks.filter((b) => Boolean(b && typeof b === "object" && user && b.userId === user.uid))
    : [];

  const safeUserHistory = Array.isArray(history)
    ? history.filter((h) => Boolean(h && typeof h === "object" && user && h.userId === user.uid))
    : [];

  const safeUserRecentlyViewed = Array.isArray(recentlyViewed)
    ? recentlyViewed.filter((r) => Boolean(r && typeof r === "object" && user && r.userId === user.uid))
    : [];

  const isAdmin = Boolean(
    user && (user.role === "admin" || user.email.toLowerCase() === "admin@infoatlas.app")
  );

  const isDeveloper = Boolean(
    user && (user.role === "developer" || user.role === "admin" || user.email.toLowerCase() === "developer@infoatlas.app")
  );

  const isEditor = Boolean(
    user && (user.role === "editor" || user.role === "developer" || user.role === "admin" || user.email.toLowerCase() === "editor@infoatlas.app")
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        isDeveloper,
        isEditor,
        isLoading,
        login,
        loginWithGoogle,
        register,
        updateProfile,
        sendEmailOtp,
        verifyEmailOtp,
        logout,
        accounts,
        refreshAccounts,
        updateUserRole,
        resetUserPassword,
        deleteUserAccount,
        createUserAccount,
        bookmarks: safeUserBookmarks,
        addBookmark,
        removeBookmark,
        isBookmarked,
        history: safeUserHistory,
        addHistory,
        clearHistory,
        recentlyViewed: safeUserRecentlyViewed,
        addRecentlyViewed,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
