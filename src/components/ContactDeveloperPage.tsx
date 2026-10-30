import React, { useState } from "react";
import {
  MessageSquare,
  Phone,
  Mail,
  Send,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Code2,
  Clock,
  ShieldCheck,
  UserCheck,
  HelpCircle,
  FileQuestion,
  Terminal,
} from "lucide-react";
import { InfoAtlasLogo } from "./InfoAtlasLogo";

interface ContactDeveloperPageProps {
  isDark: boolean;
  onNavigateHome?: () => void;
}

export const ContactDeveloperPage: React.FC<ContactDeveloperPageProps> = ({
  isDark,
  onNavigateHome,
}) => {
  const DEVELOPER_NAME = "Harsh";
  const DEVELOPER_EMAIL = "harsheaj2000@gmail.com";
  const DEVELOPER_PHONE = "9508566957";
  const DEVELOPER_PHONE_INTL = "+91 9508566957";
  const WHATSAPP_RAW = "919508566957";

  // Form states
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [topicCategory, setTopicCategory] = useState("General Feedback");
  const [messageText, setMessageText] = useState("");
  const [copiedType, setCopiedType] = useState<"whatsapp" | "phone" | "email" | null>(null);

  const handleCopy = (text: string, type: "whatsapp" | "phone" | "email") => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2200);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  // Compose formatted message for WhatsApp
  const generateWhatsAppUrl = () => {
    const greeting = senderName ? `Hello Harsh, my name is ${senderName}.` : `Hello Harsh!`;
    const emailRef = senderEmail ? ` (Reply-to: ${senderEmail})` : "";
    const body = messageText || "I am reaching out via InfoAtlas regarding your application.";
    const text = encodeURIComponent(`${greeting}${emailRef}\n\n[Topic: ${topicCategory}]\n${body}`);
    return `https://wa.me/${WHATSAPP_RAW}?text=${text}`;
  };

  // Compose formatted mailto link
  const generateMailtoUrl = () => {
    const subject = encodeURIComponent(`[InfoAtlas] ${topicCategory}${senderName ? ` - from ${senderName}` : ""}`);
    const emailRef = senderEmail ? `Sender Email: ${senderEmail}\n` : "";
    const nameRef = senderName ? `Sender Name: ${senderName}\n` : "";
    const body = encodeURIComponent(`${nameRef}${emailRef}Category: ${topicCategory}\n\nMessage:\n${messageText || "Hello Harsh,\n\nI would like to connect with you regarding InfoAtlas."}\n\nSent from InfoAtlas Web Platform`);
    return `mailto:${DEVELOPER_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-4 space-y-8 animate-fadeIn">
      {/* Top Banner / Header */}
      <div
        className={`rounded-3xl border p-6 sm:p-10 shadow-sm relative overflow-hidden ${
          isDark
            ? "bg-slate-900/80 border-slate-800 text-white"
            : "bg-white border-[#E0E9FA] text-[#102B59]"
        }`}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-500/10 via-blue-500/10 to-transparent rounded-full pointer-events-none filter blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl text-white shadow-xl"
                style={{
                  background:
                    "linear-gradient(135deg, #00F5FF 0%, #386BFF 50%, #8A3FFC 100%)",
                }}
              >
                H
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center"
                title="Available & Online"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-ping opacity-75" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  {DEVELOPER_NAME}
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  Lead Developer
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#60769A] dark:text-slate-300">
                Creator & Systems Architect of <strong className="text-cyan-500 dark:text-cyan-400">InfoAtlas</strong>
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-[#60769A] dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  Avg. response: &lt; 2 hrs
                </span>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Direct Developer Line
                </span>
              </div>
            </div>
          </div>

          {/* Quick CTA Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`https://wa.me/${WHATSAPP_RAW}?text=${encodeURIComponent("Hi Harsh, reaching out from InfoAtlas!")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Chat</span>
              <ExternalLink className="w-3 h-3 opacity-75" />
            </a>

            <a
              href={`mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent("[InfoAtlas] Inquiry for Developer")}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#386BFF] to-[#7252FF] hover:opacity-95 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Email Developer</span>
            </a>
          </div>
        </div>
      </div>

      {/* 3 Core Contact Cards: WhatsApp, Phone, Email */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* 1. WhatsApp Card */}
        <div
          className={`rounded-3xl border p-6 flex flex-col justify-between transition-all hover:shadow-lg ${
            isDark
              ? "bg-slate-900/60 border-slate-800 hover:border-emerald-500/40"
              : "bg-white border-[#E0E9FA] hover:border-emerald-500/40"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Instant Chat
              </span>
            </div>
            <h3 className="text-base font-bold mb-1">WhatsApp</h3>
            <p className="text-xs text-[#60769A] dark:text-slate-400 mb-4">
              Fastest response for quick feedback, suggestions, or live discussions.
            </p>
            <div
              className={`p-3 rounded-2xl border font-mono text-sm font-bold flex items-center justify-between mb-4 ${
                isDark ? "bg-slate-950/60 border-slate-800 text-emerald-400" : "bg-emerald-50/50 border-emerald-100 text-emerald-700"
              }`}
            >
              <span>{DEVELOPER_PHONE_INTL}</span>
              <button
                type="button"
                onClick={() => handleCopy(DEVELOPER_PHONE, "whatsapp")}
                className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-500 transition-colors cursor-pointer"
                title="Copy WhatsApp number"
              >
                {copiedType === "whatsapp" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <a
            href={generateWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 2. Direct Phone Call Card */}
        <div
          className={`rounded-3xl border p-6 flex flex-col justify-between transition-all hover:shadow-lg ${
            isDark
              ? "bg-slate-900/60 border-slate-800 hover:border-blue-500/40"
              : "bg-white border-[#E0E9FA] hover:border-blue-500/40"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                Direct Call
              </span>
            </div>
            <h3 className="text-base font-bold mb-1">Phone Call</h3>
            <p className="text-xs text-[#60769A] dark:text-slate-400 mb-4">
              Available for urgent matters, critical bug reports, or partnership calls.
            </p>
            <div
              className={`p-3 rounded-2xl border font-mono text-sm font-bold flex items-center justify-between mb-4 ${
                isDark ? "bg-slate-950/60 border-slate-800 text-blue-400" : "bg-blue-50/50 border-blue-100 text-blue-700"
              }`}
            >
              <span>{DEVELOPER_PHONE_INTL}</span>
              <button
                type="button"
                onClick={() => handleCopy(DEVELOPER_PHONE, "phone")}
                className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors cursor-pointer"
                title="Copy phone number"
              >
                {copiedType === "phone" ? <Check className="w-4 h-4 text-blue-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <a
            href={`tel:+91${DEVELOPER_PHONE}`}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
          >
            <Phone className="w-4 h-4" />
            <span>Call {DEVELOPER_PHONE}</span>
          </a>
        </div>

        {/* 3. Direct Email Card */}
        <div
          className={`rounded-3xl border p-6 flex flex-col justify-between transition-all hover:shadow-lg ${
            isDark
              ? "bg-slate-900/60 border-slate-800 hover:border-purple-500/40"
              : "bg-white border-[#E0E9FA] hover:border-purple-500/40"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                Official Inquiries
              </span>
            </div>
            <h3 className="text-base font-bold mb-1">Email Address</h3>
            <p className="text-xs text-[#60769A] dark:text-slate-400 mb-4">
              For detailed proposals, feature specs, attachments, and formal queries.
            </p>
            <div
              className={`p-3 rounded-2xl border font-mono text-xs sm:text-[13px] font-bold flex items-center justify-between mb-4 truncate ${
                isDark ? "bg-slate-950/60 border-slate-800 text-purple-400" : "bg-purple-50/50 border-purple-100 text-purple-700"
              }`}
            >
              <span className="truncate mr-2">{DEVELOPER_EMAIL}</span>
              <button
                type="button"
                onClick={() => handleCopy(DEVELOPER_EMAIL, "email")}
                className="p-1.5 rounded-lg hover:bg-purple-500/10 text-purple-500 transition-colors cursor-pointer shrink-0"
                title="Copy email address"
              >
                {copiedType === "email" ? <Check className="w-4 h-4 text-purple-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <a
            href={generateMailtoUrl()}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white shadow-sm transition-all"
          >
            <Mail className="w-4 h-4" />
            <span>Send Email</span>
          </a>
        </div>
      </div>

      {/* Interactive Message Dispatch Studio */}
      <div
        className={`rounded-3xl border p-6 sm:p-8 shadow-sm ${
          isDark
            ? "bg-slate-900/70 border-slate-800 text-white"
            : "bg-white border-[#E0E9FA] text-[#102B59]"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-[#E0E9FA] dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Send className="w-5 h-5 text-cyan-500" />
              <span>Draft a Direct Message</span>
            </h2>
            <p className="text-xs text-[#60769A] dark:text-slate-400 mt-1">
              Compose your message below. Choose to transmit it directly to WhatsApp or launch your email client with one tap.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#60769A] dark:text-slate-400 font-semibold">
              Recipient: <strong className="text-[#102B59] dark:text-white">Harsh</strong>
            </span>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            // Default to WhatsApp dispatch
            window.open(generateWhatsAppUrl(), "_blank");
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#60769A] dark:text-slate-300">
                Your Name
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g., Alex Morgan"
                className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm transition-all ${
                  isDark
                    ? "bg-slate-950/80 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500"
                    : "bg-[#F5F8FF] border-[#E0E9FA] text-[#102B59] placeholder-[#60769A] focus:border-blue-500 focus:bg-white"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#60769A] dark:text-slate-300">
                Your Email (Optional)
              </label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="e.g., you@domain.com"
                className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm transition-all ${
                  isDark
                    ? "bg-slate-950/80 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500"
                    : "bg-[#F5F8FF] border-[#E0E9FA] text-[#102B59] placeholder-[#60769A] focus:border-blue-500 focus:bg-white"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#60769A] dark:text-slate-300">
                Topic
              </label>
              <select
                value={topicCategory}
                onChange={(e) => setTopicCategory(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer ${
                  isDark
                    ? "bg-slate-950/80 border-slate-800 text-white focus:border-cyan-500"
                    : "bg-[#F5F8FF] border-[#E0E9FA] text-[#102B59] focus:border-blue-500 focus:bg-white"
                }`}
              >
                <option value="General Feedback">💡 General Feedback</option>
                <option value="Bug Report">🐛 Bug Report / Technical Issue</option>
                <option value="Feature Request">🚀 Feature Request</option>
                <option value="Cricket Data Feedback">🏏 Cricket Desk Data & Scores</option>
                <option value="News Feed Feedback">📰 News Feed & Article Reader</option>
                <option value="Business & Collaboration">🤝 Business / Partnership</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#60769A] dark:text-slate-300">
              Message
            </label>
            <textarea
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Write your thoughts, questions, or bug reports here..."
              className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm leading-relaxed transition-all resize-y ${
                isDark
                  ? "bg-slate-950/80 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500"
                  : "bg-[#F5F8FF] border-[#E0E9FA] text-[#102B59] placeholder-[#60769A] focus:border-blue-500 focus:bg-white"
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-[#60769A] dark:text-slate-400">
              Select your preferred channel to transmit this draft:
            </span>

            <div className="flex items-center gap-3">
              <a
                href={generateWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send via WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href={generateMailtoUrl()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#386BFF] to-[#7252FF] hover:opacity-95 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Send via Email Client</span>
              </a>
            </div>
          </div>
        </form>
      </div>

      {/* About InfoAtlas & Developer Mission */}
      <div
        className={`rounded-3xl border p-6 sm:p-8 ${
          isDark
            ? "bg-slate-900/40 border-slate-800 text-slate-300"
            : "bg-slate-50 border-[#E0E9FA] text-[#60769A]"
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <h4 className="text-sm font-bold text-[#102B59] dark:text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-500" />
              About InfoAtlas Development & Platform Engineering
            </h4>
            <p className="text-xs leading-relaxed">
              InfoAtlas is developed and maintained by Harsh with a vision to build a clean, ad-free, high-speed unified knowledge hub combining live global news feeds, real-time cricket coverage with verified ball-by-ball scorecards, encyclopedia knowledge, and AI assistant intelligence.
            </p>
            <p className="text-xs leading-relaxed">
              Your feedback directly shapes new features, API groundings, and performance enhancements.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="text-center md:text-right">
              <span className="text-[11px] block font-semibold text-[#102B59] dark:text-white">
                Developer WhatsApp
              </span>
              <span className="text-xs font-mono font-bold text-emerald-500">
                +91 9508566957
              </span>
            </div>
            <div className="text-center md:text-right sm:border-l sm:pl-3 border-[#E0E9FA] dark:border-slate-800">
              <span className="text-[11px] block font-semibold text-[#102B59] dark:text-white">
                Official Email
              </span>
              <span className="text-xs font-mono font-bold text-blue-500">
                harsheaj2000@gmail.com
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
