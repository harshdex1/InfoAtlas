import React, { useState, useEffect } from "react";
import { AiKnowledgeArticle, TopicImage } from "../types";
import { Sparkles, BookOpen, Check, Bookmark, ArrowLeft, RefreshCw, Send, ListTree, Lightbulb, Compass, Share2, ChevronRight, Languages } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage, SUPPORTED_LANGUAGES } from "../context/LanguageContext";
import { useNavigation } from "../context/NavigationContext";
import { askGemini, fetchTopicImage, translateGeneralArticle } from "../services/api";
import { TopicImageCard } from "./TopicImageCard";
import { formatSafeDate } from "../utils/date";
import { LanguageSelector } from "./LanguageSelector";
import { ArticleFollowUpModal } from "./ArticleFollowUpModal";

interface AiKnowledgeArticleReaderProps {
  article: AiKnowledgeArticle;
  onBack: () => void;
  isDark: boolean;
  onExploreTopic?: (topic: string) => void;
}

export const AiKnowledgeArticleReader: React.FC<AiKnowledgeArticleReaderProps> = ({
  article,
  onBack,
  isDark,
  onExploreTopic,
}) => {
  const { addBookmark, removeBookmark, isBookmarked } = useAuth();
  const { t, language } = useLanguage();
  const articleUrl = `https://infoatlas.app/ai-knowledge/${encodeURIComponent(article.title.toLowerCase().replace(/\s+/g, "-"))}`;
  const bookmarked = isBookmarked(articleUrl);

  const [copied, setCopied] = useState<boolean>(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState<boolean>(false);
  const { registerBackHandler } = useNavigation();

  useEffect(() => {
    if (showFollowUpModal) {
      const unregister = registerBackHandler(75, () => {
        setShowFollowUpModal(false);
        return true;
      }, "ai_knowledge_followup_modal");
      return () => unregister();
    }
  }, [showFollowUpModal, registerBackHandler]);
  const [activeSection, setActiveSection] = useState<string>(article.sections[0]?.title || "");
  const [heroImage, setHeroImage] = useState<TopicImage | null>(article.heroImage || null);

  // Translation state for rendering AI article in selected language
  const [translatedArticle, setTranslatedArticle] = useState<{
    title: string;
    tagline: string;
    summary: string;
    keyTakeaways: string[];
    sections: { title: string; content: string }[];
  } | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [translatedLang, setTranslatedLang] = useState<string>("en");

  // Translation effect for AI knowledge article
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
          title: article.title,
          tagline: article.tagline,
          summary: article.summary,
          keyTakeaways: article.keyTakeaways,
          sections: article.sections.map((s) => ({ title: s.title, content: s.content })),
          targetLang: language,
        });
        if (isMounted && res) {
          setTranslatedArticle(res);
          setTranslatedLang(language);
          setShowOriginal(false);
        }
      } catch (e) {
        console.error("AI article translation error:", e);
      } finally {
        if (isMounted) setIsTranslating(false);
      }
    }

    translate();
    return () => {
      isMounted = false;
    };
  }, [article, language]);

  useEffect(() => {
    let isMounted = true;
    if (article.heroImage) {
      setHeroImage(article.heroImage);
    } else {
      // Step 1 - Step 5 automatic resolution: check verified source or AI generation
      fetchTopicImage(article.title, {
        context: article.tagline || article.summary,
        category: article.category,
      }).then((res) => {
        if (isMounted && res.image) {
          setHeroImage(res.image);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [article.title, article.heroImage]);

  // Interactive AI Companion inside the article
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [activeAiTab, setActiveAiTab] = useState<"summary" | "simple" | "chat">("summary");


  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.tagline,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAiAction = async (action: "summary" | "simple" | "chat", customQuery?: string) => {
    setIsAiLoading(true);
    let prompt = customQuery || "";
    let systemInstruction = "";

    const contextText = `${article.title}: ${article.tagline}\n\nSummary:\n${article.summary}\n\nKey Takeaways:\n${article.keyTakeaways.join("\n")}\n\nContent:\n${article.sections.map((s) => `${s.title}:\n${s.content}`).join("\n\n")}`;

    if (action === "summary") {
      prompt = "Generate a 3-bullet concise executive takeaway of this AI knowledge article.";
      systemInstruction = "You are an encyclopedic synthesizer. Be concise, precise, and educational.";
    } else if (action === "simple") {
      prompt = "Explain this article as if I am 12 years old using a memorable analogy.";
      systemInstruction = "You are an award-winning science and history communicator who explains complex ideas with clarity.";
    }

    const res = await askGemini(prompt, contextText, systemInstruction);
    setAiResponse(res);
    setIsAiLoading(false);
  };

  const handleCustomAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isAiLoading) return;
    handleAiAction("chat", aiPrompt.trim());
    setAiPrompt("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
            isDark
              ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
              : "bg-white border-[#E0E9FA] text-[#102B59] hover:bg-[#F5F8FF]"
          }`}
        >
          <ArrowLeft className="w-4 h-4 text-[#386BFF]" />
          <span>{t("back_to_search", "Back to Search")}</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <LanguageSelector isDark={isDark} variant="compact" />

          <button
            type="button"
            onClick={() => setShowFollowUpModal(true)}
            className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold px-3.5 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#386BFF] to-[#7252FF] hover:from-[#2e59d9] hover:to-[#5e3ed9] text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
            title="Ask AI follow-up questions about this topic"
          >
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>{t("ask_follow_up", "Ask Follow-Up")}</span>
          </button>

          <button
            onClick={() => {
              if (bookmarked) {
                removeBookmark(articleUrl);
              } else {
                addBookmark({
                  title: article.title,
                  snippet: article.tagline || article.summary.substring(0, 140),
                  url: articleUrl,
                });
              }
            }}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
              bookmarked
                ? "bg-[#386BFF] border-[#386BFF] text-white shadow-md shadow-blue-500/25"
                : isDark
                ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                : "bg-white border-[#E0E9FA] text-[#102B59] hover:bg-[#F5F8FF]"
            }`}
          >
            {bookmarked ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            <span>{bookmarked ? "Bookmarked" : "Bookmark Article"}</span>
          </button>

          <button
            onClick={handleShare}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
              copied
                ? "bg-emerald-600 border-emerald-600 text-white"
                : isDark
                ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                : "bg-white border-[#E0E9FA] text-[#102B59] hover:bg-[#F5F8FF]"
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>{copied ? "Link Copied" : "Share"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Article + AI Companion */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Article Body */}
        <div className="lg:col-span-8 space-y-6">
          {(() => {
            const isUsingTranslation = language !== "en" && !showOriginal && !!translatedArticle;
            const displayTitle = isUsingTranslation ? translatedArticle!.title : article.title;
            const displayTagline = isUsingTranslation ? translatedArticle!.tagline : article.tagline;
            const displaySummary = isUsingTranslation ? translatedArticle!.summary : article.summary;
            const displayKeyTakeaways = isUsingTranslation ? translatedArticle!.keyTakeaways : article.keyTakeaways;
            const displaySections = isUsingTranslation ? translatedArticle!.sections : article.sections;
            const currentLangItem = SUPPORTED_LANGUAGES.find((l) => l.code === language) || {
              name: language,
              nativeName: language,
            };

            return (
              <article
                className={`p-6 sm:p-10 rounded-3xl border transition-all ${
                  isDark ? "bg-slate-900/60 border-slate-800 text-slate-200" : "bg-white border-[#E0E9FA] text-[#102B59] shadow-sm"
                }`}
              >
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
                              ? "पूरे ज्ञान लेख का हिन्दी में अनुवाद हो रहा है..."
                              : `Translating article into ${currentLangItem.nativeName}...`
                            : showOriginal
                            ? language === "hi"
                              ? "मूल अंग्रेज़ी संस्करण"
                              : "Viewing Original English"
                            : language === "hi"
                            ? "यह पूरा ज्ञान लेख हिन्दी में अनुवादित है"
                            : `Full article translated into ${currentLangItem.nativeName}`}
                          {!isTranslating && !showOriginal && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#386BFF]/20 text-[#386BFF] font-semibold">
                              InfoAtlas Neural AI
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          {isTranslating
                            ? language === "hi"
                              ? "शीर्षक, मुख्य बिंदु, विस्तृत खंड और सारांश का अनुवाद किया जा रहा है..."
                              : "Translating title, key concepts, detailed sections, and executive summary..."
                            : showOriginal
                            ? language === "hi"
                              ? "अनुवादित संस्करण देखने के लिए दाएँ बटन पर क्लिक करें।"
                              : "Click toggle to view the translated version."
                            : language === "hi"
                            ? "शीर्षक, सारांश, मुख्य बिंदु और सभी पैराग्राफ आपकी चुनी हुई भाषा में हैं।"
                            : "Headlines, summary, key concepts, and all deep sections are rendered in your selected language."}
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

                {/* Sourced vs AI synthesized badge */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/15 to-violet-500/15 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-500/25">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Knowledge Synthesizer</span>
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    isDark ? "bg-slate-800 text-slate-400" : "bg-[#F5F8FF] text-[#60769A]"
                  }`}>
                    {article.category}
                  </span>
                  <span className="text-[11px] text-[#60769A] ml-auto">
                    Updated {formatSafeDate(article.generatedAt)}
                  </span>
                </div>

                {/* Title & Tagline */}
                <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 ${
                  isDark ? "text-white" : "text-[#102B59]"
                }`}>
                  {displayTitle}
                </h1>
                <p className="text-base sm:text-lg text-[#386BFF] font-medium mb-6 leading-relaxed">
                  {displayTagline}
                </p>

                {/* Featured Educational / Conceptual Hero Image */}
                <div className="mb-8">
                  <TopicImageCard
                    image={heroImage}
                    topic={article.title}
                    context={article.tagline || article.summary}
                    category={article.category}
                    isDark={isDark}
                    aspectRatio="16:9"
                    showRegenerateOption={true}
                    onImageUpdated={(newImg) => setHeroImage(newImg)}
                  />
                </div>

                {/* Key Takeaways Box */}
                {displayKeyTakeaways && displayKeyTakeaways.length > 0 && (
                  <div className={`p-6 rounded-2xl mb-8 border ${
                    isDark
                      ? "bg-slate-950/80 border-slate-800"
                      : "bg-gradient-to-br from-[#F5F8FF] to-blue-50/50 border-[#E0E9FA]"
                  }`}>
                    <div className="flex items-center gap-2 mb-3 text-xs font-bold tracking-wider uppercase text-[#386BFF]">
                      <Lightbulb className="w-4 h-4" />
                      <span>{language === "hi" ? "मुख्य बिंदु व अवधारणाएँ" : "Key Takeaways & Core Concepts"}</span>
                    </div>
                    <ul className="space-y-2.5">
                      {displayKeyTakeaways.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#386BFF] mt-2 shrink-0" />
                          <span className={isDark ? "text-slate-300" : "text-slate-700"}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Executive Summary */}
                <div className="mb-10">
                  <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 ${
                    isDark ? "text-slate-400" : "text-[#60769A]"
                  }`}>
                    {language === "hi" ? "कार्यकारी सारांश और परिभाषा" : "Executive Summary & Definition"}
                  </h2>
                  <div className={`text-sm sm:text-base leading-relaxed whitespace-pre-line space-y-4 ${
                    isDark ? "text-slate-200" : "text-slate-800"
                  }`}>
                    {displaySummary}
                  </div>
                </div>

                {/* Table of Contents Jump Links */}
                {displaySections && displaySections.length > 1 && (
                  <div className={`p-4 rounded-2xl border mb-8 ${
                    isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#60769A] mb-2">
                      <ListTree className="w-3.5 h-3.5" />
                      <span>{language === "hi" ? "विषय सूची (Table of Contents)" : "Article Table of Contents"}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {displaySections.map((sec, idx) => (
                        <a
                          key={idx}
                          href={`#sec-${idx}`}
                          onClick={() => setActiveSection(sec.title)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                            activeSection === sec.title
                              ? "bg-[#386BFF] border-[#386BFF] text-white"
                              : isDark
                              ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                              : "bg-white border-slate-200 text-slate-700 hover:text-[#386BFF]"
                          }`}
                        >
                          {sec.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deep Sections */}
                <div className="space-y-8">
                  {displaySections.map((section, idx) => (
                    <section key={idx} id={`sec-${idx}`} className="scroll-mt-24 pt-4 border-t border-slate-200 dark:border-slate-800/80">
                      <h3 className={`text-xl sm:text-2xl font-bold mb-4 tracking-tight flex items-center gap-2 ${
                        isDark ? "text-white" : "text-[#102B59]"
                      }`}>
                        <span className="w-2 h-2 rounded-full bg-[#386BFF]"></span>
                        <span>{section.title}</span>
                      </h3>
                      <div className={`text-sm sm:text-base leading-relaxed whitespace-pre-line space-y-4 ${
                        isDark ? "text-slate-300" : "text-slate-700"
                      }`}>
                        <p>{section.content}</p>
                      </div>
                    </section>
                  ))}
                </div>

                {/* Related Topics Exploration Strip */}
                {article.relatedTopics && article.relatedTopics.length > 0 && (
                  <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#60769A] mb-3">
                      <Compass className="w-4 h-4 text-[#386BFF]" />
                      <span>{language === "hi" ? "संबंधित विषय व क्षेत्र" : "Explore Related Topics & Fields"}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {article.relatedTopics.map((topic, idx) => (
                        <button
                          key={idx}
                          onClick={() => onExploreTopic && onExploreTopic(topic)}
                          className={`text-xs px-3.5 py-2 rounded-xl border font-semibold transition-all cursor-pointer ${
                            isDark
                              ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-[#386BFF]/20 hover:border-[#386BFF]/40 hover:text-white"
                              : "bg-[#F5F8FF] border-[#E0E9FA] text-[#102B59] hover:bg-white hover:border-[#386BFF] hover:text-[#386BFF]"
                          }`}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
                        {language === "hi" ? "इस ज्ञान लेख पर प्रश्न पूछें" : `Ask follow-up questions about ${displayTitle}`}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {language === "hi"
                          ? "इन्फोएटलस एआई से इस विषय के सिद्धांतों, इतिहास या प्रभाव पर हिन्दी में सीधे प्रश्न पूछें।"
                          : "Ask InfoAtlas AI follow-up questions for deeper analysis, underlying mechanisms, or practical applications."}
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

                {/* Citation & Methodology Notice */}
                <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-[#60769A]">
                  <span>{article.citationNote}</span>
                  <span className="font-semibold text-indigo-500">Synthesized with Gemini</span>
                </div>
              </article>
            );
          })()}
        </div>

        {/* Sidebar: AI Companion for this Article */}
        <div className="lg:col-span-4 sticky top-24 space-y-6">
          <div
            className={`p-6 sm:p-7 rounded-3xl border ${
              isDark ? "bg-slate-900/90 border-slate-800 text-slate-200" : "bg-white border-[#E0E9FA] text-[#102B59] shadow-sm"
            }`}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#386BFF] to-[#7252FF] text-white flex items-center justify-center shadow">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Topic AI Companion</h3>
                <span className="text-[10px] text-indigo-400">Ask questions about this article</span>
              </div>
            </div>

            {/* Quick Action Tabs */}
            <div className="grid grid-cols-3 gap-1.5 mb-4">
              <button
                onClick={() => {
                  setActiveAiTab("summary");
                  handleAiAction("summary");
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeAiTab === "summary"
                    ? "bg-[#386BFF] text-white shadow-md shadow-blue-500/25"
                    : isDark
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-[#F5F8FF] text-[#60769A] hover:bg-slate-200"
                }`}
              >
                3-Bullet
              </button>
              <button
                onClick={() => {
                  setActiveAiTab("simple");
                  handleAiAction("simple");
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeAiTab === "simple"
                    ? "bg-[#386BFF] text-white shadow-md shadow-blue-500/25"
                    : isDark
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-[#F5F8FF] text-[#60769A] hover:bg-slate-200"
                }`}
              >
                Explain Simply
              </button>
              <button
                onClick={() => setActiveAiTab("chat")}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeAiTab === "chat"
                    ? "bg-[#386BFF] text-white shadow-md shadow-blue-500/25"
                    : isDark
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-[#F5F8FF] text-[#60769A] hover:bg-slate-200"
                }`}
              >
                Ask Custom
              </button>
            </div>

            {/* AI Output Window */}
            <div
              className={`p-4 rounded-2xl border mb-4 min-h-[160px] max-h-72 overflow-y-auto text-xs leading-relaxed ${
                isDark ? "bg-slate-950/70 border-slate-800 text-slate-300" : "bg-[#F5F8FF] border-[#E0E9FA] text-[#102B59]"
              }`}
            >
              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center h-28 gap-2 text-[#386BFF]">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-semibold">Generating AI explanation...</span>
                </div>
              ) : (
                <div className="whitespace-pre-line">
                  {aiResponse || "Select an action above or type a follow-up question below."}
                </div>
              )}
            </div>

            {/* Custom Question Input */}
            <form onSubmit={handleCustomAiSubmit} className="relative">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask any question about this topic..."
                className={`w-full text-xs pl-3.5 pr-10 py-2.5 rounded-xl border transition-all ${
                  isDark
                    ? "bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-[#386BFF]"
                    : "bg-[#F5F8FF] border-[#E0E9FA] text-[#102B59] placeholder-[#60769A] focus:border-[#386BFF]"
                }`}
              />
              <button
                type="submit"
                disabled={isAiLoading || !aiPrompt.trim()}
                className="absolute right-2 top-2 p-1 rounded-lg bg-[#386BFF] hover:bg-blue-600 text-white transition-all disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Interactive Follow-Up Questions Modal */}
      <ArticleFollowUpModal
        isOpen={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        articleTitle={article.title}
        articleSource="InfoAtlas AI Knowledge Synthesis"
        articleContext={`${article.title}: ${article.tagline || ""}\n\nSummary:\n${article.summary}\n\nKey Takeaways:\n${article.keyTakeaways?.join("\n") || ""}\n\nSections:\n${article.sections?.map((s) => `${s.title}:\n${s.content}`).join("\n\n") || ""}`}
        category={article.category}
        isDark={isDark}
      />
    </div>
  );
};
