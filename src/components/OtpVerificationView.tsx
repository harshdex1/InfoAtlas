import React, { useState, useEffect, useRef } from "react";
import { Mail, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, KeyRound, Sparkles, ShieldCheck } from "lucide-react";

interface OtpVerificationViewProps {
  email: string;
  initialPreviewCode?: string;
  onVerify: (code: string) => Promise<{ success: boolean; error?: string }>;
  onResend: () => Promise<{ success: boolean; previewCode?: string; error?: string }>;
  onBack: () => void;
  title?: string;
  subtitle?: string;
  mode?: "login" | "signup" | "google";
}

export const OtpVerificationView: React.FC<OtpVerificationViewProps> = ({
  email,
  initialPreviewCode,
  onVerify,
  onResend,
  onBack,
  title = "Verify your Gmail",
  subtitle = "Enter the 6-digit verification code sent to",
  mode = "login",
}) => {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [previewCode, setPreviewCode] = useState<string | undefined>(initialPreviewCode);
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    let timer: any = null;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleDigitChange = (index: number, val: string) => {
    setError(null);
    const clean = val.replace(/\D/g, "");
    if (!clean) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    // Single digit entry
    const char = clean.slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    // Auto-advance
    if (index < 5 && char) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits are filled
    const fullCode = next.join("");
    if (fullCode.length === 6) {
      triggerVerification(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);

    const targetIdx = Math.min(pasted.length, 5);
    inputRefs.current[targetIdx]?.focus();

    if (pasted.length === 6) {
      triggerVerification(pasted);
    }
  };

  const triggerVerification = async (codeToVerify: string) => {
    if (isVerifying || codeToVerify.length !== 6) return;
    setIsVerifying(true);
    setError(null);

    try {
      const res = await onVerify(codeToVerify);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || "Incorrect 6-digit code. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to verify code.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleQuickFill = (code: string) => {
    if (!code || code.length !== 6) return;
    const split = code.split("");
    setDigits(split);
    inputRefs.current[5]?.focus();
    triggerVerification(code);
  };

  const handleResendClick = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    setError(null);

    try {
      const res = await onResend();
      if (res.success) {
        if (res.previewCode) {
          setPreviewCode(res.previewCode);
        }
        setCountdown(60);
        setCanResend(false);
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setError(res.error || "Failed to resend code.");
      }
    } catch (err: any) {
      setError(err?.message || "Could not resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const isComplete = digits.every((d) => d.length === 1);

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={onBack}
          disabled={isVerifying}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3 cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to email</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white leading-tight">{title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {subtitle}{" "}
              <span className="font-semibold text-cyan-300 break-all">{email}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Simulated Live Gmail Notification Banner (Testing Convenience) */}
      {previewCode && (
        <div className="bg-gradient-to-r from-blue-950/70 via-indigo-950/70 to-slate-900 border border-blue-500/40 rounded-2xl p-3.5 shadow-lg relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-400/30 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-white">Gmail Verification Dispatch</span>
                  <span className="text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    Delivered
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Your 6-digit InfoAtlas code is{" "}
                  <span className="font-mono font-bold text-cyan-300 text-sm tracking-wider">
                    {previewCode}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleQuickFill(previewCode)}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-all shadow shrink-0 cursor-pointer active:scale-95 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-cyan-200" />
              <span>Fill Code</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3.5 rounded-xl flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs p-3.5 rounded-xl flex items-start gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>Gmail confirmed! Finalizing your secure session...</span>
        </div>
      )}

      {/* 6-Digit Segmented Input Boxes */}
      <div className="py-2">
        <label className="block text-xs font-semibold text-slate-300 mb-2.5 text-center">
          Enter 6-digit code
        </label>
        <div className="flex items-center justify-center gap-2 sm:gap-2.5">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={isVerifying || success}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              className={`w-11 h-14 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-xl border transition-all outline-none ${
                digit
                  ? "bg-indigo-950/80 border-indigo-500 text-cyan-300 shadow-md shadow-indigo-500/20"
                  : "bg-slate-950/70 border-slate-700 text-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
              } disabled:opacity-50`}
            />
          ))}
        </div>
      </div>

      {/* Verify Button */}
      <button
        type="button"
        disabled={!isComplete || isVerifying || success}
        onClick={() => triggerVerification(digits.join(""))}
        className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isVerifying ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Verifying Code...</span>
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Gmail Verified</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            <span>Confirm & {mode === "signup" ? "Create Account" : "Sign In"}</span>
          </>
        )}
      </button>

      {/* Resend Cooldown Controls */}
      <div className="pt-2 text-center">
        {canResend ? (
          <button
            type="button"
            onClick={handleResendClick}
            disabled={isResending}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            {isResending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Mail className="w-3.5 h-3.5" />
            )}
            <span>Resend 6-Digit Code</span>
          </button>
        ) : (
          <p className="text-xs text-slate-500">
            Didn't receive the code? Resend in{" "}
            <span className="font-mono font-bold text-slate-300">{countdown}s</span>
          </p>
        )}
      </div>

      {/* Security notice */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>End-to-end verified Gmail identity authentication</span>
      </div>
    </div>
  );
};
