import React from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  Home,
  Newspaper,
  Trophy,
  Award,
  Bookmark,
  History,
  Globe,
  Atom,
  Cpu,
  HeartPulse,
  Briefcase,
  Film,
  GraduationCap,
  Leaf,
  Compass,
  Lightbulb,
  MessageSquareCode,
  MapPin,
  Sparkles,
  Mail,
  User as UserIcon,
  Code2,
  FileText,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { InfoAtlasLogo } from "./InfoAtlasLogo";
import { LanguageSelector } from "./LanguageSelector";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: "home" | "news" | "local-news" | "sports" | "cricket" | "gmail" | "bookmarks" | "history" | "knowledge" | "contact") => void;
  onCategorySelect: (category: string) => void;
  isDark: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenAI?: () => void;
  onOpenProfile?: () => void;
  onOpenDeveloperStudio?: () => void;
  onOpenEditorNewsroom?: () => void;
}

const MAIN_NAV = [
  { id: "home", labelKey: "home", defaultLabel: "Home", icon: Home },
  { id: "local-news", labelKey: "local_news", defaultLabel: "State & District", icon: MapPin },
  { id: "news", labelKey: "news", defaultLabel: "Latest News", icon: Newspaper },
  { id: "gmail", labelKey: "gmail", defaultLabel: "Gmail", icon: Mail },
  { id: "knowledge", labelKey: "knowledge", defaultLabel: "Knowledge", icon: Compass },
  { id: "sports", labelKey: "sports", defaultLabel: "Sports", icon: Trophy },
  { id: "cricket", labelKey: "cricket", defaultLabel: "Cricket", icon: Award },
  { id: "bookmarks", labelKey: "bookmarks", defaultLabel: "Bookmarks", icon: Bookmark },
  { id: "history", labelKey: "history", defaultLabel: "History", icon: History },
  { id: "profile", labelKey: "profile_title", defaultLabel: "User Profile", icon: UserIcon },
  { id: "contact", labelKey: "contact", defaultLabel: "Contact Developer", icon: MessageSquareCode },
];

