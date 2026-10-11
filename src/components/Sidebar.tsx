import React from "react";
import { Home, Newspaper, Trophy, Award, Bookmark, History, Globe, Atom, Cpu, HeartPulse, Briefcase, Film, GraduationCap, Leaf, Compass, Lightbulb } from "lucide-react";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: "home" | "news" | "sports" | "cricket" | "bookmarks" | "history" | "knowledge") => void;
  onCategorySelect: (category: string) => void;
  isDark: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const MAIN_NAV = [
  { id: "home", label: "Home", icon: Home },
  { id: "knowledge", label: "Knowledge", icon: Compass },
  { id: "news", label: "News", icon: Newspaper },
  { id: "sports", label: "Sports", icon: Trophy },
  { id: "cricket", label: "Cricket", icon: Award },
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { id: "history", label: "History", icon: History },
];

const EXPLORE_CATEGORIES = [
  { id: "world", label: "World", icon: Globe },
  { id: "science", label: "Science", icon: Atom },
  { id: "technology", label: "Technology", icon: Cpu },
  { id: "health", label: "Health", icon: HeartPulse },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "entertainment", label: "Entertainment", icon: Film },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "environment", label: "Environment", icon: Leaf },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onCategorySelect,
  isDark,
  isOpenMobile,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden"
        />
      )}

      <aside className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-60 shrink-0 flex flex-col justify-between border-r overflow-y-auto transition-transform duration-300 ${
        isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-[#E0E9FA] text-[#102B59]"
      } ${isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-4 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            {MAIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
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
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <hr className={`border-t ${isDark ? "border-slate-800/80" : "border-[#E0E9FA]"}`} />

          {/* Explore Section */}
          <div>
            <h4 className="px-3.5 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#386BFF]">
              Explore
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
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Access Helper at Bottom */}
        <div className={`p-4 m-3 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-[#F5F8FF] border-[#E0E9FA]"}`}>
          <div className="flex items-center gap-2 mb-1.5 text-[#386BFF]">
            <Lightbulb className="w-4 h-4" />
            <span className="text-xs font-bold">InfoAtlas Pro Tip</span>
          </div>
          <p className="text-[11px] text-[#60769A] leading-relaxed">
            Use the global search bar to instantly query encyclopedia facts and breaking news simultaneously.
          </p>
        </div>
      </aside>
    </>
  );
};
