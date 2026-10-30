import React, { useState, useEffect, useMemo } from "react";
import { NewsArticle } from "../types";
import { fetchLocalDistrictNews, askGemini } from "../services/api";
import { useAuth, safeStorage } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useNavigation } from "../context/NavigationContext";
import {
  INDIA_STATES,
  DEFAULT_SELECTED_LOCATION,
} from "../utils/indiaLocations";
import {
  MapPin,
  ChevronDown,
  Sparkles,
  Bookmark,
  Check,
  RefreshCw,
  Search,
  Share2,
  Clock,
  Compass,
  X,
  Newspaper,
  Flame,
} from "lucide-react";
import { formatSafeTime } from "../utils/date";
import { LanguageSelector } from "./LanguageSelector";
import { ArticleFollowUpModal } from "./ArticleFollowUpModal";
import { resolveStoryVisual, generateCivicSvgIllustration } from "../utils/localNewsImages";

interface LocalDistrictNewsPageProps {
  onSelectArticle: (article: NewsArticle) => void;
  isDark: boolean;
}

const LOCAL_CATEGORIES = [
  { id: "all", labelKey: "all", fallbackEn: "All District News" },
  { id: "civic", labelKey: "cat_civic", fallbackEn: "Civic & Administration" },
  { id: "development", labelKey: "cat_development", fallbackEn: "Development & Infra" },
  { id: "crime", labelKey: "cat_crime", fallbackEn: "Law, Order & Safety" },
  { id: "events", labelKey: "cat_events", fallbackEn: "Culture & Events" },
  { id: "business", labelKey: "cat_trade", fallbackEn: "Markets & Trade" },
];

