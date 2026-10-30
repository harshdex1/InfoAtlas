import React, { useEffect } from "react";
import { AlertTriangle, LogOut, ArrowLeft, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { InfoAtlasLogo } from "./InfoAtlasLogo";

interface ExitConfirmModalProps {
  isOpen: boolean;
  onStay: () => void;
  onExit: () => void;
  isDark: boolean;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onStay,
  onExit,
  isDark,
}) => {
  const { t } = useLanguage();

  // Handle ESC key to cancel/stay
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onStay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onStay]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onStay}
    >
      <div
        className={`w-full max-w-sm rounded-3xl border shadow-2xl p-6 sm:p-7 relative overflow-hidden transition-all transform scale-100 ${
          isDark
            ? "bg-slate-900 border-slate-800 text-white"
            : "bg-white border-[#E0E9FA] text-[#102B59]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <InfoAtlasLogo variant="compact" size="sm" isDark={isDark} />
          <button
            type="button"
            onClick={onStay}
            className={`p-1.5 rounded-xl transition-colors ${
              isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
            }`}
            aria-label={t("close", "Close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3.5 mb-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 id="exit-modal-title" className="text-base sm:text-lg font-bold">
              {t("exit_title", "Exit InfoAtlas?")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("exit_message", "Are you sure you want to exit the application?")}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onStay}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-700 text-[#102B59] dark:text-slate-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("exit_stay", "Stay")}</span>
          </button>

          <button
            type="button"
            onClick={onExit}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t("exit_confirm", "Exit")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
