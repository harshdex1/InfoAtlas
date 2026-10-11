import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Globe, Search, Moon, Sun, Settings, LogOut, Menu, Sparkles, User as UserIcon } from "lucide-react";

interface TopNavbarProps {
  onSearchSubmit: (q: string) => void;
  onOpenProfile: () => void;
  onOpenAI: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  onToggleMobileSidebar: () => void;
  onNavigateHome: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onSearchSubmit,
  onOpenProfile,
  onOpenAI,
  isDark,
  toggleTheme,
  onToggleMobileSidebar,
  onNavigateHome,
}) => {
  const { user, logout } = useAuth();
  const [searchVal, setSearchVal] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      onSearchSubmit(searchVal.trim());
      setSearchVal("");
    }
  };

  return (
    <header className={`sticky top-0 z-50 h-[66px] backdrop-blur-md border-b flex items-center justify-between px-4 sm:px-6 transition-colors ${
      isDark ? "bg-slate-950/90 border-slate-800 text-white" : "bg-white border-[#E0E9FA] text-[#102B59]"
    }`}>
      {/* Left: Logo & Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className={`p-2 rounded-xl md:hidden transition-colors ${isDark ? "hover:bg-slate-900 text-slate-300" : "hover:bg-[#F5F8FF] text-[#102B59]"}`}
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 group cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#386BFF] to-[#7252FF] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Globe className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-[#386BFF]">
              InfoAtlas
            </span>
          </div>
        </button>
      </div>

      {/* Center: Wide Global Search Input */}
      <div className="flex-1 max-w-2xl mx-4 hidden sm:block">
        <form onSubmit={handleSubmit} className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#60769A]" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search for anything... (e.g., countries, people, topics, news, etc.)"
            className={`w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border transition-all ${
              isDark
                ? "bg-slate-900/90 border-slate-800 text-white placeholder-slate-500 focus:border-[#386BFF]"
                : "bg-[#F5F8FF] border-[#E0E9FA] text-[#102B59] placeholder-[#60769A] focus:border-[#386BFF] focus:bg-white"
            }`}
          />
        </form>
      </div>

      {/* Right: Account Controls & Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenAI}
          className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#386BFF]/10 hover:bg-[#386BFF]/20 text-[#386BFF] border border-[#386BFF]/30 text-xs font-semibold transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Assistant</span>
        </button>

        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
            isDark ? "hover:bg-slate-900 text-amber-400" : "hover:bg-[#F5F8FF] text-[#386BFF]"
          }`}
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-2 py-1 pr-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#386BFF] to-[#7252FF] text-white flex items-center justify-center text-xs font-bold shadow">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
            </div>
            <span className="text-xs font-semibold hidden lg:inline">{user?.displayName || "User"}</span>
          </button>

          {showProfileMenu && (
            <div className={`absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl border py-2 z-50 ${
              isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-[#E0E9FA] text-[#102B59]"
            }`}>
              <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800">
                <p className="text-xs font-semibold">{user?.displayName}</p>
                <p className="text-[11px] text-[#60769A] truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onOpenProfile();
                }}
                className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 hover:bg-[#F5F8FF] dark:hover:bg-slate-800 hover:text-[#386BFF] transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>Account Settings</span>
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onOpenAI();
                }}
                className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 hover:bg-[#F5F8FF] dark:hover:bg-slate-800 hover:text-[#386BFF] transition-colors md:hidden cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Assistant</span>
              </button>
              <div className="border-t border-slate-200 dark:border-slate-800 my-1"></div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
