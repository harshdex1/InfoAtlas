import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Bookmark as BookmarkIcon, Trash2, ExternalLink, Search, ArrowLeft, Globe } from "lucide-react";
import { formatSafeDate } from "../utils/date";

interface BookmarksViewProps {
  onSelectArticle: (title: string) => void;
  onBackToHome: () => void;
  isDark: boolean;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({ onSelectArticle, onBackToHome, isDark }) => {
  const { bookmarks, removeBookmark } = useAuth();
  const { t } = useLanguage();
  const [filter, setFilter] = useState("");

  const filtered = bookmarks.filter(b => b.title.toLowerCase().includes(filter.toLowerCase()) || b.snippet.toLowerCase().includes(filter.toLowerCase()));

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
          <BookmarkIcon className="w-5 h-5 text-indigo-400" />
          <span>{t("saved_bookmarks_title", "Saved Bookmarks")} ({bookmarks.length})</span>
        </h1>
      </div>

      {bookmarks.length > 0 && (
        <div className="mb-6 relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search saved bookmarks..."
            className={`w-full text-xs pl-10 pr-4 py-3 rounded-xl border transition-all ${
              isDark ? "bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500"
            }`}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <BookmarkIcon className="w-8 h-8" />
          </div>
          <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>{t("no_bookmarks", "No bookmarks saved yet")}</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            {t("no_bookmarks_desc", "Save articles while exploring InfoAtlas to build your personal knowledge repository.")}
          </p>
          <button
            onClick={onBackToHome}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-6 py-3 rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            {t("explore_articles", "Explore Articles")}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <div
              key={b.id}
              className={`p-6 rounded-2xl border transition-all group flex items-start justify-between gap-4 ${
                isDark ? "bg-slate-900/50 border-slate-800 hover:border-indigo-500/50" : "bg-white border-slate-200 hover:border-indigo-500/50 shadow-sm"
              }`}
            >
              <div className="flex-1 cursor-pointer" onClick={() => onSelectArticle(b.title)}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold border border-indigo-500/20">
                    <Globe className="w-3 h-3" />
                    <span>Saved Article</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Saved on {formatSafeDate(b.createdAt)}</span>
                </div>
                <h3 className={`text-lg font-bold mb-2 group-hover:text-indigo-400 transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
                  {b.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{b.snippet}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => removeBookmark(b.url)}
                  className={`p-2.5 rounded-xl border transition-all text-rose-400 hover:bg-rose-500/10 ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"
                  }`}
                  title="Remove Bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <a
                  href={b.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`p-2.5 rounded-xl border transition-all ${
                    isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
                  }`}
                  title="Open Original Source"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
