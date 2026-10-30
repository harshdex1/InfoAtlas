import React from "react";
import { Flame, Globe, Atom, Cpu, Trophy, HeartPulse, Landmark, TrendingUp, CloudSun } from "lucide-react";
import { NewsArticle } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface RightPanelProps {
  breakingArticles: NewsArticle[];
  onCategorySelect: (cat: string) => void;
  onTopicSearch: (topic: string) => void;
  isDark: boolean;
}

const CATEGORY_TILES = [
  { id: "world", label: "World", image: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=400&auto=format&fit=crop&q=60" },
  { id: "india", label: "India", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&auto=format&fit=crop&q=60" },
  { id: "technology", label: "Technology", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=60" },
  { id: "sports", label: "Sports", image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop&q=60" },
  { id: "science", label: "Science", image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400&auto=format&fit=crop&q=60" },
  { id: "health", label: "Health", image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&auto=format&fit=crop&q=60" },
];

const TRENDING_TOPICS = [
  { rank: 1, name: "Artificial Intelligence", trend: "+45%" },
  { rank: 2, name: "ICC Champions Trophy", trend: "+32%" },
  { rank: 3, name: "Quantum Computing", trend: "+28%" },
  { rank: 4, name: "Space Exploration", trend: "+19%" },
  { rank: 5, name: "Global Economy", trend: "+12%" },
];

const formatSafeTime = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return "";
  }
};

export const RightPanel: React.FC<RightPanelProps> = ({
  breakingArticles,
  onCategorySelect,
  onTopicSearch,
  isDark,
}) => {
  const { t } = useLanguage();
  const safeBreaking = Array.isArray(breakingArticles) ? breakingArticles : [];

  const getCatLabel = (id: string, fallback: string) => {
    switch (id) {
      case "world": return t("cat_world", fallback);
      case "india": return t("cat_india", fallback);
      case "technology": return t("cat_technology", fallback);
      case "sports": return t("sports", fallback);
      case "science": return t("cat_science", fallback);
      case "health": return t("cat_health", fallback);
      default: return fallback;
    }
  };

  return (
    <aside className="space-y-6 w-full min-w-0 max-w-full">
      {/* Breaking News Card */}
      <div className={`p-5 rounded-3xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-[#E0E9FA] shadow-sm"}`}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E0E9FA]">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
            <Flame className="w-4 h-4 animate-pulse" />
            <span>{t("breaking_news_title", "Breaking News")}</span>
          </div>
          <span className="text-[10px] text-[#60769A]">{t("live_feed", "Live Feed")}</span>
        </div>

        <div className="space-y-3.5">
          {safeBreaking.slice(0, 3).map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="block group cursor-pointer"
            >
              <div className="flex items-center justify-between text-[10px] text-[#60769A] mb-1">
                <span className="font-semibold text-[#386BFF]">{item.source}</span>
                <span>{formatSafeTime(item.publishedAt)}</span>
              </div>
              <h4 className={`text-xs font-bold leading-snug group-hover:text-[#386BFF] transition-colors line-clamp-2 ${isDark ? "text-slate-200" : "text-[#102B59]"}`}>
                {item.title}
              </h4>
            </a>
          ))}
          {safeBreaking.length === 0 && (
            <p className="text-xs text-[#60769A] py-3 text-center">{t("no_breaking_news", "No active breaking news alerts right now.")}</p>
          )}
        </div>
      </div>

      {/* Top Categories Image Tiles */}
      <div className={`p-5 rounded-3xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-[#E0E9FA] shadow-sm"}`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? "text-white" : "text-[#102B59]"}`}>
          {t("top_categories", "Top Categories")}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORY_TILES.map((cat, i) => (
            <button
              key={i}
              onClick={() => onCategorySelect(cat.id)}
              className="relative h-20 rounded-2xl overflow-hidden group cursor-pointer border border-[#E0E9FA]"
            >
              <img src={cat.image} alt={cat.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <span className="absolute bottom-2 left-2.5 text-[11px] font-bold text-white tracking-wide">
                {getCatLabel(cat.id, cat.label)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <div className={`p-5 rounded-3xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-[#E0E9FA] shadow-sm"}`}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[#386BFF]" />
          <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-[#102B59]"}`}>
            {t("trending_topics", "Trending Topics")}
          </h3>
        </div>

        <div className="space-y-2.5">
          {TRENDING_TOPICS.map((topic) => (
            <button
              key={topic.rank}
              onClick={() => onTopicSearch(topic.name)}
              className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors group cursor-pointer ${
                isDark ? "hover:bg-slate-800/60 text-slate-300" : "hover:bg-[#F5F8FF] text-[#102B59]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#386BFF] w-4">{topic.rank}</span>
                <span className="font-medium group-hover:text-[#386BFF] transition-colors">{topic.name}</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                {topic.trend}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Weather Card */}
      <div className={`p-5 rounded-3xl border bg-gradient-to-br from-[#386BFF]/10 via-white to-[#7252FF]/10 ${isDark ? "bg-slate-900 border-slate-800" : "border-[#E0E9FA] shadow-sm"}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-amber-500" />
            <span className={`text-xs font-bold ${isDark ? "text-white" : "text-[#102B59]"}`}>New Delhi, India</span>
          </div>
          <span className="text-[10px] text-[#386BFF] font-semibold">Live</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <span className={`text-3xl font-extrabold ${isDark ? "text-white" : "text-[#102B59]"}`}>28°C</span>
            <p className="text-[11px] text-[#60769A] mt-0.5">Clear sky & sunny</p>
          </div>
          <div className="text-right text-[10px] text-[#60769A]">
            <p>Humidity: 42%</p>
            <p>Wind: 12 km/h</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
