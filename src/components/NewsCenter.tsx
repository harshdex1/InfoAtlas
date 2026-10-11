import React, { useState, useEffect } from "react";
import { NewsArticle } from "../types";
import { fetchNewsArticles, askGemini } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Newspaper, Search, Sparkles, Bookmark, Check, ExternalLink, Globe, Flame, RefreshCw, Clock, X } from "lucide-react";

interface NewsCenterProps {
  isDark: boolean;
}

const NEWS_CATEGORIES = [
  { id: "all", label: "Latest News" },
  { id: "breaking", label: "Breaking News" },
  { id: "world", label: "World News" },
  { id: "india", label: "India News" },
  { id: "technology", label: "Technology & AI" },
  { id: "business", label: "Business & Economy" },
  { id: "science", label: "Science & Research" },
  { id: "space", label: "Space & Astronomy" },
  { id: "health", label: "Health & Medicine" },
  { id: "sports", label: "Sports" },
  { id: "cricket", label: "Cricket" },
  { id: "environment", label: "Environment" },
];

export const NewsCenter: React.FC<NewsCenterProps> = ({ isDark }) => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addBookmark, removeBookmark, isBookmarked } = useAuth();

  // AI News modal state
  const [selectedArticleForAI, setSelectedArticleForAI] = useState<NewsArticle | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPromptType, setAiPromptType] = useState<"summary" | "simple" | "importance">("summary");

  const loadNews = async (cat: string, q: string) => {
    setIsLoading(true);
    const data = await fetchNewsArticles(cat, q);
    setArticles(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadNews(activeCategory, searchQuery);
  }, [activeCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadNews(activeCategory, searchQuery);
  };

  const handleOpenAI = async (article: NewsArticle, type: "summary" | "simple" | "importance") => {
    setSelectedArticleForAI(article);
    setAiPromptType(type);
    setIsAiLoading(true);
    setAiSummary(null);

    let prompt = "";
    let systemInstruction = "You are InfoAtlas AI, a rigorous and clear journalistic analyst.";

    if (type === "summary") {
      prompt = `Provide a concise 3-bullet executive summary of this news article: "${article.title}". Description: ${article.description}`;
    } else if (type === "simple") {
      prompt = `Explain the significance of this news article in simple language for a general reader: "${article.title}". Description: ${article.description}`;
    } else {
      prompt = `Why is this news important? Analyze the broader implications of: "${article.title}". Description: ${article.description}`;
    }

    const res = await askGemini(prompt, undefined, systemInstruction);
    setAiSummary(res);
    setIsAiLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Newspaper className="w-3.5 h-3.5" />
            <span>Verified News & Live Updates</span>
          </div>
          <h1 className={`text-3xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            News Center
          </h1>
        </div>

        {/* Search within News */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news headlines..."
            className={`w-full text-xs pl-10 pr-4 py-3 rounded-xl border transition-all ${
              isDark ? "bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500"
            }`}
          />
        </form>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        {NEWS_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === cat.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : isDark
                ? "bg-slate-900/80 border border-slate-800 text-slate-300 hover:bg-slate-800"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Articles Feed */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`p-6 rounded-3xl border animate-pulse ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="h-4 bg-slate-800 rounded w-1/4 mb-3"></div>
              <div className="h-6 bg-slate-800 rounded w-full mb-3"></div>
              <div className="h-4 bg-slate-800 rounded w-full mb-2"></div>
              <div className="h-4 bg-slate-800 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-8 h-8" />
          </div>
          <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>No news articles found</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            We couldn't find any articles matching your criteria right now. Try selecting another category or resetting your search.
          </p>
          <button
            onClick={() => {
              setActiveCategory("all");
              setSearchQuery("");
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-6 py-3 rounded-xl transition-all"
          >
            View All News
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => {
            const bookmarked = isBookmarked(article.url);
            return (
              <div
                key={article.id}
                className={`p-6 rounded-3xl border flex flex-col justify-between transition-all group ${
                  isDark
                    ? "bg-slate-900/50 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900"
                    : "bg-white border-slate-200 hover:border-indigo-500/50 hover:shadow-lg"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold border border-indigo-500/20 uppercase tracking-wider">
                      {article.category}
                    </span>
                    {article.isBreaking && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-500/15 text-rose-400 text-[10px] font-semibold border border-rose-500/30 animate-pulse">
                        <Flame className="w-3 h-3" />
                        <span>Breaking</span>
                      </span>
                    )}
                  </div>

                  <h3 className={`text-base font-bold mb-3 group-hover:text-indigo-400 transition-colors line-clamp-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                    {article.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">
                    {article.description}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-4 pt-3 border-t border-slate-800/50">
                    <span className="font-semibold text-slate-400">{article.source}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAI(article, "summary")}
                      className="flex-1 bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/30 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Summary</span>
                    </button>

                    <button
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
                      className={`p-2.5 rounded-xl border transition-all ${
                        bookmarked
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/30"
                          : isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                      title={bookmarked ? "Bookmarked" : "Save Bookmark"}
                    >
                      {bookmarked ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>

                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`p-2.5 rounded-xl border transition-all ${
                        isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-700"
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

      {/* AI News Summary Modal */}
      {selectedArticleForAI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`w-full max-w-xl rounded-3xl border p-6 sm:p-8 shadow-2xl relative ${
            isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <button
              onClick={() => setSelectedArticleForAI(null)}
              className="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold">InfoAtlas AI News Analysis</h3>
                <span className="text-[10px] text-indigo-400">Powered by Gemini</span>
              </div>
            </div>

            <h2 className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
              {selectedArticleForAI.title}
            </h2>

            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => handleOpenAI(selectedArticleForAI, "summary")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  aiPromptType === "summary" ? "bg-indigo-600 text-white" : isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"
                }`}
              >
                Executive Summary
              </button>
              <button
                onClick={() => handleOpenAI(selectedArticleForAI, "simple")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  aiPromptType === "simple" ? "bg-indigo-600 text-white" : isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"
                }`}
              >
                Explain Simply
              </button>
              <button
                onClick={() => handleOpenAI(selectedArticleForAI, "importance")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  aiPromptType === "importance" ? "bg-indigo-600 text-white" : isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"
                }`}
              >
                Why It Matters
              </button>
            </div>

            <div className={`p-5 rounded-2xl border min-h-[160px] max-h-80 overflow-y-auto text-xs sm:text-sm leading-relaxed mb-6 ${
              isDark ? "bg-slate-950/60 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
            }`}>
              {isAiLoading ? (
                <div className="flex items-center justify-center h-28 gap-2 text-indigo-400">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-medium">Analyzing news report...</span>
                </div>
              ) : (
                <div className="whitespace-pre-line">{aiSummary}</div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">Source: {selectedArticleForAI.source}</span>
              <a
                href={selectedArticleForAI.url}
                target="_blank"
                rel="noreferrer"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
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
