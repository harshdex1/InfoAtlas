import React, { useState } from "react";
import { Search, Sparkles } from "lucide-react";

interface WelcomeBannerProps {
  onSearchSubmit: (query: string) => void;
  isDark: boolean;
}

const POPULAR_TAGS = ["Artificial Intelligence", "World News", "Cricket", "Space Exploration", "Health & Medicine", "Quantum Computing"];

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ onSearchSubmit, isDark }) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearchSubmit(query.trim());
      setQuery("");
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 mb-6 border shadow-xl ${
      isDark
        ? "bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border-indigo-500/20 text-white"
        : "bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 border-indigo-500/30 text-white"
    }`}>
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.25),transparent_50%)] pointer-events-none" />

      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Knowledge & News Gateway</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
          Welcome to InfoAtlas
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
          Your intelligent gateway to verified knowledge, original sources, and real-time global news.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="flex items-center rounded-2xl border bg-slate-950/80 border-slate-700/80 p-1.5 shadow-lg mb-4">
          <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for anything (e.g. Black holes, Global economy)..."
            className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md shrink-0 cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Popular Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium">Popular:</span>
          {POPULAR_TAGS.map((tag, i) => (
            <button
              key={i}
              onClick={() => onSearchSubmit(tag)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-white transition-all border border-slate-700/50 cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