export const LocalDistrictNewsPage: React.FC<LocalDistrictNewsPageProps> = ({
  onSelectArticle,
  isDark,
}) => {
  const { isBookmarked, addBookmark, removeBookmark } = useAuth();
  const { language, t } = useLanguage();
  const { registerBackHandler } = useNavigation();
  const isHindi = language === "hi";

  // Persistent user selected state & district
  const [selectedStateId, setSelectedStateId] = useState<string>(() => {
    return safeStorage.getItem("infoatlas_local_state_id") || DEFAULT_SELECTED_LOCATION.stateId;
  });

  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(() => {
    return safeStorage.getItem("infoatlas_local_district_id") || DEFAULT_SELECTED_LOCATION.districtId;
  });

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [districtOverview, setDistrictOverview] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Area selector modal
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);
  const [selectorStep, setSelectorStep] = useState<"state" | "district">("state");
  const [tempStateId, setTempStateId] = useState<string>(selectedStateId);
  const [searchFilter, setSearchFilter] = useState<string>("");

  // In-article Follow-Up Modal for local news
  const [followUpArticle, setFollowUpArticle] = useState<NewsArticle | null>(null);

  // Local fallback image cache per article ID to prevent broken links
  const [fallbackImages, setFallbackImages] = useState<Record<string, string>>({});

  // Current selected objects
  const currentState = useMemo(() => {
    return INDIA_STATES.find((s) => s.id === selectedStateId) || INDIA_STATES[0];
  }, [selectedStateId]);

  const currentDistrict = useMemo(() => {
    const d = currentState.districts.find((dist) => dist.id === selectedDistrictId);
    return d || currentState.districts[0] || { id: "general", name: currentState.name, hindiName: currentState.hindiName };
  }, [currentState, selectedDistrictId]);

  const tempState = useMemo(() => {
    return INDIA_STATES.find((s) => s.id === tempStateId) || currentState;
  }, [tempStateId, currentState]);

  // Priority Back Button Handling for modals inside Local News
  useEffect(() => {
    const unregister = registerBackHandler(70, () => {
      if (followUpArticle) {
        setFollowUpArticle(null);
        return true;
      }
      if (isSelectorOpen) {
        setIsSelectorOpen(false);
        return true;
      }
      return false;
    }, "local_news_modals");

    return () => unregister();
  }, [followUpArticle, isSelectorOpen, registerBackHandler]);

  // Load news whenever state, district, category, or language changes
  const loadDistrictNews = async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await fetchLocalDistrictNews({
        state: currentState.name,
        district: currentDistrict.name,
        category: activeCategory,
        lang: language,
      });

      // Prepend stories published by editors directly for this district/state
      let publishedForDistrict: NewsArticle[] = [];
      try {
        const pubRes = await fetch(
          `/api/news/published?tab=local-news&state=${encodeURIComponent(currentState.name)}&district=${encodeURIComponent(currentDistrict.name)}`
        );
        if (pubRes.ok) {
          const pubData = await pubRes.json();
          if (Array.isArray(pubData.articles)) {
            publishedForDistrict = pubData.articles.map((art: any) => ({
              ...art,
              url: art.url || `https://infoatlas.app/stories/${art.id}`,
            }));
          }
        }
      } catch (pErr) {
        // Fallback
      }

      setArticles([...publishedForDistrict, ...(data.articles || [])]);
      if (data.overview) {
        setDistrictOverview(data.overview);
      }
    } catch (err) {
      console.error("Failed to load local news:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDistrictNews(false);
  }, [selectedStateId, selectedDistrictId, activeCategory, language]);

  const handleStateSelect = (stateId: string) => {
    setTempStateId(stateId);
    setSelectorStep("district");
    setSearchFilter("");
  };

  const handleDistrictSelect = (districtId: string) => {
    setSelectedStateId(tempStateId);
    setSelectedDistrictId(districtId);
    safeStorage.setItem("infoatlas_local_state_id", tempStateId);
    safeStorage.setItem("infoatlas_local_district_id", districtId);
    setIsSelectorOpen(false);
    setSearchFilter("");
  };

  const handleOpenSelector = () => {
    setTempStateId(selectedStateId);
    setSelectorStep("state");
    setSearchFilter("");
    setIsSelectorOpen(true);
  };

  // Filtered lists for selector modal
  const filteredStates = useMemo(() => {
    if (!searchFilter.trim()) return INDIA_STATES;
    const q = searchFilter.toLowerCase();
    return INDIA_STATES.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.hindiName.includes(q) ||
        s.districts.some((d) => d.name.toLowerCase().includes(q) || d.hindiName.includes(q))
    );
  }, [searchFilter]);

  const filteredDistricts = useMemo(() => {
    if (!searchFilter.trim()) return tempState.districts;
    const q = searchFilter.toLowerCase();
    return tempState.districts.filter(
      (d) => d.name.toLowerCase().includes(q) || d.hindiName.includes(q)
    );
  }, [tempState, searchFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Hero Location Banner & Area Selector Bar */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-sm transition-all relative overflow-hidden ${
          isDark
            ? "bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border-slate-800"
            : "bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/30 border-[#E0E9FA]"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Location Title & Badge */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#386BFF]/10 text-[#386BFF] border border-[#386BFF]/20 shadow-xs">
                <MapPin className="w-3.5 h-3.5 text-[#386BFF]" />
                <span>{t("district_coverage", "District & Local Coverage")}</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">
                · {t("live_grounded_feeds", "Live Grounded Feeds")}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {isHindi ? currentDistrict.hindiName : currentDistrict.name},{" "}
              <span className="text-[#386BFF]">
                {isHindi ? currentState.hindiName : currentState.name}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              {districtOverview ||
                (isHindi
                  ? `${currentDistrict.hindiName} और ${currentState.hindiName} के ताज़ा प्रशासनिक, विकास और स्थानीय समाचार।`
                  : `Real-time localized updates, civic development, law & order, and municipal events from ${currentDistrict.name}, ${currentState.name}.`)}
            </p>
          </div>

          {/* Area Switcher Trigger & Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Change Area Button */}
            <button
              type="button"
              onClick={handleOpenSelector}
              className="flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-2xl bg-gradient-to-r from-[#386BFF] to-[#7252FF] hover:from-[#2e59d9] hover:to-[#5e3ed9] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#386BFF]/25 transition-all cursor-pointer active:scale-95"
            >
              <MapPin className="w-4 h-4 text-cyan-200" />
              <span>
                {isHindi
                  ? `ज़िला बदलें (${currentDistrict.hindiName})`
                  : `${t("change_area", "Change Area")} (${currentDistrict.name})`}
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Refresh Feed */}
            <button
              type="button"
              onClick={() => loadDistrictNews(true)}
              disabled={isRefreshing}
              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850"
                  : "bg-white border-[#E0E9FA] text-[#102B59] hover:bg-[#F5F8FF]"
              }`}
              title={t("refresh", "Refresh")}
              aria-label={t("refresh", "Refresh")}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#386BFF]" : ""}`} />
            </button>

            {/* Language Selector in Local News Header */}
            <LanguageSelector isDark={isDark} variant="compact" />
          </div>
        </div>

        {/* Quick Popular States Strip */}
        <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider flex items-center gap-1">
            <Compass className="w-3 h-3 text-[#386BFF]" />
            <span>{t("top_states", "Top States:")}</span>
          </span>

          {INDIA_STATES.slice(0, 8).map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => {
                setTempStateId(st.id);
                setSelectedStateId(st.id);
                const firstDist = st.districts[0];
                if (firstDist) {
                  setSelectedDistrictId(firstDist.id);
                  safeStorage.setItem("infoatlas_local_state_id", st.id);
                  safeStorage.setItem("infoatlas_local_district_id", firstDist.id);
                }
              }}
              className={`text-xs px-3 py-1.5 rounded-xl border font-semibold shrink-0 transition-all cursor-pointer ${
                selectedStateId === st.id
                  ? "bg-[#386BFF] border-[#386BFF] text-white shadow-xs"
                  : isDark
                  ? "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                  : "bg-white border-slate-200 text-[#102B59] hover:bg-slate-50"
              }`}
            >
              {isHindi ? st.hindiName : st.name}
            </button>
          ))}
        </div>
      </div>

      {/* Category Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {LOCAL_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 border transition-all cursor-pointer ${
              activeCategory === cat.id
                ? "bg-[#386BFF] border-[#386BFF] text-white shadow-md shadow-blue-500/20"
                : isDark
                ? "bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800"
                : "bg-white border-[#E0E9FA] text-[#102B59] hover:bg-[#F5F8FF]"
            }`}
          >
            {t(cat.labelKey, cat.fallbackEn)}
          </button>
        ))}
      </div>

      {/* Articles Grid or Loading */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-10">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`p-6 rounded-3xl border animate-pulse space-y-4 ${
                isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-[#E0E9FA]"
              }`}
            >
              <div className="h-44 bg-slate-800/60 rounded-2xl w-full" />
              <div className="h-5 bg-slate-800/60 rounded w-3/4" />
              <div className="h-3 bg-slate-800/60 rounded w-full" />
              <div className="h-3 bg-slate-800/60 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
          <Newspaper className="w-12 h-12 text-[#386BFF] mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold mb-1">
            {t("no_district_news", "No news found for this area")}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5">
            {isHindi
              ? "आप श्रेणी बदल सकते हैं या किसी अन्य निकटवर्ती ज़िले का चयन कर सकते हैं।"
              : "Try switching to another category or select a different district."}
          </p>
          <button
            type="button"
            onClick={handleOpenSelector}
            className="px-5 py-2.5 rounded-xl bg-[#386BFF] hover:bg-blue-600 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            {t("select_another_district", "Select Another District")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => {
            const articleKey = article.id || article.url || article.title;
            const bookmarked = isBookmarked(article.url);

            // Deterministic, unique visual association using story identity
            const visual = resolveStoryVisual(article, currentDistrict.name, currentState.name);
            const activeImageUrl = fallbackImages[articleKey] || visual.url;
            const isIllustration = Boolean(fallbackImages[articleKey]) || visual.isIllustration;

            return (
              <div
                key={articleKey}
                onClick={() => onSelectArticle(article)}
                className={`rounded-3xl border overflow-hidden flex flex-col justify-between transition-all group cursor-pointer ${
                  isDark
                    ? "bg-slate-900/50 border-slate-800 hover:border-[#386BFF]/60 hover:shadow-lg hover:shadow-blue-950/30"
                    : "bg-white border-[#E0E9FA] hover:border-[#386BFF]/60 hover:shadow-lg hover:shadow-blue-100/50"
                }`}
              >
                <div>
                  {/* Thumbnail / Local Card Header */}
                  <div className="w-full h-48 bg-slate-950 overflow-hidden relative">
                    <img
                      src={activeImageUrl}
                      alt={article.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={() => {
                        // On image error, gracefully fallback to clean customized SVG illustration for this story
                        if (!fallbackImages[articleKey]) {
                          const svgFallback = generateCivicSvgIllustration(
                            currentDistrict.name,
                            currentState.name,
                            article.title
                          );
                          setFallbackImages((prev) => ({ ...prev, [articleKey]: svgFallback }));
                        }
                      }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />

                    {/* Area Pin Badge */}
                    <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1 border border-slate-700 shadow">
                      <MapPin className="w-3 h-3 text-[#386BFF]" />
                      <span>{isHindi ? currentDistrict.hindiName : currentDistrict.name}</span>
                    </span>

                    {/* Verified Image Attribution Badge */}
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-[10px] font-semibold text-slate-300 border border-slate-700/80 shadow">
                      {isIllustration
                        ? t("editorial_illustration", "Editorial Illustration")
                        : visual.label === "Publisher Media"
                        ? t("publisher_media", "Publisher Media")
                        : visual.label === "Verified Subject Photo"
                        ? (isHindi ? "सत्यापित विषय छायाचित्र" : "Verified Subject Photo")
                        : visual.label === "Verified District Landmark"
                        ? (isHindi ? "ज़िला ऐतिहासिक स्थल" : "Verified District Landmark")
                        : t("verified_photo", "Verified Photo")}
                    </span>

                    {article.isBreaking && (
                      <span className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-rose-600/90 text-white text-[10px] font-bold uppercase tracking-wider shadow flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        <span>Breaking</span>
                      </span>
                    )}
                  </div>

                  {/* Headline & Description */}
                  <div className="p-5">
                    <h3
                      className={`text-sm font-bold mb-2.5 group-hover:text-[#386BFF] transition-colors line-clamp-3 leading-snug ${
                        isDark ? "text-white" : "text-[#102B59]"
                      }`}
                    >
                      {article.title}
                    </h3>

                    <p className="text-xs text-[#60769A] leading-relaxed line-clamp-3">
                      {article.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div className="p-5 pt-0">
                  <div className="flex items-center justify-between text-[11px] text-[#60769A] mb-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="font-semibold truncate pr-2 text-[#102B59] dark:text-slate-300">
                      {article.source}
                    </span>
                    <span className="flex items-center gap-1 shrink-0 text-slate-400">
                      <Clock className="w-3 h-3" />
                      {formatSafeTime(article.publishedAt)}
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Ask Follow-up Button */}
                    <button
                      type="button"
                      onClick={() => setFollowUpArticle(article)}
                      className="flex-1 bg-gradient-to-r from-[#386BFF]/10 to-[#7252FF]/10 hover:from-[#386BFF]/20 hover:to-[#7252FF]/20 text-[#386BFF] border border-[#386BFF]/30 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      title={t("ask_follow_up_btn", "Ask Follow-Up Question")}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="truncate">{t("ask_follow_up", "Ask Follow-Up")}</span>
                    </button>

                    {/* Bookmark Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (bookmarked) {
                          removeBookmark(article.url);
                        } else {
                          addBookmark({
                            title: article.title,
                            snippet: article.description,
                            url: article.url,
                          });
                        }
                      }}
                      className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                        bookmarked
                          ? "bg-[#386BFF] border-[#386BFF] text-white shadow-xs"
                          : isDark
                          ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          : "bg-white border-[#E0E9FA] text-[#60769A] hover:text-[#102B59]"
                      }`}
                      title={bookmarked ? t("bookmarked", "Bookmarked") : t("save_bookmark", "Save Bookmark")}
                      aria-label="Bookmark article"
                    >
                      {bookmarked ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>

                    {/* Share Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: article.title,
                            text: article.description,
                            url: article.url,
                          }).catch(() => {});
                        } else {
                          navigator.clipboard.writeText(article.url);
                        }
                      }}
                      className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                        isDark
                          ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          : "bg-white border-[#E0E9FA] text-[#60769A] hover:text-[#102B59]"
                      }`}
                      title={t("share", "Share")}
                      aria-label="Share article"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STATE & DISTRICT SELECTOR MODAL */}
      {isSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-xl max-h-[85vh] rounded-3xl shadow-2xl border flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 ${
              isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-[#E0E9FA] text-[#102B59]"
            }`}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#386BFF]/10 text-[#386BFF] flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {selectorStep === "state"
                      ? isHindi
                        ? "चरण 1: अपना राज्य चुनें"
                        : `${t("select_state", "Select State")}`
                      : isHindi
                      ? `चरण 2: ${tempState.hindiName} में अपना ज़िला चुनें`
                      : `${t("select_district", "Select District")} - ${tempState.name}`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectorStep === "state"
                      ? isHindi
                        ? "स्थानीय समाचार देखने के लिए पहले अपना राज्य चुनें।"
                        : "Pick a state across India to see local district updates."
                      : isHindi
                      ? "अपने शहर या ज़िले के ताज़ा समाचारों के लिए ज़िला चुनें।"
                      : "Pick your home district or city to filter headlines."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSelectorOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label={t("close", "Close")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectorStep("state")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectorStep === "state"
                    ? "bg-[#386BFF] text-white shadow-xs"
                    : "text-slate-500 hover:text-black dark:hover:text-white"
                }`}
              >
                1. {t("select_state", "State")}
              </button>
              <span className="text-slate-400">→</span>
              <button
                type="button"
                onClick={() => setSelectorStep("district")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectorStep === "district"
                    ? "bg-[#386BFF] text-white shadow-xs"
                    : "text-slate-500 hover:text-black dark:hover:text-white"
                }`}
              >
                2. {t("select_district", "District")}: {isHindi ? tempState.hindiName : tempState.name}
              </button>
            </div>

            {/* Search Input Filter */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={
                    selectorStep === "state"
                      ? isHindi
                        ? "राज्य खोजें (उदा. उत्तर प्रदेश, महाराष्ट्र, बिहार)..."
                        : "Search state (e.g., Uttar Pradesh, Maharashtra, Bihar)..."
                      : isHindi
                      ? "ज़िला या शहर खोजें (उदा. लखनऊ, वाराणसी, गोरखपुर)..."
                      : t("search_district", "Search district or city...")
                  }
                  autoFocus
                  className={`w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border outline-none ${
                    isDark
                      ? "bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-[#386BFF]"
                      : "bg-[#F5F8FF] border-[#E0E9FA] text-[#102B59] placeholder-[#60769A] focus:border-[#386BFF]"
                  }`}
                />
              </div>
            </div>

            {/* Modal Items List */}
            <div className="flex-1 overflow-y-auto p-4 max-h-96 space-y-1.5 custom-scrollbar">
              {selectorStep === "state" ? (
                filteredStates.map((st) => {
                  const isCurrent = tempStateId === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleStateSelect(st.id)}
                      className={`w-full text-left p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-[#386BFF]/15 border-[#386BFF] text-[#386BFF] font-bold"
                          : isDark
                          ? "bg-slate-950/60 border-slate-800 hover:bg-slate-800 text-slate-200"
                          : "bg-white border-[#E0E9FA] hover:bg-[#F5F8FF] text-[#102B59]"
                      }`}
                    >
                      <div>
                        <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
                          <span>{st.name}</span>
                          <span className="text-slate-400 text-xs font-normal">({st.hindiName})</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {st.districts.length} {isHindi ? "ज़िले शामिल" : "districts covered"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {st.isPopular && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Popular
                          </span>
                        )}
                        <span className="text-xs text-[#386BFF] font-semibold">Select →</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                filteredDistricts.map((dist) => {
                  const isSelected = selectedDistrictId === dist.id && selectedStateId === tempStateId;
                  return (
                    <button
                      key={dist.id}
                      type="button"
                      onClick={() => handleDistrictSelect(dist.id)}
                      className={`w-full text-left p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#386BFF] text-white border-[#386BFF] font-bold shadow-md"
                          : isDark
                          ? "bg-slate-950/60 border-slate-800 hover:bg-slate-800 text-slate-200"
                          : "bg-white border-[#E0E9FA] hover:bg-[#F5F8FF] text-[#102B59]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className={`w-4 h-4 ${isSelected ? "text-white" : "text-[#386BFF]"}`} />
                        <div>
                          <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
                            <span>{dist.name}</span>
                            <span className={isSelected ? "text-blue-100" : "text-slate-400 text-xs font-normal"}>
                              ({dist.hindiName})
                            </span>
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-xs text-[#386BFF] font-semibold">Choose</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between text-xs text-slate-400">
              <span>
                {selectorStep === "state"
                  ? `${filteredStates.length} states listed`
                  : `${filteredDistricts.length} districts in ${tempState.name}`}
              </span>

              {selectorStep === "district" && (
                <button
                  type="button"
                  onClick={() => setSelectorStep("state")}
                  className="text-[#386BFF] font-semibold hover:underline cursor-pointer"
                >
                  ← {isHindi ? "राज्य बदलें" : t("select_state", "Change State")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Questions Modal for Selected District Article */}
      {followUpArticle && (
        <ArticleFollowUpModal
          isOpen={true}
          onClose={() => setFollowUpArticle(null)}
          articleTitle={followUpArticle.title}
          articleSource={followUpArticle.source}
          articleContext={`${currentDistrict.name}, ${currentState.name} District News:\n\n${followUpArticle.title}\n\n${followUpArticle.description}`}
          category="local"
          isDark={isDark}
        />
      )}
    </div>
  );
};
