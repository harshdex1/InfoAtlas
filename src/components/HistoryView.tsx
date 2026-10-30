import React from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { History as HistoryIcon, Trash2, ArrowLeft, Search, BookMarked } from "lucide-react";

interface HistoryViewProps {
  onSearchSubmit: (q: string) => void;
  onSelectArticle: (title: string) => void;
  onBackToHome: () => void;
  isDark: boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onSearchSubmit, onSelectArticle, onBackToHome, isDark }) => {
  const { history, clearHistory, recentlyViewed } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBackToHome}
          className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
            isDark ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:text-slate-900"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("home", "Home")}</span>
        </button>

        <h1 className={`text-xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
          <HistoryIcon className="w-5 h-5 text-indigo-400" />
          <span>{t("search_history_title", "Search History")} ({history.length})</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Search History */}
        <div className={`p-6 rounded-3xl border ${isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              <Search className="w-4 h-4 text-indigo-400" />
              <span>{t("search_history_title", "Search History")} ({history.length})</span>
            </h2>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t("clear_history", "Clear History")}</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">{t("no_history", "No search history recorded.")}</p>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => onSearchSubmit(h.query)}
                  className={`w-full text-left p-3 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    isDark ? "bg-slate-950/50 hover:bg-slate-800 text-slate-200" : "bg-slate-50 hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <span className="font-medium">{h.query}</span>
                  <span className="text-[10px] text-slate-500">{h.timestamp}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recently Viewed */}
        <div className={`p-6 rounded-3xl border ${isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              <BookMarked className="w-4 h-4 text-violet-400" />
              <span>Recently Viewed Articles ({recentlyViewed.length})</span>
            </h2>
          </div>

          {recentlyViewed.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No recently viewed articles.</p>
          ) : (
            <div className="space-y-2">
              {recentlyViewed.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onSelectArticle(r.title)}
                  className={`w-full text-left p-3 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    isDark ? "bg-slate-950/50 hover:bg-slate-800 text-slate-200" : "bg-slate-50 hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <span className="font-medium truncate pr-2">{r.title}</span>
                  <span className="text-[10px] text-slate-500 shrink-0">{r.viewedAt}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
