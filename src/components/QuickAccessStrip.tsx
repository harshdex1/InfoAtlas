import React from "react";
import { Compass, Newspaper, Sparkles, Bookmark, History } from "lucide-react";

interface QuickAccessStripProps {
  onNavigate: (view: "home" | "news" | "bookmarks" | "history") => void;
  onOpenAI: () => void;
  isDark: boolean;
}

const ITEMS = [
  { id: "knowledge", label: "Knowledge", desc: "Explore encyclopedia facts", icon: Compass, color: "from-blue-500 to-cyan-600", action: "home" },
  { id: "news", label: "News", desc: "Read latest live updates", icon: Newspaper, color: "from-indigo-500 to-violet-600", action: "news" },
  { id: "ai", label: "AI Assistant", desc: "Get smart explanations", icon: Sparkles, color: "from-violet-500 to-purple-600", action: "ai" },
  { id: "bookmarks", label: "Bookmarks", desc: "Access saved articles", icon: Bookmark, color: "from-amber-500 to-orange-600", action: "bookmarks" },
  { id: "history", label: "History", desc: "Revisit recent activity", icon: History, color: "from-emerald-500 to-teal-600", action: "history" },
];

export const QuickAccessStrip: React.FC<QuickAccessStripProps> = ({ onNavigate, onOpenAI, isDark }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {ITEMS.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            onClick={() => {
              if (item.action === "ai") {
                onOpenAI();
              } else {
                onNavigate(item.action as any);
              }
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
              isDark
                ? "bg-slate-900/60 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900"
                : "bg-white border-slate-200 hover:border-indigo-500/50 hover:shadow-lg"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className={`text-xs font-bold block mb-0.5 ${isDark ? "text-white" : "text-slate-900"} group-hover:text-indigo-400 transition-colors`}>
                {item.label}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">{item.desc}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
