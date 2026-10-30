import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Mail,
  Inbox,
  Star,
  Send,
  Trash2,
  RefreshCw,
  Search,
  Sparkles,
  Plus,
  Clock,
  ArrowLeft,
  Check,
  AlertCircle,
  X,
  Tag,
  Reply,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Lock,
  LogOut,
  ChevronDown,
  User as UserIcon,
} from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";
import {
  initGoogleAuth,
  googleSignIn,
  googleSignInForGmail,
  googleLogout,
  getAccessToken,
} from "../services/googleAuth";
import {
  fetchGmailProfile,
  fetchGmailLabels,
  listGmailMessages,
  getGmailMessageDetail,
  sendGmailMessage,
  trashGmailMessage,
  modifyGmailMessageLabels,
} from "../services/gmail";
import { askGemini } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { GmailMessageSummary, GmailUserProfile, GmailLabel } from "../types";
import { DecorativeAiResponse } from "./DecorativeAiResponse";

interface GmailViewProps {
  isDark: boolean;
}

type MailFolder = "INBOX" | "STARRED" | "SENT" | "DRAFT" | "TRASH" | "SPAM";

const SAMPLE_MESSAGES: GmailMessageSummary[] = [
  {
    id: "sample_msg_1",
    threadId: "thread_1",
    snippet: "Welcome to InfoAtlas Knowledge Workspace! Your Google Workspace integration is ready...",
    subject: "Welcome to InfoAtlas Knowledge & Research Platform",
    from: "InfoAtlas Team <team@infoatlas.app>",
    fromName: "InfoAtlas Team",
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    isUnread: true,
    isStarred: true,
    labelIds: ["INBOX", "STARRED"],
    bodyText: `Hello,\n\nWelcome to InfoAtlas! Your Google Workspace integration is active.\n\nYou can use our AI features to:\n1. Generate decorative executive summaries of incoming emails.\n2. Draft professional replies with Gemini.\n3. Organize your inbox, search across senders and topics, and archive messages safely.\n\nEnjoy exploring everything and understanding anything!\n\nBest regards,\nThe InfoAtlas Intelligence Team`,
  },
  {
    id: "sample_msg_2",
    threadId: "thread_2",
    snippet: "Project Milestone Report: Q4 Knowledge Synthesis Engine and Real-time News feeds are live...",
    subject: "Quarterly Milestone: Knowledge Synthesis & Live News Feed",
    from: "Alex Morgan <alex.morgan@research-lab.org>",
    fromName: "Alex Morgan",
    date: new Date(Date.now() - 3600000 * 24).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    isUnread: false,
    isStarred: false,
    labelIds: ["INBOX"],
    bodyText: `Hi Team,\n\nHere is the update regarding our latest milestone. The Knowledge Synthesis engine is successfully retrieving information with verified citations.\n\nKey action items:\n- Review follow-up question capabilities\n- Confirm multi-language Hindi translation accuracy\n- Finalize user authorization workflows\n\nPlease let me know your thoughts before Friday's standup.\n\nCheers,\nAlex`,
  },
  {
    id: "sample_msg_3",
    threadId: "thread_3",
    snippet: "Meeting invite: Science & Technology Review on Monday at 10:00 AM...",
    subject: "Invitation: Science & Technology Intelligence Briefing",
    from: "Dr. Sarah Jenkins <s.jenkins@academy.edu>",
    fromName: "Dr. Sarah Jenkins",
    date: new Date(Date.now() - 3600000 * 48).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    isUnread: false,
    isStarred: true,
    labelIds: ["INBOX", "STARRED"],
    bodyText: `Dear Colleague,\n\nYou are invited to attend our upcoming Intelligence Briefing covering breakthroughs in Quantum Computing and Astronomical Research.\n\nAgenda:\n- Overview of recent discoveries\n- Demonstrations of AI-assisted summarization\n- Q&A session\n\nLooking forward to seeing you there.\n\nSincerely,\nDr. Sarah Jenkins`,
  },
];

