import React, { useState, useEffect, useRef } from "react";
import { NewsArticle } from "../types";
import { fetchNewsArticles, askGemini } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Newspaper, Sparkles, Bookmark, Check, ExternalLink, Clock, RefreshCw, X, Flame } from "lucide-react";

interface LatestNewsFeedProps {
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onSelectArticle: (article: NewsArticle) => void;
  isDark: boolean;
}

const FILTER_CHIPS = [
  { id: "all", label: "Latest News" },
  { id: "breaking", label: "Breaking News" },
  { id: "world", label: "World News" },
  { id: "india", label: "India News" },
  { id: "technology", label: "Technology & AI" },
  { id: "business", label: "Business" },
  { id: "sports", label: "Sports" },
  { id: "cricket", label: "Cricket" },
  { id: "science", label: "Science" },
  { id: "health", label: "Health" },
];

export const LatestNewsFeed: React.FC<LatestNewsFeedProps> = ({ selectedCategory, onCategoryChange, onSelectArticle, isDark }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("You’re viewing the latest available articles.");
  const { addBookmark, removeBookmark, isBookmarked } = useAuth();

  // AI Modal
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const pollIntervalRef = useRef<any>(null);

  const loadNews = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
      setStatusMessage("Checking for updates…");
    } else {
      setIsLoading(true);
      setArticles([]); // clear previous category stale results immediately
    }

    try {
      const data = await fetchNewsArticles(selectedCategory);
      if (data && data.length > 0) {
        const seenUrls = new Set();
        const unique = data.filter((item) => {
          if (seenUrls.has(item.url)) return false;
          seenUrls.add(item.url);
          return true;
        });

        setArticles(unique);
        setLastUpdated(new Date());
        setStatusMessage("You’re viewing the latest available articles.");
      } else {
        setArticles([]);
        setStatusMessage("No matching articles found.");
      }
    } catch (err) {
      console.error("Failed to load news:", err);
      setStatusMessage("Unable to refresh. Showing previously retrieved articles.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadNews(false);
  }, [selectedCategory]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadNews(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    pollIntervalRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadNews(true);
      }
    }, 5 * 60 * 1000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [selectedCategory]);

  const handleOpenAiSummary = (e: React.MouseEvent, article: NewsArticle) => {
    e.stopPropagation();
    setSelectedArticle(article);
    setIsAiLoading(true);
    setAiSummary(null);

    const prompt = `Provide a concise 3-bullet executive summary and significance of this news report: "${article.title}". Description: ${article.description}`;
    askGemini(prompt, undefined, "You are InfoAtlas AI, an expert journalistic analyst.").then((res) => {
      setAiSummary(res);
      setIsAiLoading(false);
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-md text-white ${
        isDark ? "bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800" : "bg-gradient-to-r from-[#102B59] via-[#1a3d7c] to-[#102B59]"
      }`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(56,107,255,0.25),transparent_60%)] pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#7252FF] text-white flex items-center justify-center shadow-lg shrink-0">
            <Newspaper className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Global Feed</span>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Stay Informed, Stay Ahead</h1>
            <p className="text-xs text-slate-200 mt-0.5">Get the latest news from trusted sources around the world.</p>
          </div>
        </div>
      </div>

      {/* Category Filter Container */}
      <div className={`p-4 rounded-2xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-[#E0E9FA] shadow-sm"}`}>
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.id}
              onClick={() => onCategoryChange(chip.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === chip.id
                  ? "bg-[#386BFF] text-white shadow-md shadow-blue-500/20"
                  : isDark
                  ? "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
                  : "bg-[#F5F8FF] text-[#102B59] hover:bg-[#e0e9fa]"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Refresh Status Row */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-[#60769A]">
          <span className="font-semibold text-[#102B59]">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Checking..."}
          </span>
          <span>·</span>
          <span>{statusMessage}</span>
        </div>

        <button
          onClick={() => loadNews(true)}
          disabled={isRefreshing}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            isDark
              ? "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
              : "bg-white border-[#E0E9FA] text-[#102B59] hover:bg-[#F5F8FF]"
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#386BFF] ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`rounded-3xl border overflow-hidden animate-pulse ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-[#E0E9FA]"}`}>
              <div className="h-44 bg-slate-800 w-full"></div>
              <div className="p-5 space-y-3">
                <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                <div className="h-6 bg-slate-800 rounded w-full"></div>
                <div className="h-4 bg-slate-800 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20">
          <Newspaper className="w-12 h-12 text-[#60769A] mx-auto mb-3 animate-pulse" />
          <h3 className={`text-base font-bold mb-1 ${isDark ? "text-white" : "text-[#102B59]"}`}>No matching articles found</h3>
          <p className="text-xs text-[#60769A] mb-4">No articles found for category "{selectedCategory}". Try selecting another category.</p>
          <button
            onClick={() => loadNews(true)}
            className="bg-[#386BFF] hover:bg-blue-600 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => {
            const bookmarked = isBookmarked(article.url);
            return (
              <div
                key={article.id}
                onClick={() => onSelectArticle(article)}
                className={`rounded-3xl border overflow-hidden flex flex-col justify-between transition-all group cursor-pointer ${
                  isDark
                    ? "bg-slate-900/50 border-slate-800 hover:border-[#386BFF]/50"
                    : "bg-white border-[#E0E9FA] hover:border-[#386BFF]/50 shadow-sm hover:shadow-md"
                }`}
              >
                <div>
                  {/* Article Thumbnail */}
                  <div className="w-full h-44 bg-slate-900 overflow-hidden relative">
                    {article.thumbnail ? (
                      <img
                        src={article.thumbnail}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e: any) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#102B59] via-[#386BFF] to-[#7252FF] flex items-center justify-center p-6 text-white text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Newspaper className="w-7 h-7 opacity-80" />
                          <span className="text-[11px] font-bold uppercase tracking-wider opacity-90 truncate max-w-[200px]">{article.source}</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                    <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-[#386BFF]/90 text-white text-[10px] font-semibold uppercase tracking-wider shadow">
                      {article.category}
                    </span>
                    {article.isBreaking && (
                      <span className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-rose-600/90 text-white text-[10px] font-semibold uppercase tracking-wider shadow flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        <span>Breaking</span>
                      </span>
                    )}
                  </div>

                  {/* Headline & Description */}
                  <div className="p-5">
                    <h3 className={`text-sm font-bold mb-2.5 group-hover:text-[#386BFF] transition-colors line-clamp-3 ${isDark ? "text-white" : "text-[#102B59]"}`}>
                      {article.title}
                    </h3>

                    <p className="text-xs text-[#60769A] leading-relaxed line-clamp-3">
                      {article.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Action Row (Stop Propagation) */}
                <div className="p-5 pt-0">
                  <div className="flex items-center justify-between text-[11px] text-[#60769A] mb-4 pt-3 border-t border-[#E0E9FA]">
                    <span className="font-semibold truncate pr-2 text-[#102B59]">{article.source}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 min-w-0 box-border" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleOpenAiSummary(e, article)}
                      className="flex-1 bg-[#386BFF]/10 hover:bg-[#386BFF]/20 text-[#386BFF] border border-[#386BFF]/30 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0"
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">AI Summary</span>
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
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                        bookmarked
                          ? "bg-[#386BFF] border-[#386BFF] text-white shadow-md"
                          : isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-[#E0E9FA] text-[#102B59]"
                      }`}
                      title={bookmarked ? "Bookmarked" : "Save Bookmark"}
                    >
                      {bookmarked ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>

                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`p-2.5 rounded-xl border transition-all shrink-0 ${
                        isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-[#E0E9FA] text-[#102B59]"
                      }`}
                      title="Original Source"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
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
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#386BFF] to-[#7252FF] text-white flex items-center justify-center shadow">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold">InfoAtlas AI News Analysis</h3>
                <span className="text-[10px] text-[#386BFF]">Powered by Gemini</span>
              </div>
            </div>

            <h2 className="text-base font-bold mb-4">
              {selectedArticle.title}
            </h2>

            <div className={`p-5 rounded-2xl border min-h-[160px] max-h-80 overflow-y-auto text-xs sm:text-sm leading-relaxed mb-6 ${
              isDark ? "bg-slate-950/60 border-slate-800 text-slate-300" : "bg-slate-50 border-[#E0E9FA] text-[#60769A]"
            }`}>
              {isAiLoading ? (
                <div className="flex items-center justify-center h-28 gap-2 text-[#386BFF]">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-medium">Generating AI summary...</span>
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
                className="bg-[#386BFF] hover:bg-blue-600 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
              >
                <span>Read Full Report</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
