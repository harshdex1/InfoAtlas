import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { InfoAtlasLogo } from "./InfoAtlasLogo";
import { GoogleSignInModal } from "./GoogleSignInModal";
import { OtpVerificationView } from "./OtpVerificationView";
import { LanguageSelector } from "./LanguageSelector";
import { useLanguage } from "../context/LanguageContext";
import { googleSignIn } from "../services/googleAuth";

export const AuthPage: React.FC = () => {
  const { login, register, loginWithGoogle, sendEmailOtp, verifyEmailOtp, isLoading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>("");
  const [resetSent, setResetSent] = useState<boolean>(false);
  const [showGoogleModal, setShowGoogleModal] = useState<boolean>(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState<boolean>(false);

  // OTP Verification state
  const [isOtpStep, setIsOtpStep] = useState<boolean>(false);
  const [otpPreviewCode, setOtpPreviewCode] = useState<string | undefined>(undefined);
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [pendingPassword, setPendingPassword] = useState<string>("");
  const [pendingName, setPendingName] = useState<string>("");

  const handleDirectGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsGoogleSigningIn(true);
    try {
      const res = await googleSignIn();
      if (!res || !res.user) {
        throw new Error("Could not retrieve Google profile.");
      }
      const userEmail = res.user.email;
      if (!userEmail) {
        throw new Error("No email found on your Google account.");
      }

      const authRes = await loginWithGoogle(
        userEmail,
        res.user.displayName || undefined,
        res.user.photoURL || undefined
      );

      if (!authRes.success) {
        setError(authRes.error || "Failed to sign in with Google.");
      } else {
        setSuccessMsg(`Welcome, ${res.user.displayName || userEmail}! Signed in with Google.`);
      }
    } catch (err: any) {
      console.error("Direct Google sign-in error:", err);
      if (err?.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed before completing.");
      } else if (err?.code === "auth/popup-blocked") {
        setError("Sign-in popup was blocked by your browser. Please allow popups or use the Device accounts option below.");
        setShowGoogleModal(true);
      } else if (err?.code === "auth/cancelled-popup-request") {
        // Ignored
      } else {
        setError(err?.message || "Google sign-in could not be completed. Please try again.");
      }
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleRequestOtpLogin = async () => {
    setError(null);
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter your Gmail address to receive a 6-digit code.");
      return;
    }
    const isSpecialAccount =
      cleanEmail === "developer@infoatlas.app" ||
      cleanEmail === "editor@infoatlas.app" ||
      cleanEmail === "admin@infoatlas.app";

    const isGmail =
      cleanEmail.endsWith("@gmail.com") ||
      cleanEmail.endsWith("@googlemail.com") ||
      cleanEmail.endsWith("@google.com") ||
      isSpecialAccount;

    if (!isGmail) {
      setError("Please enter a valid Gmail address (@gmail.com) or system account.");
      return;
    }

    try {
      const otpRes = await sendEmailOtp(cleanEmail);
      if (!otpRes.success) {
        setError(otpRes.error || "Failed to dispatch verification code.");
        return;
      }
      setPendingEmail(cleanEmail);
      setPendingPassword(password.trim() || "gmail_verified");
      setPendingName(name.trim());
      setOtpPreviewCode(otpRes.previewCode);
      setIsOtpStep(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send code.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!cleanPass || cleanPass.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    if (!isLoginMode && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    try {
      // Direct login bypass for Developer, Editor, and Super Admin accounts
      if (
        cleanEmail === "developer@infoatlas.app" ||
        cleanEmail === "editor@infoatlas.app" ||
        cleanEmail === "admin@infoatlas.app"
      ) {
        const res = await login(cleanEmail, cleanPass);
        if (!res.success) {
          setError(res.error || "Login failed");
        }
        return;
      }

      // Check Gmail address requirement
      const isGmail =
        cleanEmail.endsWith("@gmail.com") ||
        cleanEmail.endsWith("@googlemail.com") ||
        cleanEmail.endsWith("@google.com");

      if (!isGmail) {
        setError("Please enter a valid Gmail address (@gmail.com) to continue.");
        return;
      }

      // If in Login mode: attempt direct login if account exists with matching password
      if (isLoginMode) {
        const loginRes = await login(cleanEmail, cleanPass);
        if (loginRes.success) {
          return;
        }
        // If password specifically failed, show error
        if (loginRes.error && loginRes.error.toLowerCase().includes("incorrect password")) {
          setError(loginRes.error);
          return;
        }
      }

      // In registration mode, or if account needs verification
      const otpRes = await sendEmailOtp(cleanEmail);
      if (!otpRes.success) {
        setError(otpRes.error || "Failed to dispatch verification code.");
        return;
      }

      setPendingEmail(cleanEmail);
      setPendingPassword(cleanPass);
      setPendingName(name.trim());
      setOtpPreviewCode(otpRes.previewCode);
      setIsOtpStep(true);
    } catch (err: any) {
      console.error("Auth form submission error:", err);
      setError(err?.message || "An unexpected error occurred during authentication.");
    }
  };

  const handleVerifyOtp = async (code: string) => {
    return await verifyEmailOtp(pendingEmail, code, pendingName, pendingPassword);
  };

  const handleResendOtp = async () => {
    return await sendEmailOtp(pendingEmail);
  };

  const handleGoogleSuccess = async (googleEmail: string, displayName?: string, photoURL?: string) => {
    const res = await loginWithGoogle(googleEmail, displayName, photoURL);
    if (!res.success) {
      throw new Error(res.error || "Failed to sign in with Google.");
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetSent(true);
    setTimeout(() => {
      setResetSent(false);
      setShowForgotPassword(false);
      setSuccessMsg("Password reset link sent to your email.");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none" />

      {/* Language Selector in Top Right Corner */}
      <div className="absolute top-4 right-4 z-30">
        <LanguageSelector isDark={true} variant="compact" />
      </div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <InfoAtlasLogo
            variant="full"
            size="xl"
            animated
            withBackground={false}
            withTagline={true}
            isDark={true}
            className="mb-2"
          />
          <p className="text-xs text-cyan-300/80 font-medium mt-1">“Explore Everything. Understand Anything.”</p>
        </div>

        {isOtpStep ? (
          <OtpVerificationView
            email={pendingEmail}
            initialPreviewCode={otpPreviewCode}
            onVerify={handleVerifyOtp}
            onResend={handleResendOtp}
            onBack={() => {
              setIsOtpStep(false);
              setError(null);
            }}
            mode={isLoginMode ? "login" : "signup"}
          />
        ) : (
          <>
            {error && (
              <div className="mb-5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm p-4 rounded-xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Primary Direct Google Sign-In Button */}
            <div className="mb-5 space-y-2">
              <button
                type="button"
                onClick={handleDirectGoogleSignIn}
                disabled={isLoading || isGoogleSigningIn}
                className="w-full bg-white hover:bg-slate-50 text-slate-800 font-semibold py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer border border-slate-200 active:scale-[0.99] disabled:opacity-50"
              >
                {/* Google 4-Color SVG Icon or Spinner */}
                {isGoogleSigningIn ? (
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span className="text-sm font-bold text-slate-800">
                  {isGoogleSigningIn ? "Signing in with Google / Gmail..." : "Continue with Google / Gmail"}
                </span>
              </button>

              <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Instant login &amp; Gmail access
                </span>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(true)}
                  className="text-cyan-400 hover:text-cyan-300 font-medium underline cursor-pointer"
                >
                  Device accounts
                </button>
              </div>
            </div>

            <div className="relative flex py-2 items-center mb-4">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[11px] text-slate-500 font-medium uppercase tracking-wider">or sign in with email</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {showForgotPassword ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Reset Password</h2>
                <p className="text-xs text-slate-400">Enter your email address and we'll send you instructions to reset your password.</p>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={resetSent}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {resetSent ? "Sending..." : "Send Reset Link"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors pt-2 cursor-pointer"
                >
                  Back to Sign In
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {!isLoginMode && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Gmail Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">Password</label>
                    {isLoginMode && (
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
                >
                  <span>{isLoading ? "Signing in..." : isLoginMode ? "Sign In with Password" : "Create Account & Verify"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                {isLoginMode && (
                  <button
                    type="button"
                    onClick={handleRequestOtpLogin}
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Sign in with 6-digit OTP sent to Gmail</span>
                  </button>
                )}

                <div className="text-center pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginMode(!isLoginMode);
                      setError(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>

      {/* Google Sign-In Account Chooser Modal (Direct Device Gmail) */}
      <GoogleSignInModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={handleGoogleSuccess}
        suggestedEmail="harshdex1@gmail.com"
      />
    </div>
  );
};
