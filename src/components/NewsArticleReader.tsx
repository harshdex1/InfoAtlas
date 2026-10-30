import React, { useState, useEffect } from "react";
import { NewsArticle, NewsArticleDetail } from "../types";
import { fetchNewsArticleDetail, askGemini, translateNewsArticleDetail } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  Bookmark,
  Check,
  ExternalLink,
  Share2,
  Sparkles,
  Clock,
  Globe,
  RefreshCw,
  Newspaper,
  CheckCircle2,
  Info,
  ListChecks,
  AlertCircle,
  X,
  FileText,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  Languages,
} from "lucide-react";
import { formatSafeDateTime, formatSafeTime } from "../utils/date";
import { InfoAtlasLoader } from "./InfoAtlasLoader";
import { useLanguage, SUPPORTED_LANGUAGES } from "../context/LanguageContext";
import { useNavigation } from "../context/NavigationContext";
import { ArticleFollowUpModal } from "./ArticleFollowUpModal";
import { LanguageSelector } from "./LanguageSelector";
import { DecorativeAiResponse } from "./DecorativeAiResponse";

interface NewsArticleReaderProps {
  article: NewsArticle;
  onBack: () => void;
  onSelectArticle?: (article: NewsArticle) => void;
  isDark: boolean;
}

export const NewsArticleReader: React.FC<NewsArticleReaderProps> = ({
  article,
  onBack,
  onSelectArticle,
  isDark,
}) => {
  const { addBookmark, removeBookmark, isBookmarked } = useAuth();
  const { t, language } = useLanguage();
  const bookmarked = isBookmarked(article.url);

  const [detail, setDetail] = useState<NewsArticleDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Translation State for rendering full article in selected language
  const [translatedDetail, setTranslatedDetail] = useState<{
    title: string;
    subtitle: string;
    overview: string;
    sections: { heading: string; content: string }[];
    keyFacts: string[];
  } | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [translatedLang, setTranslatedLang] = useState<string>("en");

  // AI summary modal state for extra user inquiry
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState<boolean>(false);

  const [copied, setCopied] = useState<boolean>(false);
  const { registerBackHandler } = useNavigation();

  // Close modals first when Back is pressed
  useEffect(() => {
    if (showAiModal || showFollowUpModal) {
      const unregister = registerBackHandler(75, () => {
        if (showFollowUpModal) {
          setShowFollowUpModal(false);
          return true;
        }
        if (showAiModal) {
          setShowAiModal(false);
          return true;
        }
        return false;
      }, "news_article_reader_modals");
      return () => unregister();
    }
  }, [showAiModal, showFollowUpModal, registerBackHandler]);

  useEffect(() => {
    let isMounted = true;
    async function loadArticle() {
      setIsLoadingDetail(true);
      setLoadError(null);
      try {
        const res = await fetchNewsArticleDetail({
          url: article.url,
          title: article.title,
          source: article.source,
          description: article.description,
          category: article.category,
        });

        if (isMounted) {
          if (res) {
            setDetail(res);
          } else {
            // Defensive structured fallback
            setDetail({
              id: article.id,
              title: article.title,
              subtitle: "Report dispatched by official news wire",
              overview: article.description || "Full report published by source.",
              description: article.description,
              url: article.url,
              source: article.source,
              publishedAt: article.publishedAt,
              updatedAt: new Date().toISOString(),
              category: article.category,
              thumbnail: article.thumbnail,
              author: article.author,
              fullTextAvailable: false,
              isSummary: true,
              sections: [
                {
                  heading: "Report Overview",
                  content: article.description || "Details are provided directly by original reporting channels.",
                },
                {
                  heading: "Original Publisher Documentation",
                  content: `This story is reported by ${article.source}. Complete unedited coverage, quotes, and media can be accessed via the publisher link below.`,
                },
              ],
              keyFacts: [
                `Published by ${article.source}`,
                `Category: ${article.category.toUpperCase()}`,
                `Published on: ${formatSafeDateTime(article.publishedAt)}`,
              ],
            });
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Failed to load article detail:", err);
          setLoadError("Could not retrieve deep article research. Sourced dispatch is displayed below.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingDetail(false);
        }
      }
    }

    loadArticle();
    return () => {
      isMounted = false;
    };
  }, [article.url]);

  // Automatic neural translation effect when language changes or detail loads
  useEffect(() => {
    let isMounted = true;
    if (!detail) return;

    if (language === "en") {
      setShowOriginal(false);
      return;
    }

    // Already translated for this language
    if (translatedLang === language && translatedDetail) {
      return;
    }

    async function triggerTranslation() {
      setIsTranslating(true);
      try {
        const trans = await translateNewsArticleDetail({
          title: detail!.title,
          subtitle: detail!.subtitle,
          overview: detail!.overview,
          sections: detail!.sections,
          keyFacts: detail!.keyFacts,
          targetLang: language,
          url: detail!.url,
        });

        if (isMounted && trans) {
          setTranslatedDetail(trans);
          setTranslatedLang(language);
          setShowOriginal(false);
        }
      } catch (err) {
        console.error("Reader translation failed:", err);
      } finally {
        if (isMounted) setIsTranslating(false);
      }
    }

    triggerTranslation();
    return () => {
      isMounted = false;
    };
  }, [detail, language]);


  const handleGenerateSummary = async () => {
    setShowAiModal(true);
    if (aiSummary) return;
    setIsAiLoading(true);

    const bodyContent =
      detail?.sections?.map((s) => `${s.heading}:\n${s.content}`).join("\n\n") ||
      detail?.overview ||
      article.description;

    const prompt = `Provide a concise executive takeaway and tactical analysis of this news report: "${article.title}".\n\nContent:\n${bodyContent}`;
    const res = await askGemini(prompt, undefined, "You are InfoAtlas AI, an expert journalistic analyst.");
    setAiSummary(res);
    setIsAiLoading(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: article.title,
          text: article.description,
          url: article.url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(article.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const activeAuthor = detail?.author || article.author;
  const activeThumbnail = detail?.thumbnail || article.thumbnail;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
            isDark
              ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
              : "bg-white border-[#E0E9FA] text-[#102B59] hover:bg-[#F5F8FF] shadow-sm"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("back_to_feed", "Back to Feed")}</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <LanguageSelector isDark={isDark} variant="compact" />

          <button
            type="button"
            onClick={() => setShowFollowUpModal(true)}
            className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#386BFF] to-[#7252FF] hover:from-[#2e59d9] hover:to-[#5e3ed9] text-white shadow-md shadow-[#386BFF]/20 transition-all cursor-pointer active:scale-95"
            title="Ask AI follow-up questions about this news report"
          >
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>{t("ask_follow_up", "Ask Follow-Up")}</span>
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
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
              bookmarked
                ? "bg-[#386BFF] border-[#386BFF] text-white shadow-md"
                : isDark
                ? "bg-slate-900 border-slate-800 text-slate-300"
                : "bg-white border-[#E0E9FA] text-[#102B59] shadow-sm"
            }`}
          >
            {bookmarked ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            <span>{bookmarked ? t("bookmarked", "Bookmarked") : t("save_bookmark", "Save Bookmark")}</span>
          </button>

          <button
            onClick={handleShare}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
              copied
                ? "bg-emerald-600 border-emerald-600 text-white"
                : isDark
                ? "bg-slate-900 border-slate-800 text-slate-300"
                : "bg-white border-[#E0E9FA] text-[#102B59] shadow-sm"
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>{copied ? t("link_copied", "Link Copied!") : t("share", "Share")}</span>
          </button>
        </div>
      </div>

      {/* Main Editorial Article View */}
      {(() => {
        const isUsingTranslation = language !== "en" && !showOriginal && !!translatedDetail;
        const displayTitle = isUsingTranslation ? translatedDetail!.title : (detail?.title || article.title);
        const displaySubtitle = isUsingTranslation ? translatedDetail!.subtitle : detail?.subtitle;
        const displayOverview = isUsingTranslation ? translatedDetail!.overview : detail?.overview;
        const displaySections = isUsingTranslation ? translatedDetail!.sections : (detail?.sections || []);
        const displayKeyFacts = isUsingTranslation ? translatedDetail!.keyFacts : (detail?.keyFacts || []);
        const currentLangItem = SUPPORTED_LANGUAGES.find((l) => l.code === language) || {
          name: language,
          nativeName: language,
        };

        return (
          <article
            className={`p-6 sm:p-10 rounded-3xl border shadow-sm ${
              isDark ? "bg-slate-900/60 border-slate-800 text-slate-100" : "bg-white border-[#E0E9FA] text-[#102B59]"
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
                          ? "पूरे समाचार का हिन्दी में अनुवाद किया जा रहा है..."
                          : `Translating whole article into ${currentLangItem.nativeName}...`
                        : showOriginal
                        ? language === "hi"
                          ? "मूल अंग्रेज़ी संस्करण प्रदर्शित है"
                          : "Viewing Original English Version"
                        : language === "hi"
                        ? "यह संपूर्ण समाचार हिन्दी में अनुवादित है"
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
                          ? "शीर्षक, पृष्ठभूमि, विश्लेषण और मुख्य बिंदुओं का अनुवाद हो रहा है..."
                          : "Translating headline, overview, bullet facts, and detailed sections..."
                        : showOriginal
                        ? language === "hi"
                          ? "अनुवादित संस्करण देखने के लिए दाएँ बटन पर क्लिक करें।"
                          : "Click the toggle to view the translated version."
                        : language === "hi"
                        ? "शीर्षक, सारांश, मुख्य बिंदु और सभी पैराग्राफ आपकी चुनी हुई भाषा में हैं।"
                        : "Headlines, executive overview, key facts, and all detailed sections are rendered in your selected language."}
                    </p>
                  </div>
                </div>

                {!isTranslating && translatedDetail && (
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
                      : "View Original (English)"}
                  </button>
                )}
              </div>
            )}

            {/* Category & Verified Publisher Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#386BFF]/10 text-[#386BFF] text-xs font-bold border border-[#386BFF]/20 uppercase tracking-wider">
                  {article.category}
                </span>
                <span className="text-xs text-[#60769A]">
                  · Dispatched by <strong className="text-[#102B59] dark:text-white">{article.source}</strong>
                </span>
              </div>

              <div>
                {detail?.fullTextAvailable ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Full Publisher Syndication
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    Researched Editorial Overview
                  </span>
                )}
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-snug">
              {displayTitle}
            </h1>

            {/* Subtitle (distinct secondary angle) */}
            {displaySubtitle && (
              <p className="text-base sm:text-lg font-medium text-[#60769A] dark:text-slate-300 mb-6 leading-relaxed">
                {displaySubtitle}
              </p>
            )}

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#60769A] mb-8 pb-6 border-b border-[#E0E9FA] dark:border-slate-800">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Published: {formatSafeDateTime(article.publishedAt)}
              </span>
              {detail?.updatedAt && (
                <span className="flex items-center gap-1">
                  · Verified: {formatSafeTime(detail.updatedAt)}
                </span>
              )}
              {activeAuthor && (
                <span className="font-semibold text-[#102B59] dark:text-slate-300">
                  · By {activeAuthor}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                {article.source} Verified Wire
              </span>
            </div>

            {/* Hero Image */}
            {activeThumbnail ? (
              <div className="mb-8 rounded-2xl overflow-hidden border border-[#E0E9FA] dark:border-slate-800 relative bg-slate-950">
                <img
                  src={activeThumbnail}
                  alt={article.title}
                  referrerPolicy="no-referrer"
                  className="w-full object-cover max-h-[460px]"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <div className="p-3 bg-slate-900/90 text-[11px] text-slate-300 flex items-center justify-between border-t border-slate-800">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <span>Verified Publisher Photo: {article.source}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Official Media</span>
                </div>
              </div>
            ) : (
              <div
                className={`mb-8 p-6 rounded-2xl border flex items-center gap-4 ${
                  isDark ? "bg-slate-950/60 border-slate-800 text-slate-300" : "bg-[#F5F8FF] border-[#E0E9FA] text-[#102B59]"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#386BFF]/10 text-[#386BFF] flex items-center justify-center shrink-0">
                  <Newspaper className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold">Official Publisher Wire Report</p>
                  <p className="text-[11px] text-[#60769A]">
                    Dispatched by {article.source}. Verified reporting for journalistic fidelity.
                  </p>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoadingDetail ? (
              <InfoAtlasLoader
                size="md"
                message="Researching verified background & editorial context..."
                isDark={isDark}
                className="py-12"
              />
            ) : (
              <div className="space-y-8">
                {/* Executive Overview Box */}
                {displayOverview && (
                  <div
                    className={`p-6 rounded-2xl border ${
                      isDark
                        ? "bg-slate-950/40 border-slate-800 text-slate-200"
                        : "bg-[#F8FAFF] border-[#E0E9FA] text-[#102B59]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2 text-[#386BFF]">
                      <FileText className="w-4 h-4" />
                      <h3 className="text-xs font-bold uppercase tracking-wider">
                        {language === "hi" ? "कार्यकारी सारांश (Story Overview)" : "Executive Story Overview"}
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base leading-relaxed font-medium">
                      {displayOverview}
                    </p>
                  </div>
                )}

                {/* Key Verified Facts Section */}
                {displayKeyFacts && displayKeyFacts.length > 0 && (
                  <div
                    className={`p-6 sm:p-7 rounded-2xl border ${
                      isDark
                        ? "bg-slate-950/60 border-slate-800"
                        : "bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border-[#E0E9FA]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E0E9FA] dark:border-slate-800">
                      <div className="flex items-center gap-2 text-[#386BFF]">
                        <ListChecks className="w-5 h-5" />
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#102B59] dark:text-white">
                          {language === "hi" ? "प्रमुख सत्यापित तथ्य" : "Key Verified Facts"}
                        </h3>
                      </div>
                      <span className="text-[11px] font-semibold text-[#60769A]">
                        {language === "hi" ? "महत्वपूर्ण बिंदु" : "Distinct Points"}
                      </span>
                    </div>

                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {displayKeyFacts.map((fact, idx) => (
                        <li
                          key={idx}
                          className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed ${
                            isDark
                              ? "bg-slate-900/60 border-slate-800/80 text-slate-200"
                              : "bg-white border-[#E0E9FA] text-[#102B59] shadow-2xs"
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-[#386BFF] mt-1.5 shrink-0" />
                          <span className="font-medium">{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Inline Follow-Up Q&A Action Card */}
                <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isDark ? "bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border-blue-500/30" : "bg-gradient-to-r from-blue-50 via-indigo-50/60 to-white border-blue-200"
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#386BFF] to-[#7252FF] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <Sparkles className="w-5 h-5 text-cyan-200" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold">
                        {language === "hi" ? "इस समाचार के बारे में प्रश्न पूछें" : "Have follow-up questions about this topic?"}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {language === "hi"
                          ? "इन्फोएटलस एआई से इस रिपोर्ट के कारण, प्रभाव या किसी भी बिंदु पर गहराई से प्रश्न पूछें।"
                          : "Ask InfoAtlas AI follow-up questions for deeper background, consequences, or simplified explanations."}
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

                {/* Detailed Body Sections with Logical Headings */}
                {displaySections && displaySections.length > 0 ? (
                  <div className="space-y-6 pt-2">
                    {displaySections.map((sec, idx) => (
                      <section key={idx} className="space-y-3">
                        <h2
                          className={`text-lg sm:text-xl font-bold tracking-tight pb-2 border-b border-[#E0E9FA] dark:border-slate-800 ${
                            isDark ? "text-white" : "text-[#102B59]"
                          }`}
                        >
                          {sec.heading}
                        </h2>
                        <div className="text-sm sm:text-base leading-relaxed text-[#60769A] dark:text-slate-300 whitespace-pre-line space-y-3">
                          {sec.content.split("\n\n").map((para, pIdx) => (
                            <p key={pIdx} className="leading-relaxed">
                              {para}
                            </p>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 text-sm sm:text-base leading-relaxed text-[#60769A] dark:text-slate-300">
                    <p>{article.description}</p>
                  </div>
                )}

                {/* Supporting Grounded Source Citations */}
                {detail?.sourceCitations && detail.sourceCitations.length > 0 && (
                  <div
                    className={`p-5 rounded-2xl border ${
                      isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-[#E0E9FA]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3 text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#102B59] dark:text-white">
                        Research Citations & Grounded Sources
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {detail.sourceCitations.map((c, i) => (
                        <a
                          key={i}
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold bg-white dark:bg-slate-800 border-[#E0E9FA] dark:border-slate-700 text-[#102B59] dark:text-white hover:text-[#386BFF] transition-colors"
                        >
                          <span className="truncate max-w-[200px]">{c.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-[#386BFF] shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Briefing Trigger Card */}
            <div className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-[#386BFF]/10 via-[#7252FF]/10 to-[#386BFF]/10 border border-[#386BFF]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#386BFF] to-[#7252FF] text-white flex items-center justify-center shadow">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102B59] dark:text-white">
                    Need an analytical deep-dive on this story?
                  </h3>
                  <p className="text-xs text-[#60769A]">
                    Generate an instant tactical breakdown powered by Gemini.
                  </p>
                </div>
              </div>
              <button
                onClick={handleGenerateSummary}
                className="bg-[#386BFF] hover:bg-blue-600 text-white font-semibold text-xs px-5 py-3 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
              >
                Generate AI Briefing
              </button>
            </div>

            {/* Prominent Outbound Link to Publisher */}
            <div className="mt-8 pt-6 border-t border-[#E0E9FA] dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-[#60769A]">
                Original reporting hosted and dispatched by <strong>{article.source}</strong>.
              </span>
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto bg-[#102B59] hover:bg-[#1a3d7c] text-white font-semibold text-xs px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Read full original publication at {article.source}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </article>
        );
      })()}

      {/* Related Stories Section */}
      {detail?.relatedStories && detail.relatedStories.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-[#386BFF]" />
            <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-[#102B59]"}`}>
              Related Coverage in {article.category.toUpperCase()}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {detail.relatedStories.map((related) => (
              <div
                key={related.id}
                onClick={() => onSelectArticle && onSelectArticle(related)}
                className={`p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col justify-between ${
                  isDark
                    ? "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-100"
                    : "bg-white border-[#E0E9FA] hover:border-[#386BFF]/40 text-[#102B59] shadow-2xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#60769A] mb-2">
                    <span className="font-bold text-[#386BFF]">{related.source}</span>
                    <span>{formatSafeDateTime(related.publishedAt).split(",")[0]}</span>
                  </div>
                  <h4 className="text-xs font-bold line-clamp-2 mb-2 leading-snug">
                    {related.title}
                  </h4>
                  <p className="text-[11px] text-[#60769A] line-clamp-2 mb-3">
                    {related.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-[#386BFF] pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span>Read report</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI Briefing Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div
            className={`w-full max-w-xl rounded-3xl border p-6 sm:p-8 shadow-2xl relative ${
              isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-[#E0E9FA] text-[#102B59]"
            }`}
          >
            <button
              onClick={() => setShowAiModal(false)}
              className="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#386BFF] to-[#7252FF] text-white flex items-center justify-center shadow">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold">InfoAtlas AI Journalistic Briefing</h3>
                <span className="text-[10px] text-[#386BFF]">Grounded in verified article reporting</span>
              </div>
            </div>

            <h2 className="text-base font-bold mb-4">{article.title}</h2>

            <div className="mb-6 max-h-[380px] overflow-y-auto">
              {isAiLoading ? (
                <div
                  className={`p-8 rounded-2xl border flex items-center justify-center gap-3 text-[#386BFF] ${
                    isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-[#E0E9FA]"
                  }`}
                >
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-semibold">Synthesizing executive briefing & analytical takeaway...</span>
                </div>
              ) : (
                <DecorativeAiResponse
                  content={aiSummary || ""}
                  isDark={isDark}
                  language={language}
                  roleTitle="Journalistic Executive Briefing"
                  showFollowUpChips={false}
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#60769A]">Publisher: {article.source}</span>
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

      {/* Interactive Follow-Up Questions Modal */}
      <ArticleFollowUpModal
        isOpen={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        articleTitle={article.title}
        articleSource={article.source}
        articleContext={
          detail?.sections?.map((s) => `${s.heading}:\n${s.content}`).join("\n\n") ||
          detail?.overview ||
          article.description ||
          ""
        }
        category={article.category}
        isDark={isDark}
      />
    </div>
  );
};
