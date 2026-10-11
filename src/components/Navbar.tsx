import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Globe, Bookmark, History, User as UserIcon, LogOut, Settings, Moon, Sun, Search, Sparkles, Newspaper } from "lucide-react";

interface NavbarProps {
  onNavigate: (view: "home" | "news" | "bookmarks" | "history") => void;
  currentView: string;
  onOpenProfile: () => void;
  onOpenAI: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  onSearchSubmit: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  currentView,
  onOpenProfile,
  onOpenAI,
  isDark,
  toggleTheme,
  onSearchSubmit,
}) => {
  const { user, logout, bookmarks } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [navSearch, setNavSearch] = useState("");

  const handleNavSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      onSearchSubmit(navSearch.trim());
      setNavSearch("");
    }
  };

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors ${
      isDark ? "bg-slate-950/85 border-slate-800 text-white" : "bg-white/85 border-slate-200 text-slate-900"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Main Nav */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2.5 group cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Globe className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                InfoAtlas
              </span>
              <span className="block text-[10px] text-slate-400 font-medium tracking-wide">Knowledge & News Platform</span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1 bg-slate-900/40 p-1 rounded-xl border border-slate-800/60">
            <button
              onClick={() => onNavigate("home")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === "home" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white"
              }`}
            >
              Knowledge
            </button>
            <button
              onClick={() => onNavigate("news")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentView === "news" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white"
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>News Center</span>
            </button>
          </nav>

          {/* Nav Quick Search (hidden on mobile) */}
          {currentView !== "home" && currentView !== "news" && (
            <form onSubmit={handleNavSearch} className="hidden lg:flex items-center relative">
              <Search className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search anything..."
                className={`text-xs pl-9 pr-3 py-2 rounded-xl border transition-all w-48 lg:w-64 ${
                  isDark
                    ? "bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500"
                }`}
              />
            </form>
          )}
        </div>

        {/* Right Navigation & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenAI}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Assistant</span>
          </button>

          {/* Mobile News Toggle button */}
          <button
            onClick={() => onNavigate("news")}
            className={`p-2.5 rounded-xl transition-all md:hidden ${
              currentView === "news"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : isDark ? "hover:bg-slate-900 text-slate-300" : "hover:bg-slate-100 text-slate-700"
            }`}
            title="News Center"
          >
            <Newspaper className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate("bookmarks")}
            className={`p-2.5 rounded-xl transition-all relative ${
              currentView === "bookmarks"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : isDark ? "hover:bg-slate-900 text-slate-300" : "hover:bg-slate-100 text-slate-700"
            }`}
            title="Bookmarks"
          >
            <Bookmark className="w-4 h-4" />
            {bookmarks.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {bookmarks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate("history")}
            className={`p-2.5 rounded-xl transition-all ${
              currentView === "history"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : isDark ? "hover:bg-slate-900 text-slate-300" : "hover:bg-slate-100 text-slate-700"
            }`}
            title="Search History"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl transition-all ${
              isDark ? "hover:bg-slate-900 text-amber-400" : "hover:bg-slate-100 text-slate-700"
            }`}
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 pl-2 py-1 pr-1 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xs font-bold shadow">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
              </div>
            </button>

            {showProfileMenu && (
              <div className={`absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl border py-2 z-50 ${
                isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
              }`}>
                <div className="px-4 py-2 border-b border-slate-800/50">
                  <p className="text-xs font-semibold text-white">{user?.displayName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenProfile();
                  }}
                  className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 hover:bg-indigo-600/10 hover:text-indigo-400 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Account Settings</span>
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenAI();
                  }}
                  className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 hover:bg-indigo-600/10 hover:text-indigo-400 transition-colors sm:hidden"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>AI Assistant</span>
                </button>
                <div className="border-t border-slate-800/50 my-1"></div>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
