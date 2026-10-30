import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  RefreshCw,
  Trash2,
  Telescope,
  Cpu,
  Landmark,
  Dna,
  ArrowRight,
} from "lucide-react";
import { askGemini } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { DecorativeAiResponse } from "./DecorativeAiResponse";

interface AiAssistantModalProps {
  onClose: () => void;
  isDark: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ onClose, isDark }) => {
  const { currentLang, t } = useLanguage();

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      role: "assistant",
      content: t(
        "ai_greeting",
        "Hello! I am your InfoAtlas AI knowledge companion. Ask me anything about science, world history, astronomy, cutting-edge technology, or any deep subject!"
      ),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  }, []);

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: t(
          "ai_greeting",
          "Hello! I am your InfoAtlas AI knowledge companion. Ask me anything about science, world history, astronomy, cutting-edge technology, or any deep subject!"
        ),
      },
    ]);
  };

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || isLoading) return;

    const userMsg = promptText.trim();
    setInput("");
    const newMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    const historyContext = newMessages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const systemInstruction = `You are InfoAtlas AI, an expert research, journalism, and educational assistant.
Answer thoroughly, accurately, and clearly entirely in ${currentLang.name} (${currentLang.nativeName}).
Make your answers beautifully structured, engaging, and decorative:
- Use clear markdown headers (e.g. "### 📌 Key Takeaway", "### 🔍 Deep Dive", "### 📊 Key Facts", "### 💡 Why It Matters").
- Use structured bullet points with bold highlights for key concepts.
- Use blockquotes (> Quote or note) for high-impact insights.
- Provide 2-3 suggested follow-up questions at the very end prefixed with "SUGGESTIONS:" as a comma-separated list on a new line.`;

    const promptWithLang = `[Requested Language: ${currentLang.name} (${currentLang.nativeName})]\nQuestion / Topic: ${userMsg}`;

    try {
      const aiRes = await askGemini(promptWithLang, historyContext, systemInstruction);
      setMessages([...newMessages, { role: "assistant", content: aiRes }]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: `Unable to complete request: ${err?.message || "Connection timeout"}. Please try asking again.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendPrompt(input);
  };

  // Curated starter cards for quick discovery
  const starterPrompts =
    currentLang.code === "hi"
      ? [
          {
            title: "जेम्स वेब स्पेस टेलीस्कोप",
            desc: "ब्रह्मांड की सबसे दूरस्थ आकाशगंगाओं और सितारों की खोज",
            prompt: "जेम्स वेब स्पेस टेलीस्कोप की अब तक की सबसे महत्वपूर्ण और आश्चर्यजनक खोजें क्या हैं?",
            icon: <Telescope className="w-4 h-4 text-cyan-400" />,
            border: "hover:border-cyan-500/40",
            bg: "hover:bg-cyan-500/5",
          },
          {
            title: "क्वांटम कंप्यूटिंग",
            desc: "सुपरपोजिशन और क्वांटम स्पीडअप सरल उदाहरण के साथ",
            prompt: "क्वांटम कंप्यूटिंग सरल शब्दों में कैसे काम करती है और यह सामान्य कंप्यूटर से अलग कैसे है?",
            icon: <Cpu className="w-4 h-4 text-violet-400" />,
            border: "hover:border-violet-500/40",
            bg: "hover:bg-violet-500/5",
          },
          {
            title: "औद्योगिक क्रांति का इतिहास",
            desc: "मानव सभ्यता के सबसे बड़े आर्थिक और तकनीकी बदलाव",
            prompt: "ब्रिटेन में औद्योगिक क्रांति के मुख्य कारण और दुनिया पर इसके दूरगामी प्रभाव क्या थे?",
            icon: <Landmark className="w-4 h-4 text-amber-400" />,
            border: "hover:border-amber-500/40",
            bg: "hover:bg-amber-500/5",
          },
          {
            title: "CRISPR जीन एडिटिंग",
            desc: "डीएनए संशोधन और जेनेटिक बीमारियों का आधुनिक इलाज",
            prompt: "CRISPR जीन एडिटिंग तकनीक सरल शब्दों में कैसे काम करती है और इसके क्या उपयोग हैं?",
            icon: <Dna className="w-4 h-4 text-emerald-400" />,
            border: "hover:border-emerald-500/40",
            bg: "hover:bg-emerald-500/5",
          },
        ]
      : [
          {
            title: "James Webb Telescopes",
            desc: "Most groundbreaking deep space and cosmic origins discoveries",
            prompt: "What are the most groundbreaking discoveries made by the James Webb Space Telescope so far?",
            icon: <Telescope className="w-4 h-4 text-cyan-400" />,
            border: "hover:border-cyan-500/40",
            bg: "hover:bg-cyan-500/5",
          },
          {
            title: "Quantum Computing",
            desc: "Qubits, superposition, and quantum supremacy explained simply",
            prompt: "How does quantum computing actually work and why is it faster than classical supercomputers?",
            icon: <Cpu className="w-4 h-4 text-violet-400" />,
            border: "hover:border-violet-500/40",
            bg: "hover:bg-violet-500/5",
          },
          {
            title: "Industrial Revolution",
            desc: "Catalysts, mechanization, and the birth of modern economics",
            prompt: "What triggered the Industrial Revolution in Britain and how did it transform global society?",
            icon: <Landmark className="w-4 h-4 text-amber-400" />,
            border: "hover:border-amber-500/40",
            bg: "hover:bg-amber-500/5",
          },
          {
            title: "CRISPR & Gene Editing",
            desc: "Molecular biology revolution and potential cure for genetic diseases",
            prompt: "Explain how CRISPR gene editing works and what diseases it could cure in our lifetime.",
            icon: <Dna className="w-4 h-4 text-emerald-400" />,
            border: "hover:border-emerald-500/40",
            bg: "hover:bg-emerald-500/5",
          },
        ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-assistant-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-3xl h-[680px] max-h-[92vh] rounded-3xl border flex flex-col shadow-2xl relative overflow-hidden transition-all ${
          isDark
            ? "bg-slate-900 border-slate-800 text-white"
            : "bg-white border-slate-200 text-slate-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 id="ai-assistant-title" className="text-sm sm:text-base font-bold flex items-center gap-2">
                <span>{t("ai_companion_title", "InfoAtlas AI Knowledge Companion")}</span>
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {t("ai_companion_subtitle", "Grounded Gemini Intelligence")}
                </span>
                <span>•</span>
                <span className="uppercase tracking-wider">{currentLang.nativeName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 1 && (
              <button
                type="button"
                onClick={handleClearChat}
                className="p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label={t("close", "Close")}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs mt-1 ${
                    isUser
                      ? "bg-[#386BFF] text-white"
                      : "bg-gradient-to-tr from-violet-600 to-indigo-600 text-white"
                  }`}
                >
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`max-w-[88%] sm:max-w-[82%]`}>
                  {isUser ? (
                    <div className="p-3.5 sm:p-4 rounded-2xl rounded-tr-none bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 text-xs sm:text-sm font-medium leading-relaxed">
                      {m.content}
                    </div>
                  ) : idx === 0 ? (
                    // Initial Welcome Greeting Card
                    <div
                      className={`p-4 sm:p-5 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
                        isDark
                          ? "bg-slate-950/70 border-slate-800 text-slate-200"
                          : "bg-indigo-50/50 border-indigo-100 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2 font-bold text-indigo-500 dark:text-cyan-300">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>InfoAtlas Research Assistant</span>
                      </div>
                      <p className="mb-4">{m.content}</p>

                      {/* Discovery Starter Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                        {starterPrompts.map((card, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => handleSendPrompt(card.prompt)}
                            className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer group active:scale-98 ${card.border} ${card.bg} ${
                              isDark
                                ? "bg-slate-900/90 border-slate-800 text-slate-200"
                                : "bg-white border-slate-200 text-slate-800 shadow-xs"
                            }`}
                          >
                            <div className="p-2 rounded-lg bg-indigo-500/10 shrink-0 mt-0.5">
                              {card.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold flex items-center justify-between">
                                <span className="truncate">{card.title}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                              </h4>
                              <p className="text-[11px] text-slate-400 dark:text-slate-400 line-clamp-1 mt-0.5">
                                {card.desc}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Decorative AI Response Component
                    <DecorativeAiResponse
                      content={m.content}
                      isDark={isDark}
                      language={currentLang.code}
                      onPromptClick={(p) => handleSendPrompt(p)}
                      showFollowUpChips={true}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div
                className={`p-4 rounded-2xl rounded-tl-none border text-xs sm:text-sm flex items-center gap-3 ${
                  isDark
                    ? "bg-slate-950/80 border-slate-800 text-slate-300"
                    : "bg-slate-100/90 border-slate-200 text-slate-700"
                }`}
              >
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>{t("ai_thinking", "Synthesizing deep verified knowledge...")}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-950/40"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              currentLang.code === "hi"
                ? "इन्फोएटलस एआई से कोई भी प्रश्न पूछें..."
                : t("ai_placeholder", "Ask any question about science, history, space, technology...")
            }
            className={`w-full text-xs sm:text-sm px-4 py-3 rounded-xl border transition-all outline-none ${
              isDark
                ? "bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500"
                : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500"
            }`}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white transition-all disabled:opacity-50 shrink-0 cursor-pointer shadow-md shadow-indigo-500/20 active:scale-95"
            aria-label={t("ai_send", "Send")}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
