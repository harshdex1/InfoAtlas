import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useAppConfig } from "../context/AppConfigContext";
import {
  Search,
  Moon,
  Sun,
  Settings,
  LogOut,
  Menu,
  Sparkles,
  User as UserIcon,
  MessageSquareCode,
  Shield,
  ChevronDown,
  Code2,
  FileText,
  Mic,
  MicOff,
  X,
  AlertCircle,
  Radio,
  Home,
  MapPin,
  Newspaper,
  Award,
  Trophy,
  Compass,
  Mail,
  Bookmark,
  History,
  Tag,
} from "lucide-react";
import { InfoAtlasLogo } from "./InfoAtlasLogo";
import { LanguageSelector } from "./LanguageSelector";

interface TopNavbarProps {
  onSearchSubmit: (q: string) => void;
  onOpenProfile: () => void;
  onOpenAI: () => void;
  onOpenDeveloperStudio?: () => void;
  onOpenEditorNewsroom?: () => void;
  isDark: boolean;
  isAiOpen?: boolean;
  toggleTheme: () => void;
  onToggleMobileSidebar: () => void;
  onNavigateHome: () => void;
  onNavigateContact?: () => void;
  currentView?: string;
  onNavigate?: (view: any) => void;
  selectedNewsCategory?: string;
  onCategorySelect?: (cat: string) => void;
}

