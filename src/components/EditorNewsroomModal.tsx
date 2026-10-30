import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { PublishedNewsArticle } from "../types";
import { INDIA_STATES } from "../utils/indiaLocations";
import {
  FileText,
  Sparkles,
  Send,
  Loader2,
  X,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Trash2,
  Eye,
  Plus,
  RefreshCw,
  ExternalLink,
  Edit3,
  Bookmark,
  Share2,
} from "lucide-react";

interface EditorNewsroomModalProps {
  onClose: () => void;
  onNavigateToTab?: (tab: string, article?: any) => void;
  isDark?: boolean;
}

export const EditorNewsroomModal: React.FC<EditorNewsroomModalProps> = ({
  onClose,
  onNavigateToTab,
  isDark = true,
}) => {
  const { user, isEditor } = useAuth();

  const [activeTab, setActiveTab] = useState<"ai-draft" | "published-list">("ai-draft");

  // Topic & Generation Parameters
  const [topic, setTopic] = useState<string>("");
  const [category, setCategory] = useState<string>("National News");
  const [targetTab, setTargetTab] = useState<"news" | "local-news" | "home" | "sports" | "cricket" | "knowledge">("news");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [urgency, setUrgency] = useState<"Standard" | "Breaking Bulletin" | "Editorial Exclusive">("Editorial Exclusive");
  const [additionalGuidelines, setAdditionalGuidelines] = useState<string>("");

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Drafted Story for Review & Live Editing
  const [draftArticle, setDraftArticle] = useState<PublishedNewsArticle | null>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishedSuccess, setPublishedSuccess] = useState<PublishedNewsArticle | null>(null);

  // Published Articles Management
  const [publishedArticles, setPublishedArticles] = useState<PublishedNewsArticle[]>([]);
  const [isLoadingPublished, setIsLoadingPublished] = useState<boolean>(false);

  // Available districts for currently selected state
  const availableDistricts = React.useMemo(() => {
    if (!selectedState) return [];
    const stateObj = INDIA_STATES.find(
      (s) => s.name.toLowerCase() === selectedState.toLowerCase() || s.id === selectedState
    );
    return stateObj ? stateObj.districts : [];
  }, [selectedState]);

  // Load published articles
  const fetchPublishedStories = async () => {
    setIsLoadingPublished(true);
    try {
      const res = await fetch("/api/news/published");
      if (res.ok) {
        const data = await res.json();
        setPublishedArticles(data.articles || []);
      }
    } catch (err) {
      console.warn("Could not fetch published articles:", err);
    } finally {
      setIsLoadingPublished(false);
    }
  };

  useEffect(() => {
    if (activeTab === "published-list") {
      fetchPublishedStories();
    }
  }, [activeTab]);

  if (!isEditor) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-rose-500/30 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-400 mb-4">
            The Editor AI Newsroom is exclusively accessible to Editor accounts (editor@infoatlas.app) and Developers.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleGenerateStory = async (customTopic?: string) => {
    const topicText = customTopic || topic;
    if (!topicText.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);
    setPublishedSuccess(null);

    try {
      const res = await fetch("/api/editor/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicText.trim(),
          category,
          targetTab,
          state: selectedState,
          district: selectedDistrict,
          urgency,
          additionalGuidelines,
          userRole: user?.role || "editor",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.draft) {
        throw new Error(data.error || "Failed to generate story draft.");
      }

      const generatedDraft: PublishedNewsArticle = {
        id: `draft_${Date.now()}`,
        title: data.draft.title,
        subtitle: data.draft.subtitle || "",
        description: data.draft.overview,
        overview: data.draft.overview,
        category: data.draft.category || category,
        url: `https://infoatlas.app/stories/preview-${Date.now()}`,
        source: data.draft.suggestedSource || "InfoAtlas Editorial Bureau",
        publishedAt: new Date().toISOString(),
        thumbnail: data.draft.thumbnail,
        targetTab,
        targetState: selectedState,
        targetDistrict: selectedDistrict,
        author: user?.displayName || "Senior Editorial Bureau",
        authorRole: "editor",
        isEditorialExclusive: urgency === "Editorial Exclusive",
        isBreaking: urgency === "Breaking Bulletin",
        sections: data.draft.sections || [],
        keyFacts: data.draft.keyFacts || [],
      };

      setDraftArticle(generatedDraft);
    } catch (err: any) {
      setGenerationError(err.message || "Failed to generate story.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishStory = async () => {
    if (!draftArticle) return;

    setIsPublishing(true);
    try {
      const res = await fetch("/api/news/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article: draftArticle,
          userRole: user?.role || "editor",
          userEmail: user?.email || "editor@infoatlas.app",
          userName: user?.displayName || "InfoAtlas Editor",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to publish article.");
      }

      setPublishedSuccess(data.article);
      setDraftArticle(null);
      setTopic("");
      fetchPublishedStories();
    } catch (err: any) {
      alert("Error publishing story: " + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeletePublished = async (articleId: string) => {
    if (!confirm("Are you sure you want to unpublish this story? It will be removed from all live feeds.")) return;
    try {
      const res = await fetch(`/api/news/published/${articleId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userRole: user?.role || "editor",
        }),
      });
      if (res.ok) {
        setPublishedArticles((prev) => prev.filter((a) => a.id !== articleId));
      }
    } catch (err) {
      console.error("Failed to delete published article:", err);
    }
  };

  // Sample editorial beats for quick inspiration
  const sampleBeats = [
    {
      label: "Surat District Smart Textile Hub",
      topic: "Surat district inaugurates ₹1,200 Cr eco-friendly solar textile technology park",
      category: "Local News",
      tab: "local-news" as const,
      state: "Gujarat",
      district: "Surat",
    },
    {
      label: "ISRO Next-Gen Heavy Rocket",
      topic: "ISRO and global aerospace consortium finalize Next-Gen Heavy Lift Vehicle architecture",
      category: "Space & Defence",
      tab: "news" as const,
      state: "",
      district: "",
    },
    {
      label: "India T20 World Cup Strategy",
      topic: "BCCI announces squad composition and tactical blueprints for upcoming T20 tournament",
      category: "Cricket",
      tab: "cricket" as const,
      state: "",
      district: "",
    },
    {
      label: "Mumbai Coastal Road Phase 2",
      topic: "Mumbai Coastal Road Phase 2 green corridor opened to vehicular traffic with smart tolling",
      category: "Local News",
      tab: "local-news" as const,
      state: "Maharashtra",
      district: "Mumbai",
    },
    {
      label: "AI Semiconductor Fabrication",
      topic: "National Semiconductor Mission approves two new high-yield fab facilities in Dholera and Morigaon",
      category: "Technology",
      tab: "news" as const,
      state: "",
      district: "",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-950 border border-emerald-500/40 shadow-2xl shadow-emerald-950/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-600/30 text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Editor AI Newsroom</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  EDITOR ONLY
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Sparkles className="w-3 h-3" />
                  Full News Synthesis &amp; Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Suggest any beat or topic. Editor AI drafts the complete article and publishes it live to any tab or district.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 bg-slate-950 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("ai-draft")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === "ai-draft"
                ? "bg-slate-900 text-emerald-400 border-emerald-500"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>AI Story Generator &amp; Publisher</span>
          </button>
          <button
            onClick={() => setActiveTab("published-list")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === "published-list"
                ? "bg-slate-900 text-emerald-400 border-emerald-500"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Published Stories ({publishedArticles.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {activeTab === "ai-draft" && (
            <>
              {/* Published Success Banner */}
              {publishedSuccess && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-600/60 text-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <h4 className="text-sm font-bold text-white">Story Successfully Published Live!</h4>
                    </div>
                    {onNavigateToTab && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToTab(publishedSuccess.targetTab, publishedSuccess);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-600/30 cursor-pointer"
                      >
                        <span>View Live in App</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-300">
                    Headline: &quot;{publishedSuccess.title}&quot; is now live in Tab:{" "}
                    <strong className="text-emerald-300 uppercase">{publishedSuccess.targetTab}</strong>
                    {publishedSuccess.targetDistrict && (
                      <span>
                        {" "}
                        (District: {publishedSuccess.targetDistrict}, {publishedSuccess.targetState})
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* SECTION 1: Suggest Topic Form */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Suggest Topic to Editor AI</h3>
                    <p className="text-xs text-slate-400">
                      Provide a story topic or news beat. The AI will write the full investigative or breaking report ready for live publishing.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    Step 1 of 2
                  </span>
                </div>

                {/* Topic Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    News Story Topic / Beat / Angle *
                  </label>
                  <textarea
                    rows={2}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="E.g. Gujarat inaugurates ₹1,200 Cr green solar textile park in Surat district..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                {/* Target Tab, Category & Urgency */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Target App Tab *
                    </label>
                    <select
                      value={targetTab}
                      onChange={(e) => setTargetTab(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="news">Latest News Feed (Top Tab)</option>
                      <option value="local-news">District Local News (750+ Districts)</option>
                      <option value="home">Home Page (Top Stories)</option>
                      <option value="sports">Sports Center</option>
                      <option value="cricket">Cricket Hub</option>
                      <option value="knowledge">Knowledge Base</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. National, Technology, Economy"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Urgency &amp; Badge
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="Editorial Exclusive">⭐ Editorial Exclusive</option>
                      <option value="Breaking Bulletin">🚨 Breaking Bulletin</option>
                      <option value="Standard">Standard Verified Story</option>
                    </select>
                  </div>
                </div>

                {/* Location Targeting (State & District Selector) */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Target Specific Location (Required for District News)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">State / UT (India)</label>
                      <select
                        value={selectedState}
                        onChange={(e) => {
                          setSelectedState(e.target.value);
                          setSelectedDistrict("");
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="">National / All India (No specific state)</option>
                        {INDIA_STATES.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({s.hindiName})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">District</label>
                      <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        disabled={!selectedState || availableDistricts.length === 0}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                      >
                        <option value="">
                          {selectedState ? "All Districts in " + selectedState : "Select State first"}
                        </option>
                        {availableDistricts.map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name} ({d.hindiName})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Quick Topic Presets */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Quick Sample Beats for Immediate Draft
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sampleBeats.map((b, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTopic(b.topic);
                          setCategory(b.category);
                          setTargetTab(b.tab);
                          setSelectedState(b.state);
                          setSelectedDistrict(b.district);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 hover:text-emerald-300 hover:border-emerald-600/40 transition-colors cursor-pointer"
                      >
                        💡 {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex items-center justify-between pt-2">
                  {generationError && (
                    <span className="text-xs text-rose-400">{generationError}</span>
                  )}
                  <button
                    onClick={() => handleGenerateStory()}
                    disabled={isGenerating || !topic.trim()}
                    className="ml-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Editor AI Writing Complete Story...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Full News Article</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* SECTION 2: Story Review, Edit & Live Publish */}
              {draftArticle && (
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/50 shadow-xl space-y-4">
                  <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {urgency}
                        </span>
                        <span className="text-xs text-slate-400">
                          Target: Tab <strong className="text-white uppercase">{draftArticle.targetTab}</strong>
                          {draftArticle.targetDistrict && (
                            <span> | District: <strong className="text-white">{draftArticle.targetDistrict}</strong></span>
                          )}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1">Review &amp; Edit Before Publishing</h3>
                    </div>
                    <button
                      onClick={() => handleGenerateStory()}
                      disabled={isGenerating}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Regenerate</span>
                    </button>
                  </div>

                  {/* Editable Headline */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Headline</label>
                    <input
                      type="text"
                      value={draftArticle.title}
                      onChange={(e) => setDraftArticle({ ...draftArticle, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Editable Subtitle */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={draftArticle.subtitle || ""}
                      onChange={(e) => setDraftArticle({ ...draftArticle, subtitle: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Lead Overview */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Lead Paragraph (Overview)</label>
                    <textarea
                      rows={3}
                      value={draftArticle.overview}
                      onChange={(e) =>
                        setDraftArticle({ ...draftArticle, overview: e.target.value, description: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Body Sections */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-300">
                      Story Sections ({draftArticle.sections?.length || 0})
                    </label>
                    {(draftArticle.sections || []).map((sec, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                        <input
                          type="text"
                          value={sec.heading}
                          onChange={(e) => {
                            const updated = [...(draftArticle.sections || [])];
                            updated[idx].heading = e.target.value;
                            setDraftArticle({ ...draftArticle, sections: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold text-emerald-300"
                        />
                        <textarea
                          rows={3}
                          value={sec.content}
                          onChange={(e) => {
                            const updated = [...(draftArticle.sections || [])];
                            updated[idx].content = e.target.value;
                            setDraftArticle({ ...draftArticle, sections: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 leading-relaxed"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Key Facts */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">Key Facts &amp; Statistics</label>
                    <div className="space-y-1.5">
                      {(draftArticle.keyFacts || []).map((fact, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                          <input
                            type="text"
                            value={fact}
                            onChange={(e) => {
                              const updated = [...(draftArticle.keyFacts || [])];
                              updated[idx] = e.target.value;
                              setDraftArticle({ ...draftArticle, keyFacts: updated });
                            }}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Thumbnail Image URL */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Thumbnail Visual URL</label>
                    <input
                      type="text"
                      value={draftArticle.thumbnail || ""}
                      onChange={(e) => setDraftArticle({ ...draftArticle, thumbnail: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300"
                    />
                  </div>

                  {/* Publish Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <div className="text-xs text-slate-400">
                      Author credit: <strong className="text-white">{draftArticle.author}</strong> ({user?.email})
                    </div>
                    <button
                      onClick={handlePublishStory}
                      disabled={isPublishing}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-emerald-600/40 transition-all cursor-pointer"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Publishing Live to {draftArticle.targetTab}...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Publish Story to {draftArticle.targetTab.toUpperCase()}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB: Published Stories List */}
          {activeTab === "published-list" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Live Published Stories</h3>
                  <p className="text-xs text-slate-400">Articles published through Editor AI live in user feeds</p>
                </div>
                <button
                  onClick={fetchPublishedStories}
                  disabled={isLoadingPublished}
                  className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingPublished ? "animate-spin" : ""}`} />
                </button>
              </div>

              {publishedArticles.length === 0 ? (
                <div className="text-center py-12 rounded-xl bg-slate-900/40 border border-slate-800">
                  <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No stories published yet.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Use the &quot;AI Story Generator&quot; tab to suggest a topic and publish your first article.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {publishedArticles.map((art) => (
                    <div
                      key={art.id}
                      className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                            {art.targetTab}
                          </span>
                          {art.targetDistrict && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300">
                              📍 {art.targetDistrict}, {art.targetState}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500">
                            {new Date(art.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white leading-snug">{art.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-2">{art.overview || art.description}</p>
                        <p className="text-[11px] text-slate-500">By: {art.author || art.publishedByEmail}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {onNavigateToTab && (
                          <button
                            onClick={() => {
                              onClose();
                              onNavigateToTab(art.targetTab, art);
                            }}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                            title="View in Tab"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePublished(art.id)}
                          className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 transition-colors cursor-pointer"
                          title="Unpublish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Editor Account: {user?.email || "editor@infoatlas.app"}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