export const GmailView: React.FC<GmailViewProps> = ({ isDark }) => {
  const { t, language } = useLanguage();

  // Auth State
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Profile & Labels
  const [profile, setProfile] = useState<GmailUserProfile | null>(null);
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [currentFolder, setCurrentFolder] = useState<MailFolder>("INBOX");

  // Messages State
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeSearch, setActiveSearch] = useState<string>("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [activeMessageDetail, setActiveMessageDetail] = useState<GmailMessageSummary | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // AI Assistant in Email
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState<boolean>(false);

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [composeTo, setComposeTo] = useState<string>("");
  const [composeSubject, setComposeSubject] = useState<string>("");
  const [composeBody, setComposeBody] = useState<string>("");
  const [composeCc, setComposeCc] = useState<string>("");
  const [aiDraftPrompt, setAiDraftPrompt] = useState<string>("");
  const [isAiDrafting, setIsAiDrafting] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  // MANDATORY USER CONFIRMATION DIALOGS (Per Google Workspace Skill Security Requirements)
  const [pendingConfirmAction, setPendingConfirmAction] = useState<{
    type: "send" | "trash";
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Success Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setHasToken(Boolean(token));
        setAuthError(null);
      },
      () => {
        setHasToken(false);
      }
    );

    // Initial check
    getAccessToken().then((tok) => {
      if (tok) setHasToken(true);
    });

    return () => unsubscribe();
  }, []);

  // 2. Load profile and labels when authenticated
  const loadProfileAndLabels = useCallback(async () => {
    try {
      const [prof, lbls] = await Promise.all([
        fetchGmailProfile(),
        fetchGmailLabels().catch(() => []),
      ]);
      if (prof) setProfile(prof);
      if (lbls) setLabels(lbls);
    } catch (err: any) {
      console.warn("Error loading Gmail profile/labels:", err);
    }
  }, []);

  useEffect(() => {
    if (hasToken) {
      loadProfileAndLabels();
    }
  }, [hasToken, loadProfileAndLabels]);

  // 3. Load messages for folder or query
  const loadMessages = useCallback(
    async (folder: MailFolder = currentFolder, query: string = activeSearch) => {
      if (!hasToken) return;

      setIsLoadingMessages(true);
      try {
        let labelFilter: string[] = [];
        let qFilter = query.trim();

        if (folder === "INBOX") labelFilter = ["INBOX"];
        else if (folder === "STARRED") labelFilter = ["STARRED"];
        else if (folder === "SENT") labelFilter = ["SENT"];
        else if (folder === "DRAFT") labelFilter = ["DRAFT"];
        else if (folder === "TRASH") labelFilter = ["TRASH"];
        else if (folder === "SPAM") labelFilter = ["SPAM"];

        const res = await listGmailMessages({
          q: qFilter || undefined,
          labelIds: labelFilter.length > 0 ? labelFilter : undefined,
          maxResults: 20,
        });

        setMessages(res.messages || []);
      } catch (err: any) {
        console.error("Failed to load messages:", err);
        showToast(`Failed to load emails: ${err.message || "Unknown error"}`);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [hasToken, currentFolder, activeSearch]
  );

  useEffect(() => {
    if (hasToken) {
      loadMessages(currentFolder, activeSearch);
    }
  }, [hasToken, currentFolder, activeSearch, loadMessages]);

  // 4. Load full message detail when selected
  const handleSelectMessage = async (msgId: string) => {
    setSelectedMessageId(msgId);
    setActiveMessageDetail(null);
    setAiSummary(null);
    setIsLoadingDetail(true);

    try {
      const detail = await getGmailMessageDetail(msgId);
      setActiveMessageDetail(detail);

      // Auto mark as read if it was unread
      if (detail.isUnread) {
        modifyGmailMessageLabels(msgId, [], ["UNREAD"]).catch(() => {});
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, isUnread: false } : m))
        );
      }
    } catch (err: any) {
      console.error("Error reading message detail:", err);
      showToast(`Could not load email detail: ${err.message || "Unknown error"}`);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // 5. Google Sign In Trigger specifically requesting Gmail Workspace scopes
  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await googleSignInForGmail();
      if (res && res.accessToken) {
        setGoogleUser(res.user);
        setHasToken(true);
        showToast("Connected to Gmail successfully!");
      }
    } catch (err: any) {
      console.error("Sign-in failure:", err);
      const msg = err?.message || "";
      const isAccessDenied =
        err?.code === "auth/access-denied" ||
        msg.includes("403") ||
        msg.includes("access_denied") ||
        msg.includes("verification");

      if (isAccessDenied) {
        setAuthError(
          "Google Cloud Testing Notice: Access to live Gmail mailbox is currently restricted by Google to developer-approved test users (such as harshdex1@gmail.com). You can sign in with the developer account or click 'Open Sample Mailbox (Demo Mode)' below to explore all Gmail features!"
        );
      } else if (err?.code === "auth/popup-closed-by-user") {
        setAuthError("Sign-in popup was closed before completion.");
      } else {
        setAuthError(msg || "Failed to complete Google Sign-in. Please ensure popups are allowed.");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEnableDemoMailbox = () => {
    setGoogleUser({
      email: "harsheaj2000@gmail.com",
      displayName: "Harsh (Workspace Preview)",
    } as any);
    setProfile({
      emailAddress: "harsheaj2000@gmail.com",
      messagesTotal: 3,
      threadsTotal: 3,
      historyId: "demo",
    });
    setHasToken(true);
    setMessages(SAMPLE_MESSAGES);
    showToast("Opened sample Gmail workspace in preview mode!");
  };

  // 6. Sign Out
  const handleGoogleSignOut = async () => {
    await googleLogout();
    setGoogleUser(null);
    setHasToken(false);
    setProfile(null);
    setMessages([]);
    setSelectedMessageId(null);
    setActiveMessageDetail(null);
    showToast("Signed out from Gmail.");
  };

  // 7. Toggle Star
  const handleToggleStar = async (e: React.MouseEvent, msg: GmailMessageSummary) => {
    e.stopPropagation();
    const newStarred = !msg.isStarred;
    const add = newStarred ? ["STARRED"] : [];
    const remove = newStarred ? [] : ["STARRED"];

    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, isStarred: newStarred } : m))
    );
    if (activeMessageDetail && activeMessageDetail.id === msg.id) {
      setActiveMessageDetail({ ...activeMessageDetail, isStarred: newStarred });
    }

    try {
      await modifyGmailMessageLabels(msg.id, add, remove);
    } catch (err) {
      console.error("Star toggle failed:", err);
    }
  };

  // 8. Delete / Trash with MANDATORY User Confirmation Dialog
  const handlePromptTrash = (msgId: string, subject: string) => {
    setPendingConfirmAction({
      type: "trash",
      title: "Move Email to Trash?",
      description: `Are you sure you want to move the email "${subject || "(No Subject)"}" to the Gmail Trash?`,
      onConfirm: async () => {
        try {
          await trashGmailMessage(msgId);
          setMessages((prev) => prev.filter((m) => m.id !== msgId));
          if (selectedMessageId === msgId) {
            setSelectedMessageId(null);
            setActiveMessageDetail(null);
          }
          showToast("Email moved to Trash.");
        } catch (err: any) {
          showToast(`Failed to trash email: ${err.message}`);
        }
      },
    });
  };

  // 9. Send Email with MANDATORY User Confirmation Dialog
  const handlePromptSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim()) {
      setSendError("Recipient email address is required.");
      return;
    }
    if (!composeSubject.trim()) {
      setSendError("Email subject line is required.");
      return;
    }
    setSendError(null);

    // Present mandatory confirmation before sending
    setPendingConfirmAction({
      type: "send",
      title: "Send this Email?",
      description: `Are you sure you want to send this email to ${composeTo} with the subject "${composeSubject}"?`,
      onConfirm: async () => {
        setIsSending(true);
        try {
          await sendGmailMessage({
            to: composeTo.trim(),
            subject: composeSubject.trim(),
            body: composeBody.trim(),
            cc: composeCc.trim() || undefined,
          });
          setIsComposeOpen(false);
          setComposeTo("");
          setComposeSubject("");
          setComposeBody("");
          setComposeCc("");
          setAiDraftPrompt("");
          showToast("Email sent successfully via Gmail!");
          // Reload sent folder or inbox
          loadMessages(currentFolder, activeSearch);
        } catch (err: any) {
          setSendError(err.message || "Failed to send email. Please try again.");
          showToast(`Sending failed: ${err.message}`);
        } finally {
          setIsSending(false);
        }
      },
    });
  };

  // 10. AI Drafter
  const handleGenerateAiDraft = async () => {
    if (!aiDraftPrompt.trim() || isAiDrafting) return;
    setIsAiDrafting(true);

    try {
      const prompt = `You are a professional email assistant. Draft a polished, concise email based on this requirement:
"${aiDraftPrompt.trim()}".
Respond in standard email body text. Do not include markdown meta tags or preamble.`;
      const draft = await askGemini(prompt, undefined, "You are InfoAtlas AI, an expert professional communicator.");
      setComposeBody(draft.trim());
      showToast("AI draft created! Review and edit before sending.");
    } catch (err: any) {
      showToast(`AI drafting failed: ${err.message}`);
    } finally {
      setIsAiDrafting(false);
    }
  };

  // 11. AI Email Summarizer
  const handleGenerateAiSummary = async () => {
    if (!activeMessageDetail || isGeneratingAiSummary) return;
    setIsGeneratingAiSummary(true);

    try {
      const content = activeMessageDetail.bodyText || activeMessageDetail.snippet;
      const prompt = `Analyze and provide a clear, decorative executive summary of this email:
Sender: ${activeMessageDetail.fromName} (${activeMessageDetail.from})
Subject: ${activeMessageDetail.subject}
Date: ${activeMessageDetail.date}

Email Body:
${content}

Formatting instructions:
- Provide a 2-3 sentence overview.
- Highlight "### 📌 Key Takeaway" or action items.
- Mention deadline, request, or next steps clearly.`;

      const summary = await askGemini(prompt, undefined, "You are InfoAtlas AI, an expert productivity intelligence analyst.");
      setAiSummary(summary);
    } catch (err: any) {
      showToast(`AI summary failed: ${err.message}`);
    } finally {
      setIsGeneratingAiSummary(false);
    }
  };

  // Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
  };

  // Render when NOT logged in to Google
  if (!hasToken) {
    return (
      <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 space-y-6">
        {/* Hero Card */}
        <div
          className={`p-8 sm:p-12 rounded-3xl border text-center relative overflow-hidden shadow-xl transition-all ${
            isDark
              ? "bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-slate-800 text-white"
              : "bg-gradient-to-b from-white via-indigo-50/20 to-blue-50/30 border-[#E0E9FA] text-[#102B59]"
          }`}
        >
          {/* Decorative ambient background bloom */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 via-red-500 to-amber-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-red-500/25">
              <Mail className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Google Workspace Certified</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Connect Gmail to InfoAtlas
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Seamlessly read, search, compose, and manage your emails right inside your knowledge dashboard.
                Features AI-powered email summarization, smart drafting, and instant search.
              </p>
            </div>

            {authError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Action Buttons: Live Google Workspace Sign-In & Sample Mailbox Preview */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isAuthenticating}
                className="gsi-material-button inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-60"
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                </div>
                <span>{isAuthenticating ? "Connecting with Google..." : "Connect Live Gmail"}</span>
              </button>

              <button
                type="button"
                onClick={handleEnableDemoMailbox}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-cyan-300 border border-indigo-200 dark:border-slate-700 hover:border-indigo-400 font-semibold text-xs transition-all cursor-pointer shadow-sm hover:shadow"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Open Sample Mailbox (Demo Mode)</span>
              </button>
            </div>

            {/* Privacy & Permissions Notice */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p>With permission from your Google account, InfoAtlas accesses your Gmail messages and allows you to send emails.</p>
              <p>Access tokens are stored strictly in-memory during your active session and never shared.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render MAIN Gmail Interface
  return (
    <div className="max-w-7xl mx-auto space-y-4 px-2 sm:px-4 py-2">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
          isDark
            ? "bg-slate-900/90 border-slate-800 text-white"
            : "bg-white border-[#E0E9FA] text-[#102B59] shadow-sm"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-red-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-red-500/20 shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold">Gmail Workspace</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Connected</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
              {profile?.emailAddress || googleUser?.email || "Google Account"}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsComposeOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-red-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Compose Email</span>
          </button>

          <button
            type="button"
            onClick={() => loadMessages(currentFolder, activeSearch)}
            disabled={isLoadingMessages}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isDark
                ? "bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
            }`}
            title="Refresh emails"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingMessages ? "animate-spin text-rose-500" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleGoogleSignOut}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isDark
                ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-rose-400"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:text-rose-600"
            }`}
            title="Sign out of Gmail"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Mailbox Grid: Folder Tabs + List + Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Folders / Navigation */}
        <div className="lg:col-span-3 space-y-3">
          {/* Folders List */}
          <div
            className={`p-3 rounded-2xl border ${
              isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-[#E0E9FA] shadow-xs"
            }`}
          >
            <nav className="space-y-1">
              {[
                { id: "INBOX", label: "Inbox", icon: Inbox, color: "text-blue-500" },
                { id: "STARRED", label: "Starred", icon: Star, color: "text-amber-400" },
                { id: "SENT", label: "Sent", icon: Send, color: "text-emerald-500" },
                { id: "DRAFT", label: "Drafts", icon: FileText, color: "text-purple-400" },
                { id: "TRASH", label: "Trash", icon: Trash2, color: "text-rose-400" },
                { id: "SPAM", label: "Spam", icon: AlertCircle, color: "text-orange-400" },
              ].map((f) => {
                const Icon = f.icon;
                const isActive = currentFolder === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setCurrentFolder(f.id as MailFolder);
                      setSelectedMessageId(null);
                      setActiveMessageDetail(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold"
                        : isDark
                        ? "text-slate-400 hover:text-white hover:bg-slate-800/60"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? "text-rose-500" : f.color}`} />
                      <span>{f.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick AI Email Assistant Tip */}
          <div
            className={`p-4 rounded-2xl border text-xs space-y-2 ${
              isDark
                ? "bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900 border-indigo-500/30 text-slate-300"
                : "bg-gradient-to-br from-indigo-50 via-white to-blue-50 border-indigo-200 text-indigo-950"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-indigo-500 dark:text-cyan-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Smart Gmail Assistant</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-400">
              Select any email to generate an instant executive summary, extract actionable requests, or auto-draft a reply.
            </p>
          </div>
        </div>

        {/* Middle / Right: Mailbox List or Email Detail */}
        <div className="lg:col-span-9 space-y-4 min-w-0">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emails by sender, subject, or keywords..."
              className={`w-full pl-10 pr-24 py-2.5 rounded-xl text-xs sm:text-sm border transition-all outline-none ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-rose-500"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-rose-500"
              }`}
            />
            {activeSearch && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveSearch("");
                }}
                className="absolute right-16 top-2.5 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Active Detail View */}
          {selectedMessageId ? (
            <div
              className={`p-4 sm:p-6 rounded-3xl border space-y-6 ${
                isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-[#E0E9FA] text-[#102B59] shadow-sm"
              }`}
            >
              {/* Back to list button */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMessageId(null);
                    setActiveMessageDetail(null);
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to {currentFolder}</span>
                </button>

                {activeMessageDetail && (
                  <div className="flex items-center gap-2">
                    {/* Star Toggle */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleStar(e, activeMessageDetail)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={activeMessageDetail.isStarred ? "Unstar" : "Star"}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          activeMessageDetail.isStarred ? "text-amber-400 fill-amber-400" : "text-slate-400"
                        }`}
                      />
                    </button>

                    {/* Trash Button */}
                    <button
                      type="button"
                      onClick={() => handlePromptTrash(activeMessageDetail.id, activeMessageDetail.subject || "")}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-rose-500/10 hover:text-rose-500 text-slate-400 transition-colors"
                      title="Move to Trash"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Reply Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setComposeTo(activeMessageDetail.from || "");
                        setComposeSubject(`Re: ${activeMessageDetail.subject?.replace(/^Re:\s*/i, "")}`);
                        setComposeBody(`\n\n--- On ${activeMessageDetail.date}, ${activeMessageDetail.fromName} wrote:\n${activeMessageDetail.bodyText || ""}`);
                        setIsComposeOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-xs font-bold transition-all"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  </div>
                )}
              </div>

              {isLoadingDetail ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                  <span className="text-xs">Loading email detail & message body...</span>
                </div>
              ) : activeMessageDetail ? (
                <div className="space-y-6">
                  {/* Email Headers */}
                  <div className="space-y-2">
                    <h2 className="text-lg sm:text-xl font-bold break-words">
                      {activeMessageDetail.subject || "(No Subject)"}
                    </h2>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-bold flex items-center justify-center shrink-0">
                          {activeMessageDetail.fromName?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-bold">{activeMessageDetail.fromName}</p>
                          <p className="text-[11px] text-slate-400">&lt;{activeMessageDetail.from}&gt;</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{activeMessageDetail.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Summary Action & Display */}
                  <div className="space-y-3">
                    {!aiSummary ? (
                      <button
                        type="button"
                        onClick={handleGenerateAiSummary}
                        disabled={isGeneratingAiSummary}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-blue-600/10 hover:from-violet-600/20 hover:to-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {isGeneratingAiSummary ? "Synthesizing executive summary..." : "Summarize Email with InfoAtlas AI"}
                        </span>
                      </button>
                    ) : (
                      <DecorativeAiResponse
                        content={aiSummary}
                        isDark={isDark}
                        language={language}
                        roleTitle="AI Email Executive Briefing"
                        showFollowUpChips={false}
                      />
                    )}
                  </div>

                  {/* Email Body Content */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    {activeMessageDetail.bodyHtml ? (
                      <div
                        className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed overflow-x-auto"
                        dangerouslySetInnerHTML={{ __html: activeMessageDetail.bodyHtml }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {activeMessageDetail.bodyText}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            /* Messages List View */
            <div
              className={`rounded-3xl border overflow-hidden ${
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-[#E0E9FA] shadow-xs"
              }`}
            >
              {isLoadingMessages ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                  <span className="text-xs">Fetching messages from Gmail...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-16 text-center space-y-3 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">No messages found</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {activeSearch ? `No emails matching "${activeSearch}"` : `Your ${currentFolder} is empty.`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleSelectMessage(m.id)}
                      className={`p-3.5 sm:p-4 transition-all flex items-start gap-3 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        m.isUnread
                          ? isDark
                            ? "bg-slate-800/30 font-semibold"
                            : "bg-blue-50/40 font-semibold"
                          : ""
                      }`}
                    >
                      {/* Star Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleStar(e, m)}
                        className="mt-1 p-1 text-slate-400 hover:text-amber-400 transition-colors"
                        title={m.isStarred ? "Starred" : "Star"}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            m.isStarred ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600"
                          }`}
                        />
                      </button>

                      {/* Main Message Summary Item */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span
                            className={`text-xs truncate ${
                              m.isUnread
                                ? "text-rose-600 dark:text-rose-400 font-bold"
                                : isDark
                                ? "text-slate-200"
                                : "text-slate-800"
                            }`}
                          >
                            {m.fromName}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                            {m.date ? new Date(m.date).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
                          </span>
                        </div>

                        <h4
                          className={`text-xs truncate ${
                            m.isUnread ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {m.subject || "(No Subject)"}
                        </h4>

                        <p className="text-[11px] text-slate-400 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {m.snippet}
                        </p>
                      </div>

                      {/* Unread indicator */}
                      {m.isUnread && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Compose Email Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-2xl rounded-3xl border flex flex-col shadow-2xl overflow-hidden ${
              isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Compose Email</h3>
                  <span className="text-[10px] text-slate-400">Send from your verified Gmail address</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Prompt Strip */}
            <div className="p-3 bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-blue-600/10 border-b border-indigo-500/20 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <input
                type="text"
                value={aiDraftPrompt}
                onChange={(e) => setAiDraftPrompt(e.target.value)}
                placeholder="Ask InfoAtlas AI to draft (e.g. 'Polite request for project update next week')..."
                className="flex-1 bg-transparent text-xs outline-none placeholder-slate-400 text-slate-800 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={handleGenerateAiDraft}
                disabled={!aiDraftPrompt.trim() || isAiDrafting}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isAiDrafting ? "Drafting..." : "Draft with AI"}
              </button>
            </div>

            {/* Compose Form */}
            <form onSubmit={handlePromptSend} className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col">
              {sendError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{sendError}</span>
                </div>
              )}

              {/* To */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-semibold text-slate-400 w-12">To:</span>
                <input
                  type="email"
                  required
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="flex-1 text-xs sm:text-sm bg-transparent outline-none"
                />
              </div>

              {/* Subject */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-semibold text-slate-400 w-12">Subject:</span>
                <input
                  type="text"
                  required
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="flex-1 text-xs sm:text-sm bg-transparent outline-none"
                />
              </div>

              {/* Body */}
              <div className="flex-1 min-h-[180px]">
                <textarea
                  required
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Write your email here..."
                  className="w-full h-full min-h-[180px] text-xs sm:text-sm bg-transparent outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-red-500/20 transition-all cursor-pointer disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? "Sending..." : "Send Email"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION DIALOG MODAL (Google Workspace Skill Requirement) */}
      {pendingConfirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl relative space-y-4 ${
              isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  pendingConfirmAction.type === "trash"
                    ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                    : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                }`}
              >
                {pendingConfirmAction.type === "trash" ? (
                  <Trash2 className="w-5 h-5" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold">{pendingConfirmAction.title}</h3>
                <span className="text-[10px] text-slate-400">Workspace User Action Confirmation</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {pendingConfirmAction.description}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingConfirmAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = pendingConfirmAction.onConfirm;
                  setPendingConfirmAction(null);
                  await action();
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
                  pendingConfirmAction.type === "trash"
                    ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/25"
                    : "bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-red-500/20"
                }`}
              >
                {pendingConfirmAction.type === "trash" ? "Confirm Delete" : "Confirm Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
