import React, { useState } from "react";
import { Search, Sparkles, BookOpen, Compass, Atom, Cpu, Landmark, Globe, Calculator, Rocket, HeartPulse, Palette, Trophy, BookMarked, BrainCircuit, Coins } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface HomeProps {
  onSearchSubmit: (query: string) => void;
  onSelectArticle: (title: string) => void;
  isDark: boolean;
}

const CATEGORIES = [
  { name: "Science", icon: Atom, query: "Scientific method", color: "from-cyan-500 to-blue-600" },
  { name: "Technology", icon: Cpu, query: "Emerging technologies", color: "from-indigo-500 to-violet-600" },
  { name: "History", icon: Landmark, query: "World history", color: "from-amber-500 to-orange-600" },
  { name: "Geography", icon: Globe, query: "Geography of Earth", color: "from-emerald-500 to-teal-600" },
  { name: "Mathematics", icon: Calculator, query: "Mathematics", color: "from-blue-600 to-indigo-700" },
  { name: "Space & Astronomy", icon: Rocket, query: "Astronomy and space exploration", color: "from-purple-600 to-indigo-900" },
  { name: "Health & Medicine", icon: HeartPulse, query: "Human medicine", color: "from-rose-500 to-pink-600" },
  { name: "Philosophy", icon: BrainCircuit, query: "Philosophy", color: "from-violet-500 to-purple-700" },
  { name: "Economics", icon: Coins, query: "Economics", color: "from-amber-600 to-yellow-600" },
  { name: "Art & Culture", icon: Palette, query: "Art history", color: "from-pink-500 to-rose-600" },
  { name: "Sports", icon: Trophy, query: "Sports", color: "from-teal-500 to-emerald-700" },
  { name: "Literature", icon: BookOpen, query: "World literature", color: "from-blue-400 to-cyan-600" },
];

const DISCOVERY_TOPICS = [
  { title: "Artificial Intelligence", desc: "Machine learning, neural networks, and generative models.", query: "Artificial intelligence" },
  { title: "Quantum Mechanics", desc: "Fundamental theory in physics providing description of nature.", query: "Quantum mechanics" },
  { title: "Ancient Rome", desc: "Civilization that grew from a small agricultural community.", query: "Ancient Rome" },
  { title: "Black Hole", desc: "Region of spacetime where gravity prevents anything from escaping.", query: "Black hole" },
];

export const Home: React.FC<HomeProps> = ({ onSearchSubmit, onSelectArticle, isDark }) => {
  const [searchInput, setSearchInput] = useState("");
  const { history, recentlyViewed } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchSubmit(searchInput.trim());
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6 animate-bounce-slow">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Global Knowledge Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            Explore Everything. <br />
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 bg-clip-text text-transparent">
              Understand Anything.
            </span>
          </h1>

          <p className={`text-base sm:text-lg mb-10 max-w-2xl mx-auto ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Discover reliable knowledge, explore original sources, and understand complex ideas instantly with AI-powered explanations.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto shadow-2xl rounded-2xl">
            <div className={`flex items-center rounded-2xl border transition-all p-2 ${
              isDark ? "bg-slate-900/90 border-slate-700 focus-within:border-indigo-500" : "bg-white border-slate-300 focus-within:border-indigo-500"
            }`}>
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search any topic, person, place, or idea..."
                className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none placeholder-slate-400"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 shrink-0 cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            Explore Categories
          </h2>
          <span className="text-xs text-indigo-400 font-medium">12 Knowledge Domains</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <button
                key={idx}
                onClick={() => onSearchSubmit(cat.query)}
                className={`p-5 rounded-2xl border text-left transition-all group flex flex-col justify-between h-36 cursor-pointer ${
                  isDark
                    ? "bg-slate-900/60 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900"
                    : "bg-white border-slate-200 hover:border-indigo-500/50 hover:shadow-lg"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${cat.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className={`text-xs font-semibold block ${isDark ? "text-white" : "text-slate-900"} group-hover:text-indigo-400 transition-colors`}>
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Explore topic</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Discovery / Curated Topics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            Featured Discoveries
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DISCOVERY_TOPICS.map((topic, idx) => (
            <div
              key={idx}
              onClick={() => onSearchSubmit(topic.query)}
              className={`p-6 rounded-2xl border transition-all cursor-pointer group ${
                isDark
                  ? "bg-slate-900/50 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900"
                  : "bg-white border-slate-200 hover:border-indigo-500/50 hover:shadow-lg"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider block mb-1">Featured Article</span>
                  <h3 className={`text-lg font-bold mb-2 group-hover:text-indigo-400 transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
                    {topic.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{topic.desc}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Compass className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent History or Saved Quick Access */}
      {(history.length > 0 || recentlyViewed.length > 0) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {history.length > 0 && (
              <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
                <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  <Search className="w-4 h-4 text-indigo-400" />
                  <span>Recent Searches</span>
                </h3>
                <div className="space-y-2">
                  {history.slice(0, 4).map((h, i) => (
                    <button
                      key={i}
                      onClick={() => onSearchSubmit(h.query)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span className="font-medium">{h.query}</span>
                      <span className="text-[10px] text-slate-500">{h.timestamp}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recentlyViewed.length > 0 && (
              <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
                <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  <BookMarked className="w-4 h-4 text-violet-400" />
                  <span>Recently Viewed Articles</span>
                </h3>
                <div className="space-y-2">
                  {recentlyViewed.slice(0, 4).map((r, i) => (
                    <button
                      key={i}
                      onClick={() => onSelectArticle(r.title)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span className="font-medium truncate pr-2">{r.title}</span>
                      <span className="text-[10px] text-slate-500 shrink-0">{r.viewedAt}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