const EXPLORE_CATEGORIES = [
  { id: "world", key: "cat_world", defaultLabel: "World", icon: Globe },
  { id: "science", key: "cat_science", defaultLabel: "Science", icon: Atom },
  { id: "technology", key: "cat_technology", defaultLabel: "Technology", icon: Cpu },
  { id: "health", key: "cat_health", defaultLabel: "Health", icon: HeartPulse },
  { id: "business", key: "cat_business", defaultLabel: "Business", icon: Briefcase },
  { id: "entertainment", key: "cat_entertainment", defaultLabel: "Entertainment", icon: Film },
  { id: "education", key: "cat_education", defaultLabel: "Education", icon: GraduationCap },
  { id: "environment", key: "cat_environment", defaultLabel: "Environment", icon: Leaf },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onCategorySelect,
  isDark,
  isOpenMobile,
  onCloseMobile,
  onOpenAI,
  onOpenProfile,
  onOpenDeveloperStudio,
  onOpenEditorNewsroom,
}) => {
  const { t } = useLanguage();
  const { user, isDeveloper, isEditor } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden"
        />
      )}

      <aside className={`fixed md:sticky top-[106px] left-0 z-40 h-[calc(100vh-106px)] w-60 shrink-0 flex flex-col justify-between border-r overflow-y-auto transition-transform duration-300 ${
        isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-[#E0E9FA] text-[#102B59]"
      } ${isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-4 space-y-5">
          {/* Brand Logo in Sidebar */}
          <div className="px-2 pt-1 pb-2 flex items-center justify-between border-b border-[#E0E9FA] dark:border-slate-800/80">
            <button
              onClick={() => {
                onNavigate("home");
                onCloseMobile();
              }}
              className="flex items-center gap-2 group cursor-pointer text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              title="InfoAtlas Home"
            >
              <InfoAtlasLogo
                variant="full"
                size="sm"
                animated
                isDark={isDark}
                withTagline={false}
              />
            </button>
          </div>

          {/* AI Role Portals: Developer & Editor */}
          {isDeveloper && onOpenDeveloperStudio && (
            <button
              type="button"
              onClick={() => {
                onOpenDeveloperStudio();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/50 cursor-pointer shadow-sm shadow-indigo-950/50"
            >
              <Code2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Developer AI Studio</span>
            </button>
          )}

          {isEditor && onOpenEditorNewsroom && (
            <button
              type="button"
              onClick={() => {
                onOpenEditorNewsroom();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 cursor-pointer shadow-sm shadow-emerald-950/50"
            >
              <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Editor AI Newsroom</span>
            </button>
          )}

          {/* AI Assistant Quick Access in Sidebar */}
          {onOpenAI && (
            <button
              type="button"
              onClick={() => {
                onOpenAI();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-blue-600/10 hover:from-violet-600/20 hover:to-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span>{t("ai_assistant", "AI Assistant")}</span>
            </button>
          )}

          {/* Main Navigation */}
          <div className="space-y-1">
            {MAIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === "profile") {
                      if (onOpenProfile) onOpenProfile();
                      onCloseMobile();
                      return;
                    }
                    onNavigate(item.id as any);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-[#386BFF] to-[#7252FF] text-white shadow-md shadow-blue-500/20"
                      : isDark
                      ? "hover:bg-slate-900 text-slate-400 hover:text-white"
                      : "hover:bg-[#F5F8FF] text-[#60769A] hover:text-[#102B59]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#386BFF] group-hover:text-blue-600"}`} />
                  <span>{t(item.labelKey, item.defaultLabel)}</span>
                </button>
              );
            })}
          </div>

          <hr className={`border-t ${isDark ? "border-slate-800/80" : "border-[#E0E9FA]"}`} />

          {/* Explore Section */}
          <div>
            <h4 className="px-3.5 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#386BFF]">
              {t("explore", "Explore")}
            </h4>
            <div className="space-y-1">
              {EXPLORE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onCategorySelect(cat.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                      isDark
                        ? "hover:bg-slate-900 text-slate-400 hover:text-white"
                        : "hover:bg-[#F5F8FF] text-[#60769A] hover:text-[#102B59]"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-[#386BFF] transition-colors" />
                    <span>{t(cat.key, cat.defaultLabel)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer with Profile, Language, and Tip */}
        <div className="p-3 space-y-2">
          {/* User Profile Quick Card */}
          {onOpenProfile && (
            <button
              type="button"
              onClick={() => {
                onOpenProfile();
                onCloseMobile();
              }}
              className={`w-full p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 transition-all cursor-pointer group text-left ${
                isDark
                  ? "bg-slate-900/90 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850"
                  : "bg-white border-[#E0E9FA] hover:border-[#386BFF]/50 hover:bg-slate-50 shadow-xs"
              }`}
              title="Open User Profile & Settings"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#386BFF] to-[#7252FF] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block truncate group-hover:text-[#386BFF] transition-colors">
                    {user?.displayName || "My Profile"}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    Profile & Settings
                  </span>
                </div>
              </div>
              <UserIcon className="w-4 h-4 text-slate-400 group-hover:text-[#386BFF] shrink-0" />
            </button>
          )}

          {/* Mobile Language Switcher Row */}
          <div className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-[#E0E9FA]"}`}>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Globe className="w-4 h-4 text-[#386BFF]" />
              <span>{t("language", "Language")}</span>
            </div>
            <LanguageSelector isDark={isDark} variant="compact" />
          </div>

          {/* Quick Access Helper at Bottom */}
          <div className={`p-3.5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-[#F5F8FF] border-[#E0E9FA]"}`}>
            <div className="flex items-center gap-2 mb-1 text-[#386BFF]">
              <Lightbulb className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">InfoAtlas Pro Tip</span>
            </div>
            <p className="text-[11px] text-[#60769A] leading-relaxed">
              {t("ask_follow_up_subtitle", "Ask InfoAtlas AI any question about this article for deeper context, background, or explanation.")}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
