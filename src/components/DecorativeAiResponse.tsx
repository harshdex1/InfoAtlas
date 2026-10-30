import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Lightbulb,
  Zap,
  BarChart2,
  HelpCircle,
  ChevronRight,
  BookOpen,
  Quote,
  Target,
  FileText,
  Clock,
  Compass,
} from "lucide-react";

interface DecorativeAiResponseProps {
  content: string;
  isDark: boolean;
  language?: string;
  onPromptClick?: (prompt: string) => void;
  showFollowUpChips?: boolean;
  customSuggestedQuestions?: string[];
  roleTitle?: string;
}

interface ParsedBlock {
  type: "header" | "quote" | "list" | "code" | "paragraph";
  level?: number;
  headerText?: string;
  items?: { text: string; isNumbered: boolean; numberIndex?: number }[];
  text?: string;
  codeLang?: string;
}

export const DecorativeAiResponse: React.FC<DecorativeAiResponseProps> = ({
  content,
  isDark,
  language = "en",
  onPromptClick,
  showFollowUpChips = true,
  customSuggestedQuestions,
  roleTitle = "InfoAtlas Grounded Intel",
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop speech when unmounting or content changes
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [content]);

  // Handle Text-to-Speech
  const handleToggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Strip markdown formatting for natural reading
    const cleanSpeechText = content
      .replace(/SUGGESTIONS:[\s\S]*$/i, "")
      .replace(/#{1,6}\s+/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/>\s*/g, "")
      .replace(/[-*•]\s+/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    speechUtteranceRef.current = utterance;

    // Detect if content is Hindi or language is 'hi'
    const isHindiText = language === "hi" || /[\u0900-\u097F]/.test(cleanSpeechText);
    utterance.lang = isHindiText ? "hi-IN" : "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try finding appropriate voice
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      if (isHindiText) {
        const hiVoice = voices.find((v) => v.lang.startsWith("hi") || v.lang.includes("Hindi"));
        if (hiVoice) utterance.voice = hiVoice;
      } else {
        const enVoice = voices.find(
          (v) => (v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural")))
        );
        if (enVoice) utterance.voice = enVoice;
      }
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Copy full content
  const handleCopy = () => {
    const cleanText = content.replace(/SUGGESTIONS:[\s\S]*$/i, "").trim();
    navigator.clipboard.writeText(cleanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Estimate read time
  const readTimeMinutes = useMemo(() => {
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 180));
  }, [content]);

  // Extract suggestions and parse blocks
  const { blocks, suggestions } = useMemo(() => {
    let raw = content.trim();
    let extractedSuggestions: string[] = [];

    // Extract SUGGESTIONS: ... if present
    const sugIdx = raw.search(/SUGGESTIONS:\s*/i);
    if (sugIdx !== -1) {
      const sugPart = raw.substring(sugIdx).replace(/SUGGESTIONS:\s*/i, "").trim();
      raw = raw.substring(0, sugIdx).trim();

      extractedSuggestions = sugPart
        .split(/[,;\n]/)
        .map((s) => s.replace(/^[-*•\d.]+\s*/, "").trim())
        .filter((s) => s.length > 5);
    }

    // Combine with custom suggestions if provided
    if (customSuggestedQuestions && customSuggestedQuestions.length > 0) {
      const merged = [...extractedSuggestions, ...customSuggestedQuestions];
      extractedSuggestions = Array.from(new Set(merged)).slice(0, 4);
    }

    // Split raw text into chunks
    const rawLines = raw.split("\n");
    const parsed: ParsedBlock[] = [];
    let currentList: { text: string; isNumbered: boolean; numberIndex?: number }[] | null = null;
    let inCodeBlock = false;
    let codeBuffer: string[] = [];
    let codeLang = "";

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const trimmed = line.trim();

      // Code block handling
      if (trimmed.startsWith("```")) {
        if (inCodeBlock) {
          parsed.push({
            type: "code",
            text: codeBuffer.join("\n"),
            codeLang,
          });
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          // Flush list if any
          if (currentList) {
            parsed.push({ type: "list", items: currentList });
            currentList = null;
          }
          inCodeBlock = true;
          codeLang = trimmed.replace("```", "").trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Empty line closes current list
      if (!trimmed) {
        if (currentList) {
          parsed.push({ type: "list", items: currentList });
          currentList = null;
        }
        continue;
      }

      // Headers: #, ##, ###, #### or line that is strictly **Heading Title**
      const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      const boldHeaderMatch = trimmed.match(/^\*\*([^*]+)\*\*:?$/);

      if (headerMatch || boldHeaderMatch) {
        if (currentList) {
          parsed.push({ type: "list", items: currentList });
          currentList = null;
        }
        const level = headerMatch ? headerMatch[1].length : 3;
        const text = headerMatch ? headerMatch[2] : boldHeaderMatch![1];
        parsed.push({
          type: "header",
          level,
          headerText: text.trim(),
        });
        continue;
      }

      // Blockquotes: > quote
      if (trimmed.startsWith(">")) {
        if (currentList) {
          parsed.push({ type: "list", items: currentList });
          currentList = null;
        }
        parsed.push({
          type: "quote",
          text: trimmed.replace(/^>\s*/, "").trim(),
        });
        continue;
      }

      // Lists: numbered (1. 2.) or bullets (- * •)
      const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);

      if (numberedMatch) {
        if (!currentList) currentList = [];
        currentList.push({
          text: numberedMatch[2].trim(),
          isNumbered: true,
          numberIndex: parseInt(numberedMatch[1], 10),
        });
        continue;
      }

      if (bulletMatch) {
        if (!currentList) currentList = [];
        currentList.push({
          text: bulletMatch[1].trim(),
          isNumbered: false,
        });
        continue;
      }

      // Normal paragraph
      if (currentList) {
        parsed.push({ type: "list", items: currentList });
        currentList = null;
      }

      parsed.push({
        type: "paragraph",
        text: trimmed,
      });
    }

    if (currentList) {
      parsed.push({ type: "list", items: currentList });
    }

    if (inCodeBlock && codeBuffer.length > 0) {
      parsed.push({
        type: "code",
        text: codeBuffer.join("\n"),
        codeLang,
      });
    }

    return { blocks: parsed, suggestions: extractedSuggestions.slice(0, 4) };
  }, [content, customSuggestedQuestions]);

  // Helper for inline markdown bold & code formatting
  const renderInlineFormatted = (text: string) => {
    // Regex splits by bold (**...**) and inline code (`...`)
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const inner = part.slice(2, -2);
        return (
          <strong
            key={idx}
            className={`font-semibold tracking-tight ${
              isDark ? "text-cyan-300 drop-shadow-xs" : "text-indigo-600 font-bold"
            }`}
          >
            {inner}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        const inner = part.slice(1, -1);
        return (
          <code
            key={idx}
            className={`px-1.5 py-0.5 rounded-md font-mono text-[11px] border ${
              isDark
                ? "bg-slate-900 border-slate-700 text-indigo-300"
                : "bg-indigo-50/80 border-indigo-200/80 text-indigo-700"
            }`}
          >
            {inner}
          </code>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  // Helper to pick a contextual icon and color badge for section headers
  const getHeaderStyle = (title: string) => {
    const lower = title.toLowerCase();

    if (
      lower.includes("takeaway") ||
      lower.includes("summary") ||
      lower.includes("key") ||
      lower.includes("मुख्य") ||
      lower.includes("सारांश") ||
      lower.includes("निष्कर्ष")
    ) {
      return {
        icon: <Target className="w-3.5 h-3.5 text-emerald-400" />,
        badgeClass: isDark ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60" : "bg-emerald-50 text-emerald-700 border-emerald-200",
        pill: "Key Takeaway",
      };
    }
    if (
      lower.includes("fact") ||
      lower.includes("data") ||
      lower.includes("stat") ||
      lower.includes("संख्या") ||
      lower.includes("आंकड़े") ||
      lower.includes("तथ्य")
    ) {
      return {
        icon: <BarChart2 className="w-3.5 h-3.5 text-sky-400" />,
        badgeClass: isDark ? "bg-sky-950/60 text-sky-300 border-sky-800/60" : "bg-sky-50 text-sky-700 border-sky-200",
        pill: "Data & Evidence",
      };
    }
    if (
      lower.includes("analysis") ||
      lower.includes("why") ||
      lower.includes("deep") ||
      lower.includes("reason") ||
      lower.includes("विश्लेषण") ||
      lower.includes("कारण")
    ) {
      return {
        icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
        badgeClass: isDark ? "bg-amber-950/60 text-amber-300 border-amber-800/60" : "bg-amber-50 text-amber-700 border-amber-200",
        pill: "Strategic Analysis",
      };
    }
    if (
      lower.includes("future") ||
      lower.includes("impact") ||
      lower.includes("outlook") ||
      lower.includes("परिणाम") ||
      lower.includes("भविष्य")
    ) {
      return {
        icon: <Compass className="w-3.5 h-3.5 text-purple-400" />,
        badgeClass: isDark ? "bg-purple-950/60 text-purple-300 border-purple-800/60" : "bg-purple-50 text-purple-700 border-purple-200",
        pill: "Impact Outlook",
      };
    }

    return {
      icon: <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />,
      badgeClass: isDark ? "bg-indigo-950/60 text-indigo-300 border-indigo-800/60" : "bg-indigo-50 text-indigo-700 border-indigo-200",
      pill: "Knowledge Core",
    };
  };

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${
        isDark
          ? "bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border-indigo-500/30 text-slate-100 shadow-xl shadow-indigo-950/20"
          : "bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 border-indigo-100 text-slate-800 shadow-lg shadow-indigo-500/5"
      }`}
    >
      {/* Top Decorative Header Strip */}
      <div
        className={`px-3.5 py-2 sm:px-4.5 sm:py-2.5 border-b flex items-center justify-between gap-2 flex-wrap ${
          isDark
            ? "bg-slate-950/70 border-slate-800/80 text-slate-300"
            : "bg-slate-50/90 border-slate-200/80 text-slate-600"
        }`}
      >
        {/* Grounded Intelligence Micro-badge */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-3 h-3 text-cyan-200" />
          </div>
          <span className="text-[11px] font-bold tracking-wide uppercase bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
            {roleTitle}
          </span>
          <span className="text-[10px] opacity-40">•</span>
          <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
            <Clock className="w-2.5 h-2.5" />
            <span>~{readTimeMinutes} min read</span>
          </span>
        </div>

        {/* Action Controls: Audio Playback & Copy */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Text-to-Speech Button */}
          {"speechSynthesis" in (typeof window !== "undefined" ? window : {}) && (
            <button
              type="button"
              onClick={handleToggleSpeech}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
                isSpeaking
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/30 animate-pulse"
                  : isDark
                  ? "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80"
                  : "bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border-slate-200"
              }`}
              title={isSpeaking ? "Pause Audio" : "Listen to this answer"}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3 h-3" />
                  <span>Listening</span>
                  <span className="flex items-end gap-0.5 h-3 ml-0.5">
                    <span className="w-0.5 h-2 bg-white animate-pulse" />
                    <span className="w-0.5 h-3 bg-white animate-pulse delay-75" />
                    <span className="w-0.5 h-1.5 bg-white animate-pulse delay-150" />
                  </span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3 text-indigo-400" />
                  <span>Listen</span>
                </>
              )}
            </button>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer border ${
              copied
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : isDark
                ? "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-700/80"
                : "bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border-slate-200"
            }`}
            title="Copy answer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Formatted Content Area */}
      <div className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm leading-relaxed max-w-full overflow-hidden">
        {blocks.map((block, idx) => {
          // 1. Headers
          if (block.type === "header") {
            const style = getHeaderStyle(block.headerText || "");
            return (
              <div key={idx} className="pt-2 pb-1 border-b border-indigo-500/10 dark:border-indigo-400/10 min-w-0 max-w-full">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${style.badgeClass}`}
                  >
                    {style.icon}
                    <span>{style.pill}</span>
                  </span>
                </div>
                <h3
                  className={`text-sm sm:text-base font-bold tracking-tight break-words ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {renderInlineFormatted(block.headerText || "")}
                </h3>
              </div>
            );
          }

          // 2. Blockquote / Key Callout
          if (block.type === "quote") {
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border-l-4 border-l-indigo-500 border border-indigo-500/20 flex items-start gap-3 my-2.5 min-w-0 max-w-full ${
                  isDark
                    ? "bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-transparent text-indigo-200"
                    : "bg-gradient-to-r from-indigo-50/80 via-blue-50/40 to-transparent text-indigo-950"
                }`}
              >
                <Quote className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 opacity-80" />
                <div className="italic font-medium leading-relaxed break-words min-w-0 flex-1">
                  {renderInlineFormatted(block.text || "")}
                </div>
              </div>
            );
          }

          // 3. Lists (Bulleted or Numbered)
          if (block.type === "list" && block.items) {
            return (
              <div key={idx} className="space-y-2 my-2 min-w-0 max-w-full">
                {block.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className={`p-2.5 sm:p-3 rounded-xl border transition-all flex items-start gap-3 min-w-0 max-w-full ${
                      isDark
                        ? "bg-slate-950/40 border-slate-800/80 hover:border-indigo-500/40 text-slate-200"
                        : "bg-white/80 border-slate-100 hover:border-indigo-200 text-slate-800 shadow-xs"
                    }`}
                  >
                    {item.isNumbered ? (
                      <span className="w-5 h-5 rounded-lg bg-indigo-500/15 text-indigo-500 dark:text-cyan-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {item.numberIndex || itemIdx + 1}
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 ring-4 ring-indigo-500/10 shrink-0 mt-1.5 ml-1 mr-0.5" />
                    )}
                    <div className="flex-1 text-xs sm:text-sm leading-relaxed break-words min-w-0">
                      {renderInlineFormatted(item.text)}
                    </div>
                  </div>
                ))}
              </div>
            );
          }

          // 4. Code Blocks
          if (block.type === "code") {
            return (
              <div
                key={idx}
                className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-200 text-xs font-mono max-w-full"
              >
                {block.codeLang && (
                  <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                    <span>{block.codeLang}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(block.text || "")}
                      className="hover:text-cyan-400 transition-colors cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                )}
                <pre className="p-3.5 overflow-x-auto whitespace-pre-wrap break-all max-w-full">
                  <code>{block.text}</code>
                </pre>
              </div>
            );
          }

          // 5. Normal Paragraph
          return (
            <p key={idx} className="leading-relaxed text-xs sm:text-sm break-words min-w-0">
              {renderInlineFormatted(block.text || "")}
            </p>
          );
        })}
      </div>

      {/* Suggested Follow-Up Action Chips */}
      {showFollowUpChips && suggestions && suggestions.length > 0 && (
        <div
          className={`p-3 sm:p-4 border-t ${
            isDark ? "bg-slate-950/60 border-slate-800/80" : "bg-indigo-50/30 border-slate-100"
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-500 dark:text-cyan-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Suggested follow-up explorations:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((sug, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={() => onPromptClick && onPromptClick(sug)}
                className={`group px-3 py-1.5 rounded-xl text-xs font-medium border text-left transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  isDark
                    ? "bg-slate-900 hover:bg-indigo-950/60 border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white"
                    : "bg-white hover:bg-indigo-50/80 border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-900 shadow-xs"
                }`}
              >
                <span className="truncate max-w-[260px] sm:max-w-[340px]">{sug}</span>
                <ChevronRight className="w-3 h-3 text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
