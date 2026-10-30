import React, { useState } from "react";
import { SearchResult, AiKnowledgeArticle, TopicImage, NewsArticle } from "../types";
import {
  Search,
  ExternalLink,
  Bookmark,
  Check,
  ArrowLeft,
  Sparkles,
  Globe,
  Lightbulb,
  ChevronRight,
  BookOpen,
  RefreshCw,
  Play,
  Video,
  Newspaper,
  Flame,
  Radio,
  Clock,
  Layers,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { generateAiKnowledgeArticleApi } from "../services/api";
import { InfoAtlasLoader } from "./InfoAtlasLoader";
import { RelatedVideosModal } from "./RelatedVideosModal";

const formatTimeAgo = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return "";
  }
};

interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  newsArticles?: NewsArticle[];
  aiArticle?: AiKnowledgeArticle;
  topicImage?: TopicImage;
  sourceUsed: "wikimedia" | "ai-fallback" | "ai-synthesized";
  isAiFallback: boolean;
  statusMessage: string;
  isLoading: boolean;
  onSelectArticle: (title: string) => void;
  onSelectAiArticle: (article: AiKnowledgeArticle) => void;
  onSelectNewsArticle?: (article: NewsArticle) => void;
  onBackToHome: () => void;
  onExploreTopic: (topic: string) => void;
  isDark: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  results,
  newsArticles = [],
  aiArticle,
  topicImage,
  sourceUsed,
  isAiFallback,
  statusMessage,
  isLoading,
  onSelectArticle,
  onSelectAiArticle,
  onSelectNewsArticle,
  onBackToHome,
  onExploreTopic,
  isDark,
}) => {
  const { addBookmark, removeBookmark, isBookmarked } = useAuth();
  const { t } = useLanguage();
  const [localAiArticle, setLocalAiArticle] = useState<AiKnowledgeArticle | undefined>(aiArticle);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [showVideosModal, setShowVideosModal] = useState<boolean>(false);
  const [searchTab, setSearchTab] = useState<"all" | "news" | "reference">("all");

  // If user has Wikimedia results but also wants a full AI synthesis on demand
  const handleSynthesizeAi = async () => {
    setIsGeneratingAi(true);
    const context = results.slice(0, 3).map((r) => `${r.title}: ${r.snippet}`).join("; ");
    const synthesized = await generateAiKnowledgeArticleApi(query, context);
    if (synthesized) {
      setLocalAiArticle(synthesized);
      onSelectAiArticle(synthesized);
    }
    setIsGeneratingAi(false);
  };

  const currentAiArticle = localAiArticle || aiArticle;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBackToHome}
          className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
            isDark
              ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
              : "bg-white border-[#E0E9FA] text-[#102B59] hover:bg-[#F5F8FF]"
          }`}
        >
          <ArrowLeft className="w-4 h-4 text-[#386BFF]" />
          <span>{t("home", "Back to Home")}</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          {/* Related Videos Button */}
          <button
            onClick={() => setShowVideosModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/35 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Discover related videos and reels on YouTube, Instagram, TikTok, X, and Reddit"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Related Videos</span>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-semibold uppercase tracking-wider">
              Social Media
            </span>
          </button>

          <div className="text-xs text-[#60769A]">
            {t("results_for", "Results for")} <span className="font-bold text-[#386BFF]">"{query}"</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 py-8">
          <InfoAtlasLoader
            size="lg"
            message="Searching Knowledge Sources... Checking Wikimedia records & preparing encyclopedic synthesis"
            isDark={isDark}
          />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`p-6 rounded-2xl border animate-pulse ${
                isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-[#E0E9FA]"
              }`}
            >
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full mb-2"></div>
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status / Source Banner */}
          <div
            className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
              isAiFallback
                ? "bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border-indigo-500/30 text-indigo-400"
                : isDark
                ? "bg-slate-900/60 border-slate-800 text-slate-300"
                : "bg-white border-[#E0E9FA] text-[#102B59]"
            }`}
          >
            <div className="flex items-center gap-2">
              {isAiFallback ? (
                <Sparkles className="w-4 h-4 text-[#386BFF] shrink-0" />
              ) : (
                <Globe className="w-4 h-4 text-[#386BFF] shrink-0" />
              )}
              <span className="font-semibold">{statusMessage}</span>
            </div>

            {/* If has wiki results but no AI article card yet, provide on-demand synthesis button */}
            {!currentAiArticle && (
              <button
                onClick={handleSynthesizeAi}
                disabled={isGeneratingAi}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#386BFF]/10 hover:bg-[#386BFF]/20 text-[#386BFF] border border-[#386BFF]/30 font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingAi ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t("loading", "Synthesizing...")}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t("generate_ai_deep_article", "Generate AI Deep Article")}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Intelligence Type Filter Tabs (All / News / Reference) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSearchTab("all")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  searchTab === "all"
                    ? "bg-[#386BFF] text-white shadow-md shadow-blue-500/20"
                    : isDark
                    ? "bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                    : "bg-white border border-[#E0E9FA] text-[#102B59] hover:bg-[#F5F8FF]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Intelligence</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  searchTab === "all" ? "bg-white/20 text-white" : isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600"
                }`}>
                  {(newsArticles?.length || 0) + results.length + (currentAiArticle ? 1 : 0)}
                </span>
              </button>

              <button
                onClick={() => setSearchTab("news")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  searchTab === "news"
                    ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                    : isDark
                    ? "bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                    : "bg-white border border-[#E0E9FA] text-[#102B59] hover:bg-[#F5F8FF]"
                }`}
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span>News & Live Reports</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  searchTab === "news" ? "bg-white/20 text-white" : isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600"
                }`}>
                  {newsArticles?.length || 0}
                </span>
              </button>

              <button
                onClick={() => setSearchTab("reference")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  searchTab === "reference"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : isDark
                    ? "bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                    : "bg-white border border-[#E0E9FA] text-[#102B59] hover:bg-[#F5F8FF]"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Encyclopedia & Reference</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  searchTab === "reference" ? "bg-white/20 text-white" : isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600"
                }`}>
                  {results.length + (currentAiArticle ? 1 : 0)}
                </span>
              </button>
            </div>
          </div>

          {/* SECTION 1: LATEST NEWS & LIVE REPORTS (Shown on All or News tab) */}
          {(searchTab === "all" || searchTab === "news") && newsArticles && newsArticles.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-red-600/10 text-red-600 flex items-center justify-center shadow-sm">
                    <Newspaper className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-[#102B59]"}`}>
                        Latest News & Live Reports
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        Live Coverage
                      </span>
                    </div>
                    <p className="text-xs text-[#60769A]">
                      Top stories and breaking dispatches for <span className="font-semibold text-red-500">"{query}"</span>
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {newsArticles.length} stories
                </span>
              </div>

              {/* News Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newsArticles.map((article, idx) => {
                  const bookmarked = isBookmarked(article.url);
                  return (
                    <div
                      key={article.id || `news-${idx}`}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group ${
                        isDark
                          ? "bg-slate-900/60 border-slate-800 hover:border-red-500/40 hover:bg-slate-900 shadow-sm"
                          : "bg-white border-[#E0E9FA] hover:border-red-300 hover:shadow-md"
                      }`}
                    >
                      <div>
                        {/* Source Pill & Time */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600/10 text-red-600 text-[11px] font-bold border border-red-600/20">
                              <Radio className="w-3 h-3" />
                              <span>{article.source || "News Desk"}</span>
                            </span>
                            {article.isBreaking && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                                <Flame className="w-3 h-3 fill-current" />
                                Breaking
                              </span>
                            )}
                          </div>

                          {article.publishedAt && (
                            <span className="text-[11px] text-[#60769A] flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(article.publishedAt)}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4
                          onClick={() => onSelectNewsArticle && onSelectNewsArticle(article)}
                          className={`text-base font-bold mb-2 group-hover:text-red-500 transition-colors line-clamp-2 cursor-pointer leading-snug ${
                            isDark ? "text-white" : "text-[#102B59]"
                          }`}
                        >
                          {article.title}
                        </h4>

                        {/* Description snippet */}
                        <p className="text-xs text-[#60769A] line-clamp-3 leading-relaxed mb-4">
                          {article.description}
                        </p>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-1">
                        <button
                          onClick={() => onSelectNewsArticle && onSelectNewsArticle(article)}
                          className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Read Full Story</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>

                        <div className="flex items-center gap-2">
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
                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                : isDark
                                ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                                : "bg-[#F5F8FF] border-[#E0E9FA] text-[#60769A] hover:bg-white hover:text-red-500"
                            }`}
                            title={bookmarked ? "Remove Bookmark" : "Save Bookmark"}
                          >
                            {bookmarked ? <Check className="w-3.5 h-3.5 text-red-500" /> : <Bookmark className="w-3.5 h-3.5" />}
                          </button>

                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-2 rounded-xl border transition-all ${
                              isDark
                                ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                                : "bg-[#F5F8FF] border-[#E0E9FA] text-[#60769A] hover:bg-white"
                            }`}
                            title="Open Source Article"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* If News tab active but no news articles */}
          {searchTab === "news" && (!newsArticles || newsArticles.length === 0) && (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600/10 text-red-600 flex items-center justify-center mx-auto">
                <Newspaper className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold">No news articles found for "{query}"</h4>
              <p className="text-xs text-[#60769A]">
                Check "Encyclopedia & Reference" or "All Intelligence" for full reports.
              </p>
              <button
                onClick={() => setSearchTab("all")}
                className="px-4 py-2 rounded-xl bg-[#386BFF] text-white text-xs font-semibold"
              >
                View All Intelligence
              </button>
            </div>
          )}

          {/* SECTION 2: AI SYNTHESIZED ENCYCLOPEDIC ARTICLE (Shown on All or Reference tab) */}
          {(searchTab === "all" || searchTab === "reference") && currentAiArticle && (
            <div
              onClick={() => onSelectAiArticle(currentAiArticle)}
              className={`p-6 sm:p-8 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden ${
                isDark
                  ? "bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border-indigo-500/40 hover:border-indigo-400 shadow-xl"
                  : "bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/30 border-[#386BFF]/40 hover:border-[#386BFF] hover:shadow-xl"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#386BFF] text-white text-xs font-bold shadow-md shadow-blue-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t("ai_deep_article", "AI Comprehensive Knowledge Article")}</span>
                </span>
                <span className="text-[11px] font-semibold text-[#386BFF] uppercase tracking-wider">
                  {currentAiArticle.category}
                </span>
              </div>

              {/* Featured Image Preview if available */}
              {(currentAiArticle.heroImage?.url || topicImage?.url) && (
                <div className="mb-4 rounded-2xl overflow-hidden max-h-56 relative border border-slate-700/40 bg-slate-950">
                  <img
                    src={currentAiArticle.heroImage?.url || topicImage?.url}
                    alt={currentAiArticle.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-52 sm:h-56 object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                  <div className="absolute bottom-2.5 left-2.5 px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md text-[11px] text-slate-200 border border-slate-700/60 flex items-center gap-1.5 shadow-lg">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span>
                      {(currentAiArticle.heroImage?.isAiGenerated ?? topicImage?.isAiGenerated)
                        ? t("editorial_illustration", "AI Conceptual Illustration")
                        : t("contextual_photo", "Verified Knowledge Source Image")}
                    </span>
                  </div>
                </div>
              )}

              <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 group-hover:text-[#386BFF] transition-colors ${
                isDark ? "text-white" : "text-[#102B59]"
              }`}>
                {currentAiArticle.title}
              </h2>

              <p className="text-sm font-medium text-[#386BFF] mb-4">
                {currentAiArticle.tagline}
              </p>

              <p className={`text-xs sm:text-sm leading-relaxed line-clamp-3 mb-6 ${
                isDark ? "text-slate-300" : "text-slate-700"
              }`}>
                {currentAiArticle.summary}
              </p>

              {/* Takeaways snippet preview */}
              {currentAiArticle.keyTakeaways && currentAiArticle.keyTakeaways.length > 0 && (
                <div className={`p-4 rounded-2xl mb-6 ${
                  isDark ? "bg-slate-950/60 border border-slate-800" : "bg-white/80 border border-[#E0E9FA]"
                }`}>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#386BFF] mb-2">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>{t("key_takeaway", "Key Takeaway Highlight:")}</span>
                  </div>
                  <p className={`text-xs italic ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    "{currentAiArticle.keyTakeaways[0]}"
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-bold text-[#386BFF]">
                  <span>{t("read_full_encyclopedic_report", "Read Full Encyclopedic Report")} ({currentAiArticle.sections?.length || 3} Sections)</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
                <span className="text-[11px] text-[#60769A]">
                  {t("synthesized_with_gemini", "Synthesized with Gemini")}
                </span>
              </div>
            </div>
          )}

          {/* Related Social Media Videos Banner Card */}
          <div
            className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-all ${
              isDark
                ? "bg-gradient-to-r from-red-950/30 via-purple-950/20 to-slate-900 border-red-500/20 shadow-md"
                : "bg-gradient-to-r from-red-50 via-rose-50/60 to-indigo-50/50 border-red-200 shadow-sm"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-red-500/20 shrink-0">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold tracking-tight">Looking for video clips & visual explainers?</h4>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">
                    Social Media
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Explore related videos on YouTube, Instagram Reels, TikTok, and X for "{query}".
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowVideosModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Related Videos</span>
            </button>
          </div>

          {/* SECTION 3: Standard Verified Wikimedia Results (Shown on All or Reference tab) */}
          {(searchTab === "all" || searchTab === "reference") && results.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-[#60769A]">
                  {t("verified_reference_sources", "Verified Reference Sources from Wikimedia")} ({results.length})
                </p>
              </div>

              {results.map((res, idx) => {
                const bookmarked = isBookmarked(res.url);
                return (
                  <div
                    key={idx}
                    className={`p-6 rounded-2xl border transition-all group relative ${
                      isDark
                        ? "bg-slate-900/50 border-slate-800 hover:border-[#386BFF]/50 hover:bg-slate-900"
                        : "bg-white border-[#E0E9FA] hover:border-[#386BFF]/50 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => onSelectArticle(res.title)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#386BFF]/10 text-[#386BFF] text-[10px] font-semibold border border-[#386BFF]/20">
                            <Globe className="w-3 h-3" />
                            <span>Wikipedia / Wikimedia</span>
                          </span>
                        </div>
                        <h3
                          className={`text-lg font-bold mb-2 group-hover:text-[#386BFF] transition-colors ${
                            isDark ? "text-white" : "text-[#102B59]"
                          }`}
                        >
                          {res.title}
                        </h3>
                        <p className="text-xs text-[#60769A] leading-relaxed line-clamp-2">
                          {res.snippet}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (bookmarked) {
                              removeBookmark(res.url);
                            } else {
                              addBookmark({
                                title: res.title,
                                snippet: res.snippet,
                                url: res.url,
                              });
                            }
                          }}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                            bookmarked
                              ? "bg-[#386BFF] border-[#386BFF] text-white shadow-md shadow-blue-500/25"
                              : isDark
                              ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                              : "bg-[#F5F8FF] border-[#E0E9FA] text-[#102B59] hover:bg-white hover:border-[#386BFF]"
                          }`}
                          title={bookmarked ? "Remove Bookmark" : "Save Bookmark"}
                        >
                          {bookmarked ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4 text-[#60769A]" />}
                        </button>
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isDark
                              ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                              : "bg-[#F5F8FF] border-[#E0E9FA] text-[#102B59] hover:bg-white hover:border-[#386BFF]"
                          }`}
                          title="Open Original Source"
                        >
                          <ExternalLink className="w-4 h-4 text-[#60769A]" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* If No Results at All */}
          {results.length === 0 && !currentAiArticle && (!newsArticles || newsArticles.length === 0) && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-[#386BFF]/10 text-[#386BFF] flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-[#102B59]"}`}>
                Synthesizing Knowledge with AI
              </h2>
              <p className="text-xs text-[#60769A] max-w-md mx-auto mb-6">
                Click below to synthesize a full encyclopedic article and discover news for "{query}" with InfoAtlas AI.
              </p>
              <button
                onClick={handleSynthesizeAi}
                disabled={isGeneratingAi}
                className="bg-[#386BFF] hover:bg-blue-600 text-white text-xs font-semibold px-6 py-3 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {isGeneratingAi ? "Synthesizing Article..." : `Generate Article for "${query}"`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Related Videos Modal for Social Media Videos */}
      <RelatedVideosModal
        isOpen={showVideosModal}
        onClose={() => setShowVideosModal(false)}
        query={query}
        isDark={isDark}
      />
    </div>
  );
};