const BCP47_LANGUAGE_MAP: Record<string, string> = {
  en: "en-US",
  hi: "hi-IN",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  bn: "bn-IN",
  mr: "mr-IN",
  te: "te-IN",
  ta: "ta-IN",
  gu: "gu-IN",
  ar: "ar-SA",
  ja: "ja-JP",
};

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onSearchSubmit,
  onOpenProfile,
  onOpenAI,
  onOpenDeveloperStudio,
  onOpenEditorNewsroom,
  isDark,
  isAiOpen = false,
  toggleTheme,
  onToggleMobileSidebar,
  onNavigateHome,
  onNavigateContact,
  currentView = "home",
  onNavigate,
  selectedNewsCategory,
  onCategorySelect,
}) => {
  const { user, logout, isAdmin, isDeveloper, isEditor } = useAuth();
  const { t, language, currentLang } = useLanguage();
  const { config } = useAppConfig();
  const [searchVal, setSearchVal] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  interface UpperTabItem {
    id: string;
    view: string;
    label: string;
    icon: any;
    enabled: boolean;
    badge?: string;
    category?: string;
    isCustomCategory?: boolean;
  }

  // Upper navigation tabs configuration
  const coreUpperTabs: UpperTabItem[] = [
    {
      id: "home",
      view: "home",
      label: t("home", "Home"),
      icon: Home,
      enabled: true,
    },
    {
      id: "local-news",
      view: "local-news",
      label: t("local_news", "State & District"),
      icon: MapPin,
      enabled: config?.featureToggles?.localNews !== false,
    },
    {
      id: "news",
      view: "news",
      label: t("news", "Latest News"),
      icon: Newspaper,
      enabled: true,
    },
    {
      id: "cricket",
      view: "cricket",
      label: t("cricket", "Cricket"),
      icon: Award,
      enabled: config?.featureToggles?.cricket !== false,
      badge: "LIVE",
    },
    {
      id: "sports",
      view: "sports",
      label: t("sports", "Sports"),
      icon: Trophy,
      enabled: config?.featureToggles?.sports !== false,
    },
    {
      id: "knowledge",
      view: "knowledge",
      label: t("knowledge", "Knowledge"),
      icon: Compass,
      enabled: config?.featureToggles?.knowledge !== false,
    },
    {
      id: "gmail",
      view: "gmail",
      label: t("gmail", "Gmail"),
      icon: Mail,
      enabled: config?.featureToggles?.gmail !== false,
    },
    {
      id: "bookmarks",
      view: "bookmarks",
      label: t("bookmarks", "Bookmarks"),
      icon: Bookmark,
      enabled: true,
    },
    {
      id: "history",
      view: "history",
      label: t("history", "History"),
      icon: History,
      enabled: true,
    },
  ];

  // Dynamic custom categories curated by Developer AI
  const customCategoryTabs: UpperTabItem[] = (config?.customCategories || []).map((catName) => ({
    id: `custom-${catName}`,
    view: "news",
    category: catName,
    label: catName,
    icon: Tag,
    enabled: true,
    isCustomCategory: true,
  }));

  const allVisibleTabs: UpperTabItem[] = [
    ...coreUpperTabs.filter((t) => t.enabled),
    ...customCategoryTabs,
  ];

  const handleTabClick = (tab: UpperTabItem) => {
    if (tab.isCustomCategory && tab.category) {
      if (onCategorySelect) {
        onCategorySelect(tab.category);
      }
      if (onNavigate) {
        onNavigate("news");
      }
    } else {
      if (tab.view === "home") {
        onNavigateHome();
      } else if (onNavigate) {
        onNavigate(tab.view);
      }
    }
  };

  const isTabActive = (tab: any) => {
    if (tab.isCustomCategory) {
      return currentView === "news" && selectedNewsCategory === tab.category;
    }
    if (tab.view === "home") {
      return currentView === "home";
    }
    if (tab.view === "news") {
      return currentView === "news" && (!selectedNewsCategory || selectedNewsCategory === "all");
    }
    return currentView === tab.view;
  };

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);
  const [isSubmittingFromVoice, setIsSubmittingFromVoice] = useState(false);
  const recognitionRef = useRef<any>(null);
  const autoSubmitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect SpeechRecognition support on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsVoiceSupported(Boolean(SpeechRecognition));
    }
  }, []);

  // Stop listening cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current);
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
      autoSubmitTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    setIsListening(false);
    setIsSubmittingFromVoice(false);
  }, []);

  const startListening = useCallback(() => {
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
      autoSubmitTimeoutRef.current = null;
    }
    setVoiceError(null);
    setTranscriptPreview("");
    setIsSubmittingFromVoice(false);

    const SpeechRecognition =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setVoiceError("Voice search is not supported by your browser. Please use Google Chrome, Edge, or Safari.");
      setTimeout(() => setVoiceError(null), 5000);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Select BCP-47 locale based on active language or browser default
      const bcp47Locale = BCP47_LANGUAGE_MAP[language] || (typeof navigator !== "undefined" ? navigator.language : "en-US") || "en-US";
      recognition.lang = bcp47Locale;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const recognizedText = final || interim;
        if (recognizedText) {
          setSearchVal(recognizedText);
          setTranscriptPreview(recognizedText);
        }

        if (final && final.trim()) {
          const finalQuery = final.trim();
          setIsSubmittingFromVoice(true);

          if (autoSubmitTimeoutRef.current) {
            clearTimeout(autoSubmitTimeoutRef.current);
          }

          // Hands-free auto submit with a brief 750ms grace period for visual confirmation
          autoSubmitTimeoutRef.current = setTimeout(() => {
            onSearchSubmit(finalQuery);
            setIsListening(false);
            setTranscriptPreview("");
            setIsSubmittingFromVoice(false);
            setShowMobileSearch(false);
          }, 750);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error event:", event.error);
        if (event.error === "no-speech") {
          setVoiceError("No speech detected. Tap the mic and speak clearly.");
        } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setVoiceError("Microphone permission was denied. Please allow microphone access in your browser settings.");
        } else if (event.error === "audio-capture") {
          setVoiceError("No microphone found. Please connect an audio input device.");
        } else if (event.error === "network") {
          setVoiceError("Network issue during speech recognition. Please check your internet connection.");
        } else if (event.error !== "aborted") {
          setVoiceError(`Voice input error: ${event.error}`);
        }
        setIsListening(false);
        setTimeout(() => setVoiceError(null), 4500);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("Speech recognition start failed:", err);
      setVoiceError("Could not start speech recognition. Please check microphone permissions.");
      setIsListening(false);
      setTimeout(() => setVoiceError(null), 4500);
    }
  }, [language, onSearchSubmit]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isListening) {
      stopListening();
    }
    if (searchVal.trim()) {
      onSearchSubmit(searchVal.trim());
      setSearchVal("");
      setShowMobileSearch(false);
    }
  };

  const activeLocaleName = currentLang?.name || (language === "hi" ? "Hindi" : "English");

  return (
    <div className="sticky top-0 z-50">
      <style>{`
        @keyframes soundwaveBar {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
      `}</style>

      <header className={`h-[60px] sm:h-[66px] backdrop-blur-md border-b flex items-center justify-between px-2 sm:px-6 transition-colors ${
        isDark ? "bg-slate-950/95 border-slate-800 text-white" : "bg-white border-[#E0E9FA] text-[#102B59]"
      }`}>
        {/* Left: Logo & Mobile Menu Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className={`p-2 rounded-xl md:hidden transition-colors ${isDark ? "hover:bg-slate-900 text-slate-300" : "hover:bg-[#F5F8FF] text-[#102B59]"}`}
            title="Toggle Navigation Menu"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-2 group cursor-pointer text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            title="InfoAtlas Home"
          >
            <InfoAtlasLogo
              variant="full"
              size="md"
              animated
              isDark={isDark}
              withTagline={false}
            />
          </button>
        </div>

        {/* Center: Global Search Input with Voice-to-Text (Tablet & Desktop) */}
        <div className="flex-1 max-w-xs md:max-w-sm lg:max-w-xl mx-2 sm:mx-4 hidden md:block relative shrink min-w-0">
          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#60769A] pointer-events-none" />
            
            <input
              type="text"
              value={searchVal}
              onChange={(e) => {
                setSearchVal(e.target.value);
                if (isListening) stopListening();
              }}
              placeholder={
                isListening
                  ? `Listening in ${activeLocaleName}... Speak now...`
                  : t("search_placeholder", "Search for anything... (e.g., countries, people, topics, news)")
              }
              className={`w-full text-xs sm:text-sm pl-10 pr-20 py-2.5 rounded-xl border transition-all ${
                isListening
                  ? "ring-2 ring-rose-500/60 border-rose-500 bg-rose-500/10 placeholder-rose-400 font-medium"
                  : isDark
                  ? "bg-slate-900/90 border-slate-800 text-white placeholder-slate-500 focus:border-[#386BFF] focus:bg-slate-900"
                  : "bg-[#F5F8FF] border-[#E0E9FA] text-[#102B59] placeholder-[#60769A] focus:border-[#386BFF] focus:bg-white"
              }`}
            />

            {/* Right Controls: Clear & Voice Search Button */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchVal && !isListening && (
                <button
                  type="button"
                  onClick={() => setSearchVal("")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                  }`}
                  title="Clear search text"
                  aria-label="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Voice-to-Text Microphone Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`relative p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  isListening
                    ? "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/40 ring-2 ring-rose-400/60"
                    : isDark
                    ? "text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
                    : "text-slate-500 hover:text-[#386BFF] hover:bg-blue-50"
                }`}
                title={
                  isListening
                    ? "Listening... Click to stop"
                    : isVoiceSupported
                    ? `Voice search (${activeLocaleName})`
                    : "Voice search not supported in this browser"
                }
                aria-label={isListening ? "Stop voice search" : "Start voice search"}
              >
                {isListening ? (
                  <>
                    <span className="absolute -inset-1 rounded-xl bg-rose-500/40 animate-ping pointer-events-none" />
                    <Mic className="w-4 h-4 relative z-10 animate-pulse text-white" />
                  </>
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>

          {/* Interactive Voice Search Feedback Card / Error Dropdown */}
          {(isListening || isSubmittingFromVoice || voiceError) && (
            <div
              className={`absolute left-0 right-0 top-full mt-2 z-50 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
                voiceError
                  ? isDark
                    ? "bg-rose-950/95 border-rose-800/80 text-rose-200"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                  : isDark
                  ? "bg-slate-900/95 border-slate-800 text-white shadow-cyan-950/30"
                  : "bg-white/95 border-slate-200 text-slate-900 shadow-blue-100"
              }`}
            >
              {voiceError ? (
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="font-medium leading-relaxed">{voiceError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVoiceError(null)}
                    className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Real-time bouncing sound wave equalizer */}
                    <div className="flex items-center gap-1 h-5 shrink-0 px-1">
                      <span
                        className="w-1 bg-rose-500 rounded-full"
                        style={{ animation: "soundwaveBar 0.7s ease-in-out infinite 0s" }}
                      />
                      <span
                        className="w-1 bg-rose-500 rounded-full"
                        style={{ animation: "soundwaveBar 0.7s ease-in-out infinite 0.15s" }}
                      />
                      <span
                        className="w-1 bg-rose-500 rounded-full"
                        style={{ animation: "soundwaveBar 0.7s ease-in-out infinite 0.3s" }}
                      />
                      <span
                        className="w-1 bg-rose-500 rounded-full"
                        style={{ animation: "soundwaveBar 0.7s ease-in-out infinite 0.45s" }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                          {isSubmittingFromVoice ? "Searching..." : "Listening..."}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Language: {activeLocaleName} ({BCP47_LANGUAGE_MAP[language] || "en-US"})
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate mt-0.5">
                        {transcriptPreview ? (
                          <span className="font-semibold text-rose-500 dark:text-rose-400">
                            &quot;{transcriptPreview}&quot;
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">
                            Say something like &quot;Latest space exploration&quot; or &quot;Cricket score&quot;...
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={stopListening}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors shrink-0 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Language Switcher, AI, Mobile Search Toggle, Theme, Profile */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile Search Toggle Button (< md) */}
          <button
            type="button"
            onClick={() => {
              setShowMobileSearch(!showMobileSearch);
              if (isListening) stopListening();
            }}
            className={`p-2 rounded-xl md:hidden transition-colors cursor-pointer shrink-0 ${
              showMobileSearch
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : isDark
                ? "hover:bg-slate-900 text-slate-300"
                : "hover:bg-[#F5F8FF] text-[#102B59]"
            }`}
            title="Toggle Search & Voice Input"
            aria-label="Toggle mobile search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Language Selector Button */}
          <LanguageSelector isDark={isDark} variant="navbar" className="shrink-0" />

          {/* Developer AI Studio Button (Exclusively for developer / admin) */}
          {isDeveloper && onOpenDeveloperStudio && (
            <button
              type="button"
              onClick={onOpenDeveloperStudio}
              aria-label="Developer AI Studio"
              title="Developer AI Studio — Live App Modification Engine"
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-gradient-to-r from-indigo-700 to-violet-700 hover:from-indigo-600 hover:to-violet-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40 shrink-0"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
              <span className="hidden lg:inline text-[11px]">Dev AI</span>
            </button>
          )}

          {/* Editor AI Newsroom Button (Exclusively for editor / developer / admin) */}
          {isEditor && onOpenEditorNewsroom && (
            <button
              type="button"
              onClick={onOpenEditorNewsroom}
              aria-label="Editor AI Newsroom"
              title="Editor AI Newsroom — Suggest Topics & Publish News"
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-400/40 shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
              <span className="hidden lg:inline text-[11px]">Editor AI</span>
            </button>
          )}

          {/* Dedicated, Independent AI Assistant Button */}
          <button
            type="button"
            onClick={onOpenAI}
            aria-label={t("ai_assistant", "AI Assistant")}
            title={t("ai_assistant", "AI Assistant")}
            className={`flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              isAiOpen
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400/50"
                : isDark
                ? "bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/60 hover:border-indigo-600"
                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden lg:inline text-[11px]">{t("ai_assistant", "AI Assistant")}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
              isDark ? "hover:bg-slate-900 text-amber-400" : "hover:bg-[#F5F8FF] text-[#386BFF]"
            }`}
            title={isDark ? t("theme_light", "Light Mode") : t("theme_dark", "Dark Mode")}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Prominent Profile Button with Account Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`flex items-center gap-1.5 px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                showProfileMenu
                  ? "border-[#386BFF] ring-2 ring-[#386BFF]/20 bg-blue-50/50 dark:bg-slate-850"
                  : isDark
                  ? "border-slate-800 hover:border-slate-700 bg-slate-900/80 hover:bg-slate-800"
                  : "border-[#E0E9FA] hover:border-[#386BFF]/50 bg-white hover:bg-slate-50 shadow-xs"
              }`}
              aria-label="User Profile and Account Settings"
              title="User Profile & Settings"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-[#386BFF] to-[#7252FF] text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="text-left hidden lg:block">
                <span className="text-xs font-bold block leading-tight text-slate-800 dark:text-white truncate max-w-[90px]">
                  {user?.displayName || "Profile"}
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight">Account</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showProfileMenu ? "rotate-180" : ""}`} />
            </button>

            {showProfileMenu && (
              <div className={`absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl border py-2 z-50 ${
                isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-[#E0E9FA] text-[#102B59]"
              }`}>
                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-semibold truncate">{user?.displayName || "User"}</p>
                  <p className="text-[11px] text-[#60769A] truncate">{user?.email}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenProfile();
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs flex items-center gap-2.5 hover:bg-[#F5F8FF] dark:hover:bg-slate-800 hover:text-[#386BFF] transition-colors cursor-pointer font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800/60"
                >
                  <UserIcon className="w-4 h-4 text-[#386BFF]" />
                  <span>{t("user_profile", "My Profile & Settings")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenProfile();
                  }}
                  className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 hover:bg-[#F5F8FF] dark:hover:bg-slate-800 hover:text-[#386BFF] transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  <span>{t("account_settings", "Account Settings")}</span>
                </button>

                {isDeveloper && onOpenDeveloperStudio && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenDeveloperStudio();
                    }}
                    className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer font-bold"
                  >
                    <Code2 className="w-4 h-4 text-indigo-400" />
                    <span>Developer AI Studio</span>
                  </button>
                )}

                {isEditor && onOpenEditorNewsroom && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenEditorNewsroom();
                    }}
                    className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer font-bold"
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Editor AI Newsroom</span>
                  </button>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenProfile();
                    }}
                    className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer font-semibold"
                  >
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>{t("admin_console", "Admin Console")}</span>
                  </button>
                )}

                {onNavigateContact && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigateContact();
                    }}
                    className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 hover:bg-[#F5F8FF] dark:hover:bg-slate-800 hover:text-[#386BFF] transition-colors cursor-pointer text-[#102B59] dark:text-slate-200"
                  >
                    <MessageSquareCode className="w-4 h-4 text-[#386BFF]" />
                    <span>{t("contact", "Developer & Docs")}</span>
                  </button>
                )}

                <div className="border-t border-slate-200 dark:border-slate-800 my-1"></div>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t("sign_out", "Sign Out")}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Expandable Mobile/Tablet Search Bar with Voice-to-Text */}
      {showMobileSearch && (
        <div
          className={`md:hidden px-3 py-2.5 border-b shadow-lg transition-colors relative animate-in fade-in slide-in-from-top-2 duration-200 ${
            isDark ? "bg-slate-950/95 border-slate-800 text-white" : "bg-white/95 border-[#E0E9FA] text-[#102B59]"
          }`}
        >
          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#60769A] pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchVal}
              onChange={(e) => {
                setSearchVal(e.target.value);
                if (isListening) stopListening();
              }}
              placeholder={
                isListening
                  ? `Listening in ${activeLocaleName}...`
                  : t("search_placeholder", "Search for anything...")
              }
              className={`w-full text-xs pl-10 pr-20 py-2.5 rounded-xl border transition-all ${
                isListening
                  ? "ring-2 ring-rose-500/60 border-rose-500 bg-rose-500/10 placeholder-rose-400 font-medium"
                  : isDark
                  ? "bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-[#386BFF]"
                  : "bg-[#F5F8FF] border-[#E0E9FA] text-[#102B59] placeholder-[#60769A] focus:border-[#386BFF] focus:bg-white"
              }`}
            />

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchVal && !isListening && (
                <button
                  type="button"
                  onClick={() => setSearchVal("")}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Voice-to-Text Microphone Button (Mobile) */}
              <button
                type="button"
                onClick={toggleListening}
                className={`relative p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  isListening
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/40 ring-2 ring-rose-400"
                    : isDark
                    ? "text-slate-400 hover:text-cyan-300"
                    : "text-slate-500 hover:text-[#386BFF]"
                }`}
                title={isListening ? "Listening... Click to stop" : "Voice search"}
              >
                {isListening ? (
                  <>
                    <span className="absolute -inset-1 rounded-xl bg-rose-500/40 animate-ping pointer-events-none" />
                    <Mic className="w-4 h-4 relative z-10 animate-pulse text-white" />
                  </>
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>

          {/* Mobile Listening Feedback */}
          {(isListening || isSubmittingFromVoice || voiceError) && (
            <div
              className={`mt-2 p-2.5 rounded-xl border text-xs shadow-md transition-all ${
                voiceError
                  ? "bg-rose-950/80 border-rose-800 text-rose-200"
                  : isDark
                  ? "bg-slate-900/90 border-slate-800 text-white"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              {voiceError ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-[11px]">{voiceError}</span>
                  </div>
                  <button type="button" onClick={() => setVoiceError(null)}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                    <span className="text-[11px] font-bold text-rose-500">
                      {isSubmittingFromVoice ? "Searching..." : "Listening..."}
                    </span>
                    <span className="text-[11px] text-slate-300 truncate">
                      {transcriptPreview || "Speak now..."}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={stopListening}
                    className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-200"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tier 2: Sticky Upper Navigation Tabs Bar (Visible on Mobile, Tablet & Desktop) */}
      <nav
        aria-label="Upper tabs navigation"
        className={`w-full border-b backdrop-blur-md transition-colors select-none ${
          isDark
            ? "bg-slate-950/95 border-slate-800 text-slate-300"
            : "bg-white/95 border-[#E0E9FA] text-[#102B59]"
        }`}
      >
        <div className="relative max-w-full overflow-hidden">
          <div className="flex items-center gap-1.5 px-2.5 sm:px-6 py-2 overflow-x-auto scrollbar-none touch-pan-x">
            {allVisibleTabs.map((tab) => {
              const active = isTabActive(tab);
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400/50"
                      : isDark
                      ? "text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800"
                      : "text-slate-600 hover:text-[#102B59] hover:bg-[#F5F8FF] border border-transparent hover:border-[#E0E9FA]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-white" : isDark ? "text-slate-400" : "text-[#386BFF]"}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-rose-500/20 text-rose-500 border border-rose-500/30"
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 ml-0.5 animate-pulse shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

