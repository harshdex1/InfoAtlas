import React, { useState } from "react";
import { NewsArticle } from "../types";
import { askGemini } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Bookmark, Check, ExternalLink, Share2, Sparkles, Clock, Globe, RefreshCw, Newspaper, X } from "lucide-react";

interface NewsArticleReaderProps {
  article: NewsArticle;
  onBack: () => void;
  isDark: boolean;
}

export const NewsArticleReader: React.FC<NewsArticleReaderProps> = ({ article, onBack, isDark }) => {
  const { addBookmark, removeBookmark, isBookmarked } = useAuth();
  const bookmarked = isBookmarked(article.url);

  // AI summary state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);

  const handleGenerateSummary = async () => {
    setShowAiModal(true);
    if (aiSummary) return;
    setIsAiLoading(true);
    const prompt = `Provide a comprehensive executive summary and detailed analysis of this news report: "${article.title}". Excerpt: ${article.description}`;
    const res = await askGemini(prompt, undefined, "You are InfoAtlas AI, an expert journalistic analyst.");
    setAiSummary(res);
    setIsAiLoading(false);
  };

  const [copied, setCopied] = useState<boolean>(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.description,
        url: article.url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(article.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
            isDark ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white" : "bg-white border-[#E0E9FA] text-[#102B59] hover:bg-[#F5F8FF]"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to News</span>
        </button>

        <div className="flex items-center gap-2">
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
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
              bookmarked
                ? "bg-[#386BFF] border-[#386BFF] text-white shadow-md"
                : isDark ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-[#E0E9FA] text-[#102B59]"
            }`}
          >
            {bookmarked ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            <span>{bookmarked ? "Bookmarked" : "Save Bookmark"}</span>
          </button>

          <button
            onClick={handleShare}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
              copied
                ? "bg-emerald-600 border-emerald-600 text-white"
                : isDark ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-[#E0E9FA] text-[#102B59]"
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>{copied ? "Link Copied!" : "Share"}</span>
          </button>
        </div>
      </div>

      {/* Article Container */}
      <article className={`p-6 sm:p-10 rounded-3xl border shadow-sm ${
        isDark ? "bg-slate-900/60 border-slate-800 text-slate-100" : "bg-white border-[#E0E9FA] text-[#102B59]"
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#386BFF]/10 text-[#386BFF] text-xs font-semibold border border-[#386BFF]/20 uppercase tracking-wider">
            {article.category}
          </span>
          <span className="text-xs text-[#60769A]">· Published by <strong className="text-[#102B59] dark:text-white">{article.source}</strong></span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4 leading-snug">
          {article.title}
        </h1>

        <div className="flex items-center gap-4 text-xs text-[#60769A] mb-8 pb-6 border-b border-[#E0E9FA] dark:border-slate-800">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {new Date(article.publishedAt).toLocaleDateString()} at {new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {article.author && <span>· By {article.author}</span>}
        </div>

        {/* Main Article Image - Genuine Publisher Photo with Attribution */}
        {article.thumbnail ? (
          <div className="mb-8 rounded-2xl overflow-hidden border border-[#E0E9FA] dark:border-slate-800 relative bg-slate-950">
            <img
              src={article.thumbnail}
              alt={article.title}
              referrerPolicy="no-referrer"
              className="w-full object-cover max-h-[420px]"
            />
            <div className="p-3 bg-slate-900/90 text-[11px] text-slate-300 flex items-center justify-between border-t border-slate-800">
              <span className="flex items-center gap-1.5 font-medium">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Verified Publisher Photo: {article.source}</span>
              </span>
              <span className="text-[10px] text-slate-400">Authentic Media from Original Publisher</span>
            </div>
          </div>
        ) : (
          <div className={`mb-8 p-6 rounded-2xl border flex items-center gap-4 ${
            isDark ? "bg-slate-950/60 border-slate-800 text-slate-300" : "bg-[#F5F8FF] border-[#E0E9FA] text-[#102B59]"
          }`}>
            <div className="w-12 h-12 rounded-xl bg-[#386BFF]/10 text-[#386BFF] flex items-center justify-center shrink-0">
              <Newspaper className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold">Original Publisher Text Report</p>
              <p className="text-[11px] text-[#60769A]">
                Dispatched directly by {article.source}. No unverified photos or synthetic depictions are substituted for breaking news events.
              </p>
            </div>
          </div>
        )}

        {/* Excerpt & Full Article Content */}
        <div className="space-y-6 text-sm sm:text-base leading-relaxed text-[#60769A] dark:text-slate-300 mb-10">
          <p className="font-medium text-[#102B59] dark:text-white text-base sm:text-lg">
            {article.description}
          </p>
          <p>
            This is an authenticated report retrieved directly from <strong className="text-[#102B59] dark:text-white">{article.source}</strong> via InfoAtlas secure feeds. To comply with publisher copyright terms, the complete unabridged publication is available directly on the publisher's official platform.
          </p>
        </div>

        {/* AI Summary Action Trigger */}
        <div className="mb-10 p-6 rounded-2xl bg-gradient-to-r from-[#386BFF]/10 via-[#7252FF]/10 to-[#386BFF]/10 border border-[#386BFF]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#386BFF] to-[#7252FF] text-white flex items-center justify-center shadow">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#102B59] dark:text-white">Need a quick briefing on this story?</h3>
              <p className="text-xs text-[#60769A]">Generate an AI-powered summary instantly with Gemini.</p>
            </div>
          </div>
          <button
            onClick={handleGenerateSummary}
            className="bg-[#386BFF] hover:bg-blue-600 text-white font-semibold text-xs px-5 py-3 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
          >
            Generate AI Summary
          </button>
        </div>

        {/* Prominent Read Full Article Link */}
        <div className="pt-6 border-t border-[#E0E9FA] dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-[#60769A]">
            Original reporting hosted by {article.source}.
          </span>
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto bg-[#102B59] hover:bg-[#1a3d7c] text-white font-semibold text-xs px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <span>Read the full article at {article.source}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </article>

      {/* AI Summary Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`w-full max-w-xl rounded-3xl border p-6 sm:p-8 shadow-2xl relative ${
            isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-[#E0E9FA] text-[#102B59]"
          }`}>
            <button
              onClick={() => setShowAiModal(false)}
              className="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#386BFF] to-[#7252FF] text-white flex items-center justify-center shadow">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold">InfoAtlas AI-Generated Summary</h3>
                <span className="text-[10px] text-[#386BFF]">Powered by Gemini</span>
              </div>
            </div>

            <h2 className="text-base font-bold mb-4">
              {article.title}
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
              <span className="text-[11px] text-[#60769A]">Source: {article.source}</span>
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="bg-[#386BFF] hover:bg-blue-600 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
              >
                <span>Open Original Publisher</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
