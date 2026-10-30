import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  Send,
  MessageSquare,
  RefreshCw,
  Copy,
  Check,
  Globe,
  Trash2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { askArticleFollowUp } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { LanguageSelector } from "./LanguageSelector";
import { DecorativeAiResponse } from "./DecorativeAiResponse";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

interface ArticleFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleTitle: string;
  articleSource?: string;
  articleContext: string;
  category?: string;
  isDark: boolean;
}

export const ArticleFollowUpModal: React.FC<ArticleFollowUpModalProps> = ({
  isOpen,
  onClose,
  articleTitle,
  articleSource,
  articleContext,
  category,
  isDark,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate dynamic suggested questions based on language and topic
  useEffect(() => {
    if (language === "hi") {
      setSuggestedQuestions([
        `"${articleTitle}" के मुख्य निष्कर्ष और बिंदु क्या हैं?`,
        `इसकी पृष्ठभूमि और मुख्य कारण क्या रहे हैं?`,
        `भविष्य में इस घटना या विषय के क्या परिणाम हो सकते हैं?`,
        `इसे सरल शब्दों में एक उदाहरण के साथ समझाइए।`,
        `इस विषय पर विशेषज्ञों और विश्लेषकों का क्या दृष्टिकोण है?`,
      ]);
    } else {
      setSuggestedQuestions([
        `What are the critical takeaways from this article?`,
        `What led up to this? Explain the background context.`,
        `What are the likely future consequences or next steps?`,
        `Explain this in simple terms with an analogy.`,
        `What do different viewpoints or experts say about this?`,
      ]);
    }
  }, [language, articleTitle]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when opened and listen for Escape key
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend: string) => {
    const cleanText = textToSend.trim();
    if (!cleanText || isLoading) return;

    const userMsg: ChatMessage = {
      id: "u_" + Date.now(),
      role: "user",
      text: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputVal("");
    setIsLoading(true);

    try {
      const historyPayload = newHistory.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await askArticleFollowUp({
        topicTitle: articleTitle,
        articleContext,
        question: cleanText,
        conversationHistory: historyPayload,
        language,
      });

      const assistantMsg: ChatMessage = {
        id: "a_" + Date.now(),
        role: "assistant",
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If AI returned dynamic next suggestions, integrate them
      if (res.suggestedFollowUps && res.suggestedFollowUps.length > 0) {
        setSuggestedQuestions(res.suggestedFollowUps.slice(0, 4));
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: "err_" + Date.now(),
        role: "assistant",
        text: `Sorry, could not generate an answer right now: ${err?.message || "Connection timeout"}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputVal);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  // Simple Markdown renderer for bold, lists, and paragraphs
  const renderFormattedText = (raw: string) => {
    const paragraphs = raw.split("\n\n");
    return paragraphs.map((para, pIdx) => {
      const lines = para.split("\n");
      const isList = lines.every((l) => /^\s*[-*•\d.]+\s/.test(l));

      if (isList) {
        return (
          <ul key={pIdx} className="space-y-1.5 my-2 pl-4 list-disc marker:text-[#386BFF]">
            {lines.map((line, lIdx) => {
              const cleanLine = line.replace(/^\s*[-*•\d.]+\s*/, "");
              return (
                <li key={lIdx} className="text-xs sm:text-sm leading-relaxed">
                  {formatInlineText(cleanLine)}
                </li>
              );
            })}
          </ul>
        );
      }

      return (
        <p key={pIdx} className="text-xs sm:text-sm leading-relaxed mb-2 last:mb-0">
          {lines.map((l, idx) => (
            <React.Fragment key={idx}>
              {formatInlineText(l)}
              {idx < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      );
    });
  };

  const formatInlineText = (text: string) => {
    // Bold replacement **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-indigo-400 dark:text-cyan-300">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-3xl h-[88vh] max-h-[850px] rounded-3xl shadow-2xl border flex flex-col overflow-hidden transform transition-all ${
          isDark
            ? "bg-slate-900 border-slate-800 text-slate-100"
            : "bg-white border-[#E0E9FA] text-[#102B59]"
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#386BFF] to-[#7252FF] text-white flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-5 h-5 text-cyan-200" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#386BFF]/10 text-[#386BFF] border border-[#386BFF]/20">
                  {t("follow_up_badge", "Grounded AI Follow-Up")}
                </span>
                {articleSource && (
                  <span className="text-[10px] text-slate-400 font-medium truncate">
                    via {articleSource}
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold truncate mt-0.5" title={articleTitle}>
                {articleTitle}
              </h2>
            </div>
          </div>

          {/* Language Selector + Close Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Full Language Selector for Hindi and others */}
            <LanguageSelector isDark={isDark} variant="compact" />

            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearChat}
                className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-500/10 transition-colors cursor-pointer"
                title={t("clear_chat", "Clear chat history")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat / Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {/* Welcome Intro Banner */}
          {messages.length === 0 && (
            <div className="text-center py-6 sm:py-8 max-w-lg mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#386BFF]/10 text-[#386BFF] border border-[#386BFF]/20 flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold">
                  {language === "hi"
                    ? `इस विषय के बारे में प्रश्न पूछें`
                    : `Ask Follow-Up Questions`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t(
                    "ask_follow_up_subtitle",
                    "Ask InfoAtlas AI any question about this article for deeper context, background, or explanation."
                  )}
                </p>
              </div>

              {/* Language Notice */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
                <Globe className="w-3.5 h-3.5 text-[#386BFF]" />
                <span>
                  {language === "hi"
                    ? "उत्तर हिन्दी (Hindi) में प्राप्त होंगे। भाषा बदलने के लिए ऊपर EN या हिन्दी चुनें।"
                    : "Answers will be formatted in English. Click हिन्दी above to ask and receive answers in Hindi."}
                </span>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#386BFF] to-[#7252FF] text-white flex items-center justify-center shrink-0 shadow mt-1">
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                  </div>
                )}

                {isUser ? (
                  <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl rounded-tr-none p-3.5 sm:p-4 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
                    <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-80">
                      <span className="font-semibold uppercase tracking-wider">You</span>
                      <span>{m.timestamp}</span>
                    </div>
                    <div>{m.text}</div>
                  </div>
                ) : (
                  <div className="max-w-[90%] sm:max-w-[85%] flex-1">
                    <DecorativeAiResponse
                      content={m.text}
                      isDark={isDark}
                      language={language}
                      onPromptClick={(prompt) => handleSendMessage(prompt)}
                      roleTitle="Article Grounded Intel"
                      showFollowUpChips={true}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#386BFF] to-[#7252FF] text-white flex items-center justify-center shrink-0 shadow animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div
                className={`p-3.5 rounded-2xl rounded-tl-none border text-xs sm:text-sm flex items-center gap-2.5 ${
                  isDark
                    ? "bg-slate-800/90 border-slate-700 text-slate-300"
                    : "bg-[#F5F8FF] border-[#E0E9FA] text-slate-700"
                }`}
              >
                <RefreshCw className="w-4 h-4 animate-spin text-[#386BFF]" />
                <span>
                  {language === "hi"
                    ? "लेख का विश्लेषण और उत्तर तैयार किया जा रहा है..."
                    : "Analyzing article context and preparing answer..."}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions Section */}
        {suggestedQuestions.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/30">
            <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <Sparkles className="w-3 h-3 text-[#386BFF]" />
              <span>{t("suggested_questions", "Suggested Follow-Up Questions")}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSendMessage(q)}
                  className={`text-left text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer truncate max-w-full disabled:opacity-50 ${
                    isDark
                      ? "bg-slate-900 border-slate-800 hover:border-[#386BFF]/60 hover:bg-slate-850 text-slate-300"
                      : "bg-white border-slate-200 hover:border-[#386BFF]/50 hover:bg-[#F5F8FF] text-[#102B59] shadow-xs"
                  }`}
                >
                  <span className="text-[#386BFF] mr-1.5">✦</span>
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={
                language === "hi"
                  ? "इस विषय पर अपना प्रश्न यहाँ लिखें..."
                  : "Type your follow-up question about this topic..."
              }
              disabled={isLoading}
              className={`flex-1 text-xs sm:text-sm px-4 py-3 rounded-2xl border outline-none transition-all ${
                isDark
                  ? "bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-[#386BFF] focus:ring-2 focus:ring-[#386BFF]/20"
                  : "bg-[#F5F8FF] border-[#E0E9FA] text-[#102B59] placeholder-[#60769A] focus:border-[#386BFF] focus:bg-white focus:ring-2 focus:ring-[#386BFF]/20"
              }`}
            />

            <button
              type="submit"
              disabled={!inputVal.trim() || isLoading}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-[#386BFF] to-[#7252FF] hover:from-[#2e59d9] hover:to-[#5e3ed9] text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-[#386BFF]/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <span>{t("ask_btn", "Ask")}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Grounded in article facts & current world knowledge</span>
            </span>
            <span>Powered by Gemini 3.8 Flash</span>
          </div>
        </div>
      </div>
    </div>
  );
};
