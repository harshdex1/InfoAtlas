import React, { useState, useEffect } from "react";
import { NewsArticle } from "../types";
import { fetchNewsArticles, askGemini, translateNewsFeed } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Trophy, Sparkles, Bookmark, Check, ExternalLink, Clock, RefreshCw, X } from "lucide-react";
import { formatSafeTime } from "../utils/date";

interface SportsPageProps {
  isDark: boolean;
  onSelectArticle?: (article: NewsArticle) => void;
}

export const SportsPage: React.FC<SportsPageProps> = ({ isDark, onSelectArticle }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { addBookmark, removeBookmark, isBookmarked } = useAuth();
  const { t, language } = useLanguage();

  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const loadSports = async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const data = await fetchNewsArticles("sports");
      let finalArticles = data;
      if (language !== "en" && data.length > 0) {
        try {
          finalArticles = await translateNewsFeed(data, language);
        } catch (tErr) {
          console.warn("Sports translation error:", tErr);
        }
      }
      setArticles(finalArticles);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load sports news:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSports(false);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadSports(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadSports(true);
      }
    }, 5 * 60 * 1000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [language]);

  const handleOpenAiSummary = async (article: NewsArticle, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedArticle(article);
    setIsAiLoading(true);
    setAiSummary(null);

    const prompt = `Provide a concise 3-bullet executive summary and athletic significance of this sports report in ${language === "hi" ? "Hindi" : "the selected language"}: "${article.title}". Description: ${article.description}`;
    const res = await askGemini(prompt, undefined, "You are InfoAtlas AI, an expert sports journalist and analyst.");
    setAiSummary(res);
    setIsAiLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className={`text-2xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-[#102B59]"}`}>
              {t("sports_center", "Sports Center")}
            </h1>
            <p className="text-xs text-[#60769A]">
              {t("sports_center_sub", "Live global sports news, match reports, and tournament updates")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-[#60769A]">
              {t("last_updated_time", "Last updated")}: {formatSafeTime(lastUpdated)}
            </span>
          )}
          <button
            onClick={() => loadSports(true)}
            disabled={isRefreshing}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isDark
                ? "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
                : "bg-white border-[#E0E9FA] text-[#102B59] hover:bg-[#F5F8FF]"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? t("loading", "Updating...") : t("refresh", "Refresh")}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`p-6 rounded-3xl border animate-pulse ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-[#E0E9FA]"}`}>
              <div className="h-4 bg-slate-800 rounded w-1/4 mb-3"></div>
              <div className="h-6 bg-slate-800 rounded w-full mb-3"></div>
              <div className="h-4 bg-slate-800 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20">
          <Trophy className="w-12 h-12 text-[#60769A] mx-auto mb-3 animate-pulse" />
          <h3 className={`text-base font-bold mb-1 ${isDark ? "text-white" : "text-[#102B59]"}`}>No sports reports found</h3>
          <p className="text-xs text-[#60769A]">Please check your network connection or try again later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => {
            const bookmarked = isBookmarked(article.url);
            return (
              <div
                key={article.id}
                onClick={() => onSelectArticle && onSelectArticle(article)}
                className={`rounded-3xl border overflow-hidden flex flex-col justify-between transition-all group ${
                  onSelectArticle ? "cursor-pointer" : ""
                } ${
                  isDark
                    ? "bg-slate-900/50 border-slate-800 hover:border-emerald-500/50"
                    : "bg-white border-[#E0E9FA] hover:border-emerald-500/50 shadow-sm hover:shadow-md"
                }`}
              >
                <div>
                  {article.thumbnail ? (
                    <div className="w-full h-40 bg-slate-900 overflow-hidden relative">
                      <img src={article.thumbnail} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-emerald-600/90 text-white text-[10px] font-semibold uppercase tracking-wider shadow">
                        Sports
                      </span>
                    </div>
                  ) : (
                    <div className="p-5 pb-0">
                      <span className="inline-flex px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold border border-emerald-500/20 uppercase tracking-wider">
                        Sports
                      </span>
                    </div>
                  )}

                  <div className="p-5">
                    <h3 className={`text-sm font-bold mb-2.5 group-hover:text-emerald-500 transition-colors line-clamp-3 ${isDark ? "text-white" : "text-[#102B59]"}`}>
                      {article.title}
                    </h3>
                    <p className="text-xs text-[#60769A] leading-relaxed line-clamp-3">
                      {article.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="flex items-center justify-between text-[11px] text-[#60769A] mb-4 pt-3 border-t border-[#E0E9FA]">
                    <span className="font-semibold truncate pr-2">{article.source}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatSafeTime(article.publishedAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleOpenAiSummary(article, e)}
                      className="flex-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 border border-emerald-500/30 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t("ai_summary", "AI Summary")}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
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
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        bookmarked
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                          : isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-100 border-[#E0E9FA] text-[#102B59]"
                      }`}
                      title={bookmarked ? t("bookmarked", "Bookmarked") : t("save_bookmark", "Save Bookmark")}
                    >
                      {bookmarked ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>

                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`p-2 rounded-xl border transition-all ${
                        isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-100 border-[#E0E9FA] text-[#102B59]"
                      }`}
                      title={t("read_full", "Original Source")}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Summary Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`w-full max-w-xl rounded-3xl border p-6 sm:p-8 shadow-2xl relative ${
            isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-[#E0E9FA] text-[#102B59]"
          }`}>
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold">InfoAtlas AI Sports Analysis</h3>
                <span className="text-[10px] text-emerald-500">Powered by Gemini</span>
              </div>
            </div>

            <h2 className="text-base font-bold mb-4">
              {selectedArticle.title}
            </h2>

            <div className={`p-5 rounded-2xl border min-h-[160px] max-h-80 overflow-y-auto text-xs sm:text-sm leading-relaxed mb-6 ${
              isDark ? "bg-slate-950/60 border-slate-800 text-slate-300" : "bg-slate-50 border-[#E0E9FA] text-[#60769A]"
            }`}>
              {isAiLoading ? (
                <div className="flex items-center justify-center h-28 gap-2 text-emerald-500">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-medium">{t("generating_summary", "Analyzing sports report...")}</span>
                </div>
              ) : (
                <div className="whitespace-pre-line">{aiSummary}</div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#60769A]">Source: {selectedArticle.source}</span>
              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
              >
                <span>{t("read_full_report", "Read Full Report")}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
