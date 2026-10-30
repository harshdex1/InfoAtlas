import React, { useState, useEffect } from "react";
import { ArticleDetail, TopicImage } from "../types";
import { getWikipediaArticle, askGemini, fetchTopicImage, translateGeneralArticle } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage, SUPPORTED_LANGUAGES } from "../context/LanguageContext";
import { useNavigation } from "../context/NavigationContext";
import { ArrowLeft, Bookmark, Check, ExternalLink, Share2, Sparkles, Globe, BookOpen, MessageSquare, RefreshCw, Send, ChevronRight, Languages } from "lucide-react";
import { TopicImageCard } from "./TopicImageCard";
import { LanguageSelector } from "./LanguageSelector";
import { ArticleFollowUpModal } from "./ArticleFollowUpModal";

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
  const { t, language } = useLanguage();
  const { registerBackHandler } = useNavigation();
  const [showFollowUpModal, setShowFollowUpModal] = useState<boolean>(false);

  useEffect(() => {
    if (showFollowUpModal) {
      const unregister = registerBackHandler(75, () => {
        setShowFollowUpModal(false);
        return true;
      }, "article_reader_followup_modal");
      return () => unregister();
    }
  }, [showFollowUpModal, registerBackHandler]);

  // Full Article Neural Translation State
  const [translatedArticle, setTranslatedArticle] = useState<{
    title: string;
    description: string;
    extract: string;
  } | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [translatedLang, setTranslatedLang] = useState<string>("en");

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

  // Translation effect for Wikipedia articles
  useEffect(() => {
    let isMounted = true;
    if (!article) return;
    if (language === "en") {
      setShowOriginal(false);
      return;
    }
    if (translatedLang === language && translatedArticle) return;

    async function translate() {
      setIsTranslating(true);
      try {
        const res = await translateGeneralArticle({
          title: article!.title,
          description: article!.description,
          extract: article!.extract,
          targetLang: language,
        });
        if (isMounted && res) {
          setTranslatedArticle(res);
          setTranslatedLang(language);
          setShowOriginal(false);
        }
      } catch (e) {
        console.error("Wikipedia article translation error:", e);
      } finally {
        if (isMounted) setIsTranslating(false);
      }
    }

    translate();
    return () => {
      isMounted = false;
    };
  }, [article, language]);

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

  const isUsingTranslation = language !== "en" && !showOriginal && !!translatedArticle;
  const displayTitle = isUsingTranslation ? translatedArticle!.title : article?.title;
  const displayDescription = isUsingTranslation ? translatedArticle!.description : article?.description;
  const displayExtract = isUsingTranslation ? translatedArticle!.extract : article?.extract;
  const currentLangItem = SUPPORTED_LANGUAGES.find((l) => l.code === language) || {
    name: language,
    nativeName: language,
  };

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
          <span>{t("back_to_search", "Back to Search")}</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <LanguageSelector isDark={isDark} variant="compact" />

          <button
            type="button"
            onClick={() => setShowFollowUpModal(true)}
            className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#386BFF] to-[#7252FF] hover:from-[#2e59d9] hover:to-[#5e3ed9] text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
            title="Ask AI follow-up questions about this topic"
          >
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>{t("ask_follow_up", "Ask Follow-Up")}</span>
          </button>

          {article && (
            <>
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
                className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                  bookmarked
                    ? "bg-[#386BFF] border-[#386BFF] text-white shadow-md"
                    : isDark
                    ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                    : "bg-white border-slate-200 text-slate-700 hover:text-slate-900"
                }`}
              >
                {bookmarked ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                <span>{bookmarked ? t("bookmarked", "Bookmarked") : t("save_bookmark", "Save Bookmark")}</span>
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
            </>
          )}
        </div>
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
            {/* Multilingual Translation Status Banner */}
            {language !== "en" && (
              <div
                className={`mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 transition-all ${
                  isDark
                    ? "bg-blue-950/40 border-blue-800/60 text-blue-200"
                    : "bg-blue-50/80 border-blue-200 text-blue-950"
                }`}
              >
                <div className="flex items-center gap-3">
                  {isTranslating ? (
                    <RefreshCw className="w-5 h-5 text-[#386BFF] animate-spin shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-[#386BFF]/15 text-[#386BFF] flex items-center justify-center shrink-0">
                      <Languages className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs sm:text-sm font-bold flex items-center gap-2 flex-wrap">
                      {isTranslating
                        ? language === "hi"
                          ? "ज्ञान लेख का हिन्दी में अनुवाद हो रहा है..."
                          : `Translating article into ${currentLangItem.nativeName}...`
                        : showOriginal
                        ? language === "hi"
                          ? "मूल अंग्रेज़ी संस्करण"
                          : "Viewing Original English"
                        : language === "hi"
                        ? "यह ज्ञान लेख हिन्दी में अनुवादित है"
                        : `Article translated into ${currentLangItem.nativeName}`}
                      {!isTranslating && !showOriginal && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#386BFF]/20 text-[#386BFF] font-semibold">
                          InfoAtlas Neural AI
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {isTranslating
                        ? language === "hi"
                          ? "शीर्षक और विस्तृत विवरण का अनुवाद किया जा रहा है..."
                          : "Translating title and encyclopedic extract..."
                        : showOriginal
                        ? language === "hi"
                          ? "अनुवादित संस्करण देखने के लिए दाएँ बटन पर क्लिक करें।"
                          : "Click toggle to view the translated version."
                        : language === "hi"
                        ? "यह पूरा लेख आपकी चुनी हुई भाषा में प्रदर्शित है।"
                        : "Entire article content is rendered in your selected language."}
                    </p>
                  </div>
                </div>

                {!isTranslating && translatedArticle && (
                  <button
                    type="button"
                    onClick={() => setShowOriginal(!showOriginal)}
                    className="px-3.5 py-1.5 rounded-xl border text-xs font-bold shrink-0 cursor-pointer transition-all bg-white dark:bg-slate-900 border-[#386BFF]/40 text-[#386BFF] hover:bg-[#386BFF] hover:text-white shadow-xs"
                  >
                    {showOriginal
                      ? language === "hi"
                        ? "अनुवादित देखें"
                        : "Show Translated"
                      : language === "hi"
                      ? "मूल अंग्रेज़ी देखें"
                      : "View Original"}
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
                <Globe className="w-3.5 h-3.5" />
                <span>Verified Source: Wikimedia REST API</span>
              </span>
            </div>

            <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
              {displayTitle}
            </h1>

            {displayDescription && (
              <p className="text-sm font-medium text-indigo-400 mb-6">{displayDescription}</p>
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
              <p>{displayExtract}</p>
            </div>

            {/* In-Article Follow-Up Card */}
            <div className={`mt-8 p-5 sm:p-6 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isDark ? "bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border-blue-500/30" : "bg-gradient-to-r from-blue-50 via-indigo-50/60 to-white border-blue-200"
            }`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#386BFF] to-[#7252FF] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Sparkles className="w-5 h-5 text-cyan-200" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold">
                    {language === "hi" ? "इस विषय के बारे में प्रश्न पूछें" : `Ask follow-up questions about ${article.title}`}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === "hi"
                      ? "इन्फोएटलस एआई से इस विषय की पृष्ठभूमि, महत्व या किसी भी पहलू पर हिन्दी में प्रश्न पूछें।"
                      : "Ask InfoAtlas AI follow-up questions for deeper background, historical context, or simple analogies."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFollowUpModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#386BFF] to-[#7252FF] hover:from-[#2e59d9] hover:to-[#5e3ed9] text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
              >
                <span>{t("ask_follow_up_btn", "Ask Follow-Up Question")}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
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

      {article && (
        <ArticleFollowUpModal
          isOpen={showFollowUpModal}
          onClose={() => setShowFollowUpModal(false)}
          articleTitle={article.title}
          articleSource="Wikimedia & Wikipedia Knowledge"
          articleContext={`${article.title}: ${article.description || ""}\n\n${article.extract}`}
          category="Knowledge"
          isDark={isDark}
        />
      )}
    </div>
  );
};
