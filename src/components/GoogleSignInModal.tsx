import React, { useState, useEffect } from "react";
import { X, ArrowRight, User as UserIcon, CheckCircle2, ShieldCheck, Mail, Plus, Trash2 } from "lucide-react";
import { safeStorage, useAuth } from "../context/AuthContext";
import { OtpVerificationView } from "./OtpVerificationView";
import { googleSignIn } from "../services/googleAuth";

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string, displayName?: string, photoURL?: string) => Promise<void>;
  suggestedEmail?: string;
}

interface SavedDeviceGmail {
  email: string;
  name: string;
  avatarBg?: string;
}

const BG_GRADIENTS = [
  "bg-gradient-to-tr from-blue-600 to-indigo-600",
  "bg-gradient-to-tr from-emerald-600 to-teal-600",
  "bg-gradient-to-tr from-purple-600 to-pink-600",
  "bg-gradient-to-tr from-amber-600 to-orange-600",
  "bg-gradient-to-tr from-cyan-600 to-blue-600",
];

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  suggestedEmail = "harshdex1@gmail.com",
}) => {
  const { sendEmailOtp, verifyEmailOtp } = useAuth();
  const [customEmail, setCustomEmail] = useState<string>("");
  const [isManualInput, setIsManualInput] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPopupSigningIn, setIsPopupSigningIn] = useState<boolean>(false);

  const handleDirectPopupSignIn = async () => {
    setError(null);
    setIsPopupSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res?.user?.email) {
        await onSuccess(res.user.email, res.user.displayName || undefined, res.user.photoURL || undefined);
        saveAccountToDevice(res.user.email, res.user.displayName || res.user.email.split("@")[0]);
        onClose();
      }
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed before completion.");
      } else {
        setError(err?.message || "Google popup sign-in failed. Please choose an account below.");
      }
    } finally {
      setIsPopupSigningIn(false);
    }
  };

  // OTP Verification state within Google Modal
  const [verifyingAccount, setVerifyingAccount] = useState<{
    email: string;
    name: string;
    previewCode?: string;
  } | null>(null);

  // Manage accounts saved specifically on this device
  const [deviceAccounts, setDeviceAccounts] = useState<SavedDeviceGmail[]>(() => {
    const saved = safeStorage.getJSON<SavedDeviceGmail[]>("infoatlas_device_gmail_list", []);
    if (Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    // Initial device account suggestion
    if (suggestedEmail) {
      const initial: SavedDeviceGmail = {
        email: suggestedEmail,
        name: suggestedEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        avatarBg: BG_GRADIENTS[0],
      };
      safeStorage.setItem("infoatlas_device_gmail_list", JSON.stringify([initial]));
      return [initial];
    }
    return [];
  });

  useEffect(() => {
    if (deviceAccounts.length === 0) {
      setIsManualInput(true);
    }
  }, [deviceAccounts.length]);

  if (!isOpen) return null;

  const saveAccountToDevice = (email: string, name: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const updated = deviceAccounts.filter((a) => a.email.toLowerCase() !== cleanEmail);
    const newAcc: SavedDeviceGmail = {
      email: cleanEmail,
      name: name || cleanEmail.split("@")[0],
      avatarBg: BG_GRADIENTS[updated.length % BG_GRADIENTS.length],
    };
    const newList = [newAcc, ...updated];
    setDeviceAccounts(newList);
    safeStorage.setItem("infoatlas_device_gmail_list", JSON.stringify(newList));
  };

  const handleRemoveAccountFromDevice = (e: React.MouseEvent, emailToRemove: string) => {
    e.stopPropagation();
    const updated = deviceAccounts.filter((a) => a.email.toLowerCase() !== emailToRemove.toLowerCase());
    setDeviceAccounts(updated);
    safeStorage.setItem("infoatlas_device_gmail_list", JSON.stringify(updated));
    if (updated.length === 0) {
      setIsManualInput(true);
    }
  };

  const handleAccountSelect = async (email: string, name: string) => {
    setError(null);
    setSelectedEmail(email);
    setIsSigningIn(true);
    try {
      const otpRes = await sendEmailOtp(email);
      if (!otpRes.success) {
        setError(otpRes.error || "Failed to dispatch verification code.");
        setIsSigningIn(false);
        return;
      }
      setVerifyingAccount({
        email,
        name,
        previewCode: otpRes.previewCode,
      });
    } catch (err: any) {
      setError(err?.message || "Sign in failed. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const emailToUse = customEmail.trim().toLowerCase();
    if (!emailToUse || !emailToUse.includes("@")) {
      setError("Please enter a valid Gmail address.");
      return;
    }
    const isGmail =
      emailToUse.endsWith("@gmail.com") ||
      emailToUse.endsWith("@googlemail.com") ||
      emailToUse.endsWith("@google.com");
    if (!isGmail && emailToUse !== "admin@infoatlas.app") {
      setError("Access is restricted to Google/Gmail accounts. Please enter an email ending in @gmail.com.");
      return;
    }
    setIsSigningIn(true);
    try {
      const derivedName = emailToUse.split("@")[0].replace(/[._]/g, " ");
      const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
      
      const otpRes = await sendEmailOtp(emailToUse);
      if (!otpRes.success) {
        setError(otpRes.error || "Failed to send verification code.");
        setIsSigningIn(false);
        return;
      }

      setVerifyingAccount({
        email: emailToUse,
        name: formattedName,
        previewCode: otpRes.previewCode,
      });
    } catch (err: any) {
      setError(err?.message || "Google sign-in encountered an error.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleVerifyOtpForGoogle = async (code: string) => {
    if (!verifyingAccount) return { success: false, error: "No account pending verification." };
    const res = await verifyEmailOtp(verifyingAccount.email, code, verifyingAccount.name);
    if (res.success) {
      saveAccountToDevice(verifyingAccount.email, verifyingAccount.name);
      setTimeout(() => {
        onClose();
      }, 700);
    }
    return res;
  };

  const handleResendOtpForGoogle = async () => {
    if (!verifyingAccount) return { success: false, error: "No account selected." };
    return await sendEmailOtp(verifyingAccount.email);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#1a1f2c] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 transform transition-all">
        {/* Google Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Authentic Google 4-Color Icon */}
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
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
            <div>
              <h2 className="text-base font-semibold leading-tight">Sign in with Google</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">to continue to InfoAtlas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-4">
          {verifyingAccount ? (
            <OtpVerificationView
              email={verifyingAccount.email}
              initialPreviewCode={verifyingAccount.previewCode}
              onVerify={handleVerifyOtpForGoogle}
              onResend={handleResendOtpForGoogle}
              onBack={() => {
                setVerifyingAccount(null);
                setError(null);
              }}
              title="Verify Device Gmail"
              subtitle="Enter the 6-digit code dispatched to"
              mode="google"
            />
          ) : (
            <>
              {error && (
                <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl">
                  {error}
                </div>
              )}

              {!isManualInput && deviceAccounts.length > 0 ? (
                <div className="space-y-3">
                  {/* Direct Google Popup Button */}
                  <button
                    type="button"
                    disabled={isPopupSigningIn || isSigningIn}
                    onClick={handleDirectPopupSignIn}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isPopupSigningIn ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Signing in with Google...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Sign in with Google Account Popup</span>
                      </>
                    )}
                  </button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                    <span className="flex-shrink mx-2 text-[10px] text-slate-400 font-medium uppercase">or choose device account</span>
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Saved device accounts</p>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      {deviceAccounts.length} on this device
                    </span>
                  </div>

                  {/* Accounts list */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40">
                    {deviceAccounts.map((acc) => {
                      const initial = (acc.name || acc.email || "G").charAt(0).toUpperCase();
                      const bg = acc.avatarBg || BG_GRADIENTS[0];

                      return (
                        <div
                          key={acc.email}
                          className="flex items-center justify-between hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all group"
                        >
                          <button
                            type="button"
                            disabled={isSigningIn}
                            onClick={() => handleAccountSelect(acc.email, acc.name)}
                            className="flex-1 text-left p-3.5 flex items-center gap-3.5 cursor-pointer disabled:opacity-50 min-w-0"
                          >
                            <div className={`w-9 h-9 rounded-full ${bg} text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0`}>
                              {initial}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {acc.name}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {acc.email}
                              </div>
                            </div>
                            {isSigningIn && selectedEmail === acc.email ? (
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
                            ) : (
                              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                            )}
                          </button>

                          {/* Remove account from this device */}
                          <button
                            type="button"
                            onClick={(e) => handleRemoveAccountFromDevice(e, acc.email)}
                            className="p-2 mr-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                            title="Remove from this device list"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Use Another Google / Gmail Account Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setCustomEmail("");
                      setIsManualInput(true);
                    }}
                    className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer bg-white/50 dark:bg-slate-900/50"
                  >
                    <Plus className="w-4 h-4 text-blue-500" />
                    <span>Use another Google / Gmail account</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Enter your Google / Gmail Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        autoFocus
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      A 6-digit code will be sent to verify your device Gmail account.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {deviceAccounts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setIsManualInput(false);
                        }}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Back to Accounts
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSigningIn || !customEmail}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSigningIn ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Code</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* Security footnote */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Verified Direct Sign-In
            </span>
            <span>Google Identity Services</span>
          </div>
        </div>
      </div>
    </div>
  );
};
