import React, { useState, useRef, useEffect } from "react";
import { useLanguage, SUPPORTED_LANGUAGES, LanguageItem } from "../context/LanguageContext";
import { Globe, Check, ChevronDown, Sparkles } from "lucide-react";

interface LanguageSelectorProps {
  isDark: boolean;
  variant?: "navbar" | "sidebar" | "compact";
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  isDark,
  variant = "navbar",
  className = "",
}) => {
  const { language, setLanguage, currentLang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (code: string) => {
    setLanguage(code);
    setIsOpen(false);
    setSearch("");
  };

  if (variant === "compact") {
    return (
      <div className="relative inline-block" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            isDark
              ? "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          } ${className}`}
          title="Change Language / भाषा बदलें"
        >
          <Globe className="w-3.5 h-3.5 text-[#386BFF]" />
          <span>{currentLang.nativeName}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {isOpen && (
          <div
            className={`absolute right-0 mt-1.5 w-48 rounded-xl shadow-xl border py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 ${
              isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => handleSelect(l.code)}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  language === l.code
                    ? "bg-[#386BFF]/10 text-[#386BFF] font-bold"
                    : isDark
                    ? "hover:bg-slate-800 text-slate-300"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{l.flag}</span>
                  <span>{l.nativeName}</span>
                </span>
                {language === l.code && <Check className="w-3.5 h-3.5 text-[#386BFF]" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-sm ${
          isDark
            ? "bg-slate-900/90 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-[#386BFF]/50"
            : "bg-white border-[#E0E9FA] text-[#102B59] hover:bg-[#F5F8FF] hover:border-[#386BFF]/40"
        } ${isOpen ? "ring-2 ring-[#386BFF]/30 border-[#386BFF]" : ""}`}
        title="Change Language / भाषा बदलें"
      >
        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[13px] leading-none shrink-0">
          {currentLang.flag}
        </div>
        <span className="font-semibold hidden sm:inline">{currentLang.nativeName}</span>
        <span className="font-semibold inline sm:hidden text-[10px] uppercase">{currentLang.code}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-64 sm:w-72 rounded-2xl shadow-2xl border p-2 z-50 animate-in fade-in zoom-in-95 duration-150 ${
            isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-[#E0E9FA] text-[#102B59]"
          }`}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Globe className="w-4 h-4 text-[#386BFF]" />
              <span>{t("select_language", "Select Language / भाषा चुनें")}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">12 Languages</span>
          </div>

          {/* Quick Dual Toggle: English & हिन्दी */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 rounded-xl my-1.5 flex gap-1.5">
            <button
              type="button"
              onClick={() => handleSelect("en")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                language === "en"
                  ? "bg-[#386BFF] text-white shadow-sm"
                  : isDark
                  ? "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>🇺🇸</span>
              <span>English</span>
              {language === "en" && <Check className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelect("hi")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                language === "hi"
                  ? "bg-[#386BFF] text-white shadow-sm"
                  : isDark
                  ? "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>🇮🇳</span>
              <span>हिन्दी</span>
              {language === "hi" && <Check className="w-3 h-3" />}
            </button>
          </div>

          {/* Search box if needed */}
          <div className="px-2 pt-1 pb-1.5">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search language / भाषा खोजें..."
              className={`w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none ${
                isDark ? "bg-slate-950 border-slate-800 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
              }`}
            />
          </div>

          {/* Languages List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5 custom-scrollbar">
            {filteredLanguages.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => handleSelect(l.code)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                  language === l.code
                    ? "bg-[#386BFF]/15 text-[#386BFF] font-bold"
                    : isDark
                    ? "hover:bg-slate-800/80 text-slate-300"
                    : "hover:bg-[#F5F8FF] text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{l.flag}</span>
                  <div>
                    <span className="font-semibold block leading-tight">{l.nativeName}</span>
                    <span className="text-[10px] text-slate-400 block">{l.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {l.code === "hi" && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Popular
                    </span>
                  )}
                  {language === l.code && <Check className="w-4 h-4 text-[#386BFF]" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
