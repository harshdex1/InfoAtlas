import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useAppConfig } from "../context/AppConfigContext";
import {
  Code2,
  Sparkles,
  Terminal,
  Sliders,
  Bell,
  Palette,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
  Loader2,
  X,
  Layers,
  History,
  Radio,
  ExternalLink,
  Plus,
  Trash2,
  Play,
} from "lucide-react";

interface DeveloperStudioModalProps {
  onClose: () => void;
  isDark?: boolean;
}

export const DeveloperStudioModal: React.FC<DeveloperStudioModalProps> = ({ onClose, isDark = true }) => {
  const { user, isDeveloper } = useAuth();
  const { config, updateConfig, executeDeveloperAi, refreshConfig } = useAppConfig();

  const [activeTab, setActiveTab] = useState<"ai-copilot" | "controls" | "features" | "banner" | "changelog">("ai-copilot");
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isAiExecuting, setIsAiExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<{
    summary?: string;
    explanation?: string;
    error?: string;
  } | null>(null);

  // Manual edits state
  const [bannerText, setBannerText] = useState(config.announcementBanner.text || "");
  const [bannerBadge, setBannerBadge] = useState(config.announcementBanner.badgeText || "Live Feed");
  const [bannerEnabled, setBannerEnabled] = useState(config.announcementBanner.enabled);
  const [bannerVariant, setBannerVariant] = useState(config.announcementBanner.variant || "primary");
  const [appTagline, setAppTagline] = useState(config.appTagline || "");
  const [selectedAccent, setSelectedAccent] = useState(config.accentColor || "indigo");
  const [newAlertText, setNewAlertText] = useState("");
  const [newCategoryText, setNewCategoryText] = useState("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  if (!isDeveloper) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-rose-500/30 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-400 mb-4">
            The Developer AI Console is exclusively restricted to Developer accounts (developer@infoatlas.app).
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

  const handleRunAiCopilot = async (promptToRun?: string) => {
    const text = promptToRun || aiPrompt;
    if (!text.trim()) return;

    setIsAiExecuting(true);
    setExecutionResult(null);

    const res = await executeDeveloperAi(text.trim());
    setIsAiExecuting(false);

    if (res.success) {
      setExecutionResult({
        summary: res.summary,
        explanation: res.explanation,
      });
      setAiPrompt("");
      // Sync local form states
      refreshConfig();
    } else {
      setExecutionResult({
        error: res.error || "Failed to execute instruction.",
      });
    }
  };

  const handleSaveManualControls = async () => {
    setSaveStatus("Saving changes...");
    const ok = await updateConfig({
      appTagline,
      accentColor: selectedAccent as any,
      announcementBanner: {
        ...config.announcementBanner,
        enabled: bannerEnabled,
        text: bannerText,
        badgeText: bannerBadge,
        variant: bannerVariant as any,
      },
    });

    if (ok) {
      setSaveStatus("Settings saved live!");
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      setSaveStatus("Failed to save changes.");
    }
  };

  const handleToggleFeature = async (featureKey: keyof typeof config.featureToggles) => {
    const updatedFeatures = {
      ...config.featureToggles,
      [featureKey]: !config.featureToggles[featureKey],
    };
    await updateConfig({ featureToggles: updatedFeatures });
  };

  const handleAddAlert = async () => {
    if (!newAlertText.trim()) return;
    const updatedAlerts = [newAlertText.trim(), ...(config.breakingAlerts || [])];
    await updateConfig({ breakingAlerts: updatedAlerts });
    setNewAlertText("");
  };

  const handleRemoveAlert = async (index: number) => {
    const updatedAlerts = (config.breakingAlerts || []).filter((_, idx) => idx !== index);
    await updateConfig({ breakingAlerts: updatedAlerts });
  };

  const handleAddCategory = async () => {
    if (!newCategoryText.trim()) return;
    const updatedCats = Array.from(new Set([...(config.customCategories || []), newCategoryText.trim()]));
    await updateConfig({ customCategories: updatedCats });
    setNewCategoryText("");
  };

  const handleRemoveCategory = async (cat: string) => {
    const updatedCats = (config.customCategories || []).filter((c) => c !== cat);
    await updateConfig({ customCategories: updatedCats });
  };

  const quickPrompts = [
    "Switch theme accent to emerald and update tagline to 'India's Premier Real-Time Intelligence Grid'",
    "Turn on an amber announcement banner for 'Severe Weather Advisory: Monitoring Coastal Districts'",
    "Add 'Defence & Aerospace' and 'Semiconductors' to custom news categories",
    "Add a high-priority breaking ticker: 'Cabinet approves ₹10,000 Crore AI Innovation Mission'",
    "Set theme accent to cyan and enable all feature toggles",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-950 border border-indigo-500/40 shadow-2xl shadow-indigo-950/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Developer AI Studio</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  DEVELOPER ONLY
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Control
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Autonomous AI engine that alters live app configurations, features, banners &amp; styling.
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 bg-slate-950 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("ai-copilot")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "ai-copilot"
                ? "bg-slate-900 text-indigo-400 border-indigo-500"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Developer AI Copilot</span>
          </button>
          <button
            onClick={() => setActiveTab("banner")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "banner"
                ? "bg-slate-900 text-indigo-400 border-indigo-500"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Banner &amp; Branding</span>
          </button>
          <button
            onClick={() => setActiveTab("features")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "features"
                ? "bg-slate-900 text-indigo-400 border-indigo-500"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Feature Toggles</span>
          </button>
          <button
            onClick={() => setActiveTab("controls")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "controls"
                ? "bg-slate-900 text-indigo-400 border-indigo-500"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Alerts &amp; Categories</span>
          </button>
          <button
            onClick={() => setActiveTab("changelog")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "changelog"
                ? "bg-slate-900 text-indigo-400 border-indigo-500"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Changelog ({config.changeLog?.length || 0})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {/* TAB 1: AI COPILOT */}
          {activeTab === "ai-copilot" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40">
                <div className="flex items-start gap-3">
                  <Terminal className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">
                      Natural Language App Modification Engine
                    </h3>
                    <p className="text-xs text-indigo-200/80 leading-relaxed">
                      As the Developer, you can instruct this AI to modify anything across InfoAtlas. It directly updates live configuration, toggles entire modules, switches branding, alters theme colors, and injects emergency alerts without manual coding.
                    </p>
                  </div>
                </div>
              </div>

              {/* Prompt Input */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Developer Command / Instruction
                </label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleRunAiCopilot();
                    }
                  }}
                  placeholder="E.g. Switch theme accent to emerald, turn on announcement banner for Election Coverage, and add breaking ticker for Chandrayaan updates..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                />

                {/* Action button placed outside the writing box */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">Enter</kbd> or click button
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRunAiCopilot()}
                    disabled={isAiExecuting || !aiPrompt.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
                  >
                    {isAiExecuting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Executing Changes...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Apply Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Prompts */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Developer Actions
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAiPrompt(q);
                        handleRunAiCopilot(q);
                      }}
                      disabled={isAiExecuting}
                      className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left text-xs text-slate-300 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      ⚡ {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Execution Output */}
              {executionResult && (
                <div
                  className={`p-4 rounded-xl border ${
                    executionResult.error
                      ? "bg-rose-950/30 border-rose-800/50 text-rose-300"
                      : "bg-emerald-950/30 border-emerald-800/50 text-emerald-300"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {executionResult.error ? (
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">
                        {executionResult.error ? "Execution Error" : "Changes Executed Successfully"}
                      </h4>
                      {executionResult.summary && (
                        <p className="text-xs font-semibold text-emerald-200">
                          {executionResult.summary}
                        </p>
                      )}
                      {executionResult.explanation && (
                        <p className="text-xs text-slate-300 leading-relaxed pt-1">
                          {executionResult.explanation}
                        </p>
                      )}
                      {executionResult.error && (
                        <p className="text-xs text-rose-300">{executionResult.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BANNER & BRANDING */}
          {activeTab === "banner" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Global Announcement Banner</h3>
                    <p className="text-xs text-slate-400">Display high-visibility message across all user sessions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bannerEnabled}
                      onChange={(e) => setBannerEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:width-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Banner Headline / Text</label>
                  <input
                    type="text"
                    value={bannerText}
                    onChange={(e) => setBannerText(e.target.value)}
                    placeholder="Welcome to InfoAtlas..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={bannerBadge}
                      onChange={(e) => setBannerBadge(e.target.value)}
                      placeholder="Live Feed"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Color Variant</label>
                    <select
                      value={bannerVariant}
                      onChange={(e) => setBannerVariant(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="primary">Primary (Indigo / Violet)</option>
                      <option value="amber">Amber (Warning / Alert)</option>
                      <option value="emerald">Emerald (Success / Live)</option>
                      <option value="rose">Rose (Urgent / Breaking)</option>
                      <option value="cyan">Cyan (Tech / Special)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* App Tagline & Theme Accent */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white">App Branding &amp; Accent Palette</h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">App Primary Tagline</label>
                  <input
                    type="text"
                    value={appTagline}
                    onChange={(e) => setAppTagline(e.target.value)}
                    placeholder="Global Knowledge & Real-Time Intelligence"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Accent Color</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { id: "indigo", label: "Indigo", bg: "bg-indigo-600" },
                      { id: "emerald", label: "Emerald", bg: "bg-emerald-600" },
                      { id: "cyan", label: "Cyan", bg: "bg-cyan-600" },
                      { id: "violet", label: "Violet", bg: "bg-violet-600" },
                      { id: "rose", label: "Rose", bg: "bg-rose-600" },
                      { id: "amber", label: "Amber", bg: "bg-amber-600" },
                    ].map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setSelectedAccent(col.id as any)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                          selectedAccent === col.id
                            ? "bg-slate-800 border-white text-white shadow-lg"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${col.bg}`}></span>
                        <span>{col.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-emerald-400 font-semibold">{saveStatus}</span>
                <button
                  type="button"
                  onClick={handleSaveManualControls}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  Save Branding Changes
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: FEATURE TOGGLES */}
          {activeTab === "features" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <h3 className="text-sm font-bold text-white mb-1">Live Feature Toggles</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Enable or disable application modules in real time. Changes take effect instantly for all connected clients.
                </p>

                <div className="divide-y divide-slate-800">
                  {[
                    { key: "cricket", name: "Cricket Live Hub", desc: "Live match scorecards, ball-by-ball updates and cricket series" },
                    { key: "sports", name: "Sports Center", desc: "Global athletics, football, tennis, and international sports desk" },
                    { key: "localNews", name: "District Local News", desc: "Granular local district news covering 750+ Indian districts" },
                    { key: "gmail", name: "Gmail Workspace Integration", desc: "OAuth-authenticated Gmail inbox, unread counts and message viewer" },
                    { key: "knowledge", name: "AI Knowledge Base", desc: "Encyclopedic multi-source synthesis, deep-dives and follow-up engines" },
                    { key: "aiAssistant", name: "Floating AI Assistant", desc: "InfoAtlas conversational intelligence assistant modal" },
                    { key: "breakingTicker", name: "Breaking News Ticker", desc: "Live scrolling alert ticker on the top navigation bar" },
                  ].map((feat) => {
                    const isEnabled = config.featureToggles[feat.key as keyof typeof config.featureToggles] !== false;
                    return (
                      <div key={feat.key} className="py-3.5 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-white">{feat.name}</h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isEnabled
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {isEnabled ? "ACTIVE" : "DISABLED"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{feat.desc}</p>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => handleToggleFeature(feat.key as any)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ALERTS & CATEGORIES */}
          {activeTab === "controls" && (
            <div className="space-y-5">
              {/* Breaking Alerts Manager */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white">Breaking News Ticker Alerts</h3>
                <p className="text-xs text-slate-400">Add or remove alerts shown in the live ticker across the app</p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newAlertText}
                      onChange={(e) => setNewAlertText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddAlert();
                        }
                      }}
                      placeholder="Enter urgent bulletin text (e.g. Weather warning, breaking policy announcement)..."
                      className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAlert}
                    disabled={!newAlertText.trim()}
                    className="h-11 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center justify-center gap-2 shrink-0 shadow-md shadow-indigo-600/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Add Alert</span>
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  {(config.breakingAlerts || []).map((alert, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80 gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                        <p className="text-xs text-slate-200 truncate">{alert}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveAlert(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Categories Manager */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Custom Categories &amp; News Beats</h3>
                    <p className="text-xs text-slate-400">Curate news category tabs and editorial beats available to readers</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0">
                    {(config.customCategories || []).length} Categories
                  </span>
                </div>

                {/* Input and Add Category Button Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newCategoryText}
                      onChange={(e) => setNewCategoryText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                      placeholder="e.g. Space Exploration, Defence, Semiconductors, Clean Tech..."
                      className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCategoryText.trim()}
                    className="h-11 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center justify-center gap-2 shrink-0 shadow-md shadow-indigo-600/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Add Category</span>
                  </button>
                </div>

                {/* Quick Add Suggestions */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Quick Suggestion Beats
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {["Semiconductors", "Defence & Aero", "Space Exploration", "Clean Energy", "Geopolitics", "AI & Robotics", "Fintech"]
                      .filter((s) => !(config.customCategories || []).includes(s))
                      .map((sugg) => (
                        <button
                          key={sugg}
                          type="button"
                          onClick={async () => {
                            const updated = Array.from(new Set([...(config.customCategories || []), sugg]));
                            await updateConfig({ customCategories: updated });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-[11px] text-slate-300 hover:text-indigo-300 transition-all cursor-pointer"
                        >
                          + {sugg}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Active Categories List */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Active Categories ({config.customCategories?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(config.customCategories || []).map((cat) => (
                      <div
                        key={cat}
                        className="group flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800/90 hover:border-slate-700 text-xs font-medium text-slate-200 transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(cat)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title={`Remove ${cat}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CHANGELOG */}
          {activeTab === "changelog" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">System Audit &amp; Modification Log</h3>
                <span className="text-xs text-slate-400">Updated {new Date(config.updatedAt).toLocaleTimeString()}</span>
              </div>

              <div className="divide-y divide-slate-800 rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
                {(config.changeLog || []).map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-white">{item.summary}</p>
                      <p className="text-[11px] text-slate-400">By: {item.changedBy}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {new Date(item.timestamp).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Developer Account: {user?.email || "developer@infoatlas.app"}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                try {
                  if (typeof window !== "undefined") {
                    window.sessionStorage.removeItem("infoatlas_session_splash_shown");
                  }
                } catch {}
                window.dispatchEvent(new CustomEvent("infoatlas_replay_splash"));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/40 text-cyan-300 text-xs font-medium transition-colors cursor-pointer"
              title="Replay the cinematic startup animation"
            >
              <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
              <span>Replay Opening</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
