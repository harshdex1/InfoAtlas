import React, { useState, useEffect } from "react";
import { ArticleDetail, TopicImage } from "../types";
import { getWikipediaArticle, askGemini, fetchTopicImage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Bookmark, Check, ExternalLink, Share2, Sparkles, Globe, BookOpen, MessageSquare, RefreshCw, Send } from "lucide-react";
import { TopicImageCard } from "./TopicImageCard";

interface ArticleReaderProps {
  title: string;
  onBack: () => void;
  isDark: boolean;
}

export const ArticleReader: React.FC<ArticleReaderProps> = ({ title, onBack, isDark }) => {
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [topicImage, setTopicImage] = useState<TopicImage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { addBookmark, removeBookmark, isBookmarked, addRecentlyViewed } = useAuth();

  // AI Assistant state
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [activeAiTab, setActiveAiTab] = useState<"summary" | "simple" | "chat">("summary");

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError(null);
      const data = await getWikipediaArticle(title);
      if (!isMounted) return;
      if (data) {
        setArticle(data);
        addRecentlyViewed({ title: data.title, url: data.content_urls });

        // STEP 1 - 3: Check if article has original source image
        if (data.thumbnail) {
          setTopicImage({
            url: data.thumbnail,
            sourceType: "wikimedia-source",
            isAiGenerated: false,
            title: data.title,
            caption: data.description ? `${data.title}: ${data.description}` : `Original Wikimedia knowledge image for ${data.title}`,
            attribution: "Wikimedia Commons & Wikipedia Open Knowledge",
            aspectRatio: "16:9",
          });
        } else {
          // STEP 4 & 5: If no suitable image exists, automatically request from image service
          fetchTopicImage(data.title, { context: data.description || data.extract }).then((res) => {
            if (isMounted && res.image) {
              setTopicImage(res.image);
            }
          });
        }

        // Automatically fetch initial summary/explanation
        fetchAiAction("summary", data.extract);
      } else {
        setError("Failed to load article details from Wikipedia.");
      }
      setIsLoading(false);
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [title]);

  const fetchAiAction = async (actionType: "summary" | "simple" | "chat", contextText: string, customPrompt?: string) => {
    setIsAiLoading(true);
    let prompt = customPrompt || "";
    let systemInstruction = "";

    if (actionType === "summary") {
      prompt = "Provide a structured 3-bullet executive summary of this article.";
      systemInstruction = "You are an expert knowledge synthesizer. Provide a concise, highly informative summary.";
    } else if (actionType === "simple") {
      prompt = "Explain this topic as if I am 10 years old, using a clear analogy.";
      systemInstruction = "You are an engaging science communicator who explains complex topics with crystal-clear analogies.";
    }

    const res = await askGemini(prompt, contextText, systemInstruction);
    setAiResponse(res);
    setIsAiLoading(false);
  };

  const handleCustomAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || !article) return;
    fetchAiAction("chat", article.extract, aiPrompt.trim());
    setAiPrompt("");
  };

  const bookmarked = article ? isBookmarked(article.content_urls) : false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all ${
            isDark ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:text-slate-900"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Results</span>
        </button>

        {article && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (bookmarked) {
                  removeBookmark(article.content_urls);
                } else {
                  addBookmark({
                    title: article.title,
                    snippet: article.extract.substring(0, 150) + "...",
                    url: article.content_urls,
                  });
                }
              }}
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all ${
                bookmarked
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : isDark
                  ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:text-slate-900"
              }`}
            >
              {bookmarked ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              <span>{bookmarked ? "Bookmarked" : "Save Bookmark"}</span>
            </button>

            <a
              href={article.content_urls}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all ${
                isDark ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:text-slate-900"
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              <span>Original Source</span>
            </a>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-12">
          <div className={`lg:col-span-2 p-8 rounded-3xl border animate-pulse ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="h-8 bg-slate-800 rounded w-2/3 mb-6"></div>
            <div className="h-4 bg-slate-800 rounded w-full mb-4"></div>
            <div className="h-4 bg-slate-800 rounded w-full mb-4"></div>
            <div className="h-4 bg-slate-800 rounded w-3/4"></div>
          </div>
          <div className={`p-8 rounded-3xl border animate-pulse ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="h-6 bg-slate-800 rounded w-1/2 mb-4"></div>
            <div className="h-24 bg-slate-800 rounded w-full"></div>
          </div>
        </div>
      ) : error || !article ? (
        <div className="text-center py-20">
          <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Article Unavailable</h2>
          <p className="text-xs text-slate-400 mb-6">{error || "Could not retrieve article."}</p>
          <button
            onClick={onBack}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-6 py-3 rounded-xl transition-all"
          >
            Go Back
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Article Content */}
          <div className={`lg:col-span-2 p-8 sm:p-10 rounded-3xl border ${isDark ? "bg-slate-900/60 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
                <Globe className="w-3.5 h-3.5" />
                <span>Verified Source: Wikimedia REST API</span>
              </span>
            </div>

            <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
              {article.title}
            </h1>

            {article.description && (
              <p className="text-sm font-medium text-indigo-400 mb-6">{article.description}</p>
            )}

            {/* Educational Topic Image (Verified Source or AI Generated) */}
            <div className="mb-8">
              <TopicImageCard
                image={topicImage}
                topic={article.title}
                context={article.description || article.extract}
                isDark={isDark}
                aspectRatio="16:9"
                showRegenerateOption={true}
                onImageUpdated={(newImg) => setTopicImage(newImg)}
              />
            </div>

            <div className="prose prose-invert max-w-none text-sm sm:text-base leading-relaxed space-y-4">
              <p>{article.extract}</p>
            </div>
          </div>

          {/* AI Knowledge Assistant Sidebar */}
          <div className={`p-6 sm:p-8 rounded-3xl border sticky top-24 ${isDark ? "bg-slate-900/90 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"}`}>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">InfoAtlas AI Assistant</h3>
                <span className="text-[10px] text-indigo-400">Powered by Gemini</span>
              </div>
            </div>

            {/* AI Action Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                onClick={() => {
                  setActiveAiTab("summary");
                  fetchAiAction("summary", article.extract);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  activeAiTab === "summary"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => {
                  setActiveAiTab("simple");
                  fetchAiAction("simple", article.extract);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  activeAiTab === "simple"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Explain Simply
              </button>
              <button
                onClick={() => setActiveAiTab("chat")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  activeAiTab === "chat"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Ask AI
              </button>
            </div>

            {/* AI Output Container */}
            <div className={`p-4 rounded-2xl border mb-6 min-h-[180px] max-h-80 overflow-y-auto text-xs leading-relaxed ${
              isDark ? "bg-slate-950/60 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
            }`}>
              {isAiLoading ? (
                <div className="flex items-center justify-center h-32 gap-2 text-indigo-400">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-medium">Generating AI insights...</span>
                </div>
              ) : (
                <div className="whitespace-pre-line">{aiResponse || "Select an AI action above."}</div>
              )}
            </div>

            {/* Custom AI Chat Input */}
            <form onSubmit={handleCustomAiSubmit} className="relative">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask a follow-up question..."
                className={`w-full text-xs pl-4 pr-10 py-3 rounded-xl border transition-all ${
                  isDark ? "bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500"
                }`}
              />
              <button
                type="submit"
                disabled={isAiLoading || !aiPrompt.trim()}
                className="absolute right-2 top-2 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
