import React, { useState } from "react";
import { SearchResult, AiKnowledgeArticle, TopicImage } from "../types";
import { Search, ExternalLink, Bookmark, Check, ArrowLeft, Sparkles, Globe, Lightbulb, ChevronRight, BookOpen, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { generateAiKnowledgeArticleApi } from "../services/api";

interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  aiArticle?: AiKnowledgeArticle;
  topicImage?: TopicImage;
  sourceUsed: "wikimedia" | "ai-fallback" | "ai-synthesized";
  isAiFallback: boolean;
  statusMessage: string;
  isLoading: boolean;
  onSelectArticle: (title: string) => void;
  onSelectAiArticle: (article: AiKnowledgeArticle) => void;
  onBackToHome: () => void;
  onExploreTopic: (topic: string) => void;
  isDark: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  results,
  aiArticle,
  topicImage,
  sourceUsed,
  isAiFallback,
  statusMessage,
  isLoading,
  onSelectArticle,
  onSelectAiArticle,
  onBackToHome,
  onExploreTopic,
  isDark,
}) => {
  const { addBookmark, removeBookmark, isBookmarked } = useAuth();
  const [localAiArticle, setLocalAiArticle] = useState<AiKnowledgeArticle | undefined>(aiArticle);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

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
          <span>Back to Home</span>
        </button>

        <div className="text-xs text-[#60769A]">
          Results for <span className="font-bold text-[#386BFF]">"{query}"</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 py-12">
          <div className="text-center pb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#386BFF] to-[#7252FF] text-white flex items-center justify-center mx-auto mb-3 shadow-md animate-pulse">
              <Sparkles className="w-6 h-6 animate-spin-slow" />
            </div>
            <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-[#102B59]"}`}>
              Searching Knowledge Sources...
            </h3>
            <p className="text-xs text-[#60769A] mt-1">
              Checking Wikimedia records and preparing encyclopedic synthesis
            </p>
          </div>
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
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate AI Deep Article</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* FEATURED: AI Synthesized Encyclopedic Article Card */}
          {currentAiArticle && (
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
                  <span>AI Comprehensive Knowledge Article</span>
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
                        ? "AI Conceptual Illustration"
                        : "Verified Knowledge Source Image"}
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
                    <span>Key Takeaway Highlight:</span>
                  </div>
                  <p className={`text-xs italic ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    "{currentAiArticle.keyTakeaways[0]}"
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-bold text-[#386BFF]">
                  <span>Read Full Encyclopedic Report ({currentAiArticle.sections?.length || 3} Sections)</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
                <span className="text-[11px] text-[#60769A]">
                  Synthesized with Gemini
                </span>
              </div>
            </div>
          )}

          {/* Standard Verified Wikimedia Results */}
          {results.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-[#60769A]">
                  Verified Reference Sources from Wikimedia ({results.length})
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

          {/* If No Wikimedia Results and No AI Article yet */}
          {results.length === 0 && !currentAiArticle && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-[#386BFF]/10 text-[#386BFF] flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-[#102B59]"}`}>
                Synthesizing Knowledge with AI
              </h2>
              <p className="text-xs text-[#60769A] max-w-md mx-auto mb-6">
                Click below to synthesize a full encyclopedic article for "{query}" with InfoAtlas AI.
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
    </div>
  );
};
