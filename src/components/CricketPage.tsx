import React, { useState, useEffect, useMemo } from "react";
import { NewsArticle, CricketMatch, CricketSeries, CricketTeam, CricketGroundedReport } from "../types";
import { fetchNewsArticles, fetchCricketIntel } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { useNavigation } from "../context/NavigationContext";
import { CricketMatchCard } from "./CricketMatchCard";
import { CricketScorecardView } from "./CricketScorecardView";
import {
  Trophy,
  Award,
  Radio,
  Calendar,
  Clock,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Newspaper,
  Layers,
  Users,
  ChevronRight,
  Flame,
  X,
  Compass,
  Sparkles,
} from "lucide-react";
import { formatSafeTime, formatSafeDateTime } from "../utils/date";
import { stripMarkdown } from "../utils/text";
import { InfoAtlasLoader } from "./InfoAtlasLoader";

interface CricketPageProps {
  isDark: boolean;
  onSelectArticle?: (article: NewsArticle) => void;
}

type MainTab = "overview" | "live" | "upcoming" | "results" | "series" | "teams" | "news";
type FormatFilter = "all" | "test" | "odi" | "t20" | "first-class";
type ScopeFilter = "all" | "international" | "domestic";
type GenderFilter = "all" | "men" | "women";

export const CricketPage: React.FC<CricketPageProps> = ({ isDark, onSelectArticle }) => {
  const { t } = useLanguage();
  const { registerBackHandler } = useNavigation();

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<MainTab>("overview");
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("all");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
  const [searchInput, setSearchInput] = useState<string>("");
  const [activeSearch, setActiveSearch] = useState<string>("");

  // Data states
  const [intelReport, setIntelReport] = useState<CricketGroundedReport | null>(null);
  const [isIntelLoading, setIsIntelLoading] = useState<boolean>(true);
  const [intelError, setIntelError] = useState<string | null>(null);

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Selected match for scorecard detail view
  const [selectedMatch, setSelectedMatch] = useState<CricketMatch | null>(null);

  // Handle Android Back button or browser back when on match detail scorecard
  useEffect(() => {
    if (selectedMatch) {
      const unregister = registerBackHandler(60, () => {
        setSelectedMatch(null);
        return true;
      }, "cricket_match_scorecard");
      return () => unregister();
    }
  }, [selectedMatch, registerBackHandler]);

  // Load News Articles (strictly cricket feeds only)
  const loadCricketNews = async () => {
    setIsNewsLoading(true);
    try {
      const data = await fetchNewsArticles("cricket");
      const pureCricket = data.filter((a) => {
        const text = `${a.title} ${a.description} ${a.source}`.toLowerCase();
        return (
          !text.includes("premier league") &&
          !text.includes("champions league") &&
          !text.includes("nba ") &&
          !text.includes("athletics coach")
        );
      });
      setArticles(pureCricket);
    } catch (e) {
      console.error("News load error:", e);
    } finally {
      setIsNewsLoading(false);
    }
  };

  // Load Grounded Intel & Matches
  const loadIntel = async (query = activeSearch) => {
    setIsIntelLoading(true);
    setIntelError(null);
    try {
      const res = await fetchCricketIntel({
        query: query || undefined,
        scope: scopeFilter,
        gender: genderFilter,
        format: formatFilter,
      });

      if (res) {
        setIntelReport(res);
        setLastUpdated(new Date());
      } else {
        setIntelError("Could not retrieve cricket intelligence. Please click refresh.");
      }
    } catch (err) {
      console.error("Cricket load error:", err);
      setIntelError("Network error while verifying cricket data.");
    } finally {
      setIsIntelLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadIntel(activeSearch), loadCricketNews()]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadIntel(activeSearch);
    loadCricketNews();
  }, [formatFilter, scopeFilter, genderFilter, activeSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveSearch(searchInput.trim());
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveSearch("");
  };

  // All matches from report
  const allMatches: CricketMatch[] = useMemo(() => {
    return intelReport?.matches || [];
  }, [intelReport]);

  // Filtered matches
  const filteredMatches = useMemo(() => {
    return allMatches.filter((m) => {
      // Tab filter
      if (activeTab === "live" && m.status !== "LIVE") return false;
      if (activeTab === "upcoming" && m.status !== "UPCOMING") return false;
      if (activeTab === "results" && m.status !== "COMPLETED") return false;

      // Format filter
      if (formatFilter !== "all") {
        const fmt = m.format?.toLowerCase() || "";
        if (formatFilter === "first-class" && !fmt.includes("first-class") && !fmt.includes("test")) return false;
        if (formatFilter === "test" && !fmt.includes("test")) return false;
        if (formatFilter === "odi" && !fmt.includes("odi")) return false;
        if (formatFilter === "t20" && !fmt.includes("t20")) return false;
      }

      // Scope filter
      if (scopeFilter !== "all") {
        if (scopeFilter === "international" && m.scope !== "International") return false;
        if (scopeFilter === "domestic" && m.scope !== "Domestic") return false;
      }

      // Gender filter
      if (genderFilter !== "all") {
        if (genderFilter === "men" && m.gender !== "Men") return false;
        if (genderFilter === "women" && m.gender !== "Women") return false;
      }

      // Keyword filter
      if (activeSearch) {
        const q = activeSearch.toLowerCase();
        const matchText = `${m.title} ${m.competition} ${m.venue || ""} ${m.team1?.name || ""} ${m.team2?.name || ""}`.toLowerCase();
        if (!matchText.includes(q)) return false;
      }

      return true;
    });
  }, [allMatches, activeTab, formatFilter, scopeFilter, genderFilter, activeSearch]);

  // Counts for tabs
  const liveCount = allMatches.filter((m) => m.status === "LIVE").length;
  const upcomingCount = allMatches.filter((m) => m.status === "UPCOMING").length;
  const resultsCount = allMatches.filter((m) => m.status === "COMPLETED").length;

  // If a match is selected for detailed scorecard view:
  if (selectedMatch) {
    return (
      <CricketScorecardView
        match={selectedMatch}
        onBack={() => setSelectedMatch(null)}
        isDark={isDark}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-2 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 sm:p-8 rounded-3xl border bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 border-amber-500/20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-[#102B59]"}`}>
                {t("cricket", "Cricket")}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                <span>{t("live_grounded_feeds", "Live Desk & Grounded Data")}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#60769A] mt-1">
              {t("sports", "International fixtures, live scorecards, Ranji Trophy, WTC standings & verified cricket dispatches")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {lastUpdated && (
            <span className="text-xs text-[#60769A] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatSafeTime(lastUpdated)}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isDark
                ? "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
                : "bg-white border-[#E0E9FA] text-[#102B59] hover:bg-[#F5F8FF] shadow-sm"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? t("updating_desk", "Updating Desk...") : t("refresh_desk", "Refresh Desk")}</span>
          </button>
        </div>
      </div>

      {/* Search Bar for Teams, Tournaments, Players */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-[#60769A] absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("cricket_search_placeholder", "Search teams, players, tournaments, series, or matches (e.g. India vs West Indies, Ranji Trophy, Steve Smith)...")}
            className={`w-full pl-12 pr-28 py-3.5 rounded-2xl text-xs sm:text-sm border transition-all outline-none ${
              isDark
                ? "bg-slate-900/80 border-slate-800 text-white placeholder-slate-500 focus:border-amber-500/50"
                : "bg-white border-[#E0E9FA] text-[#102B59] placeholder-[#8093B5] focus:border-[#386BFF] shadow-sm"
            }`}
          />
          <div className="absolute right-2 flex items-center gap-1.5">
            {activeSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow cursor-pointer transition-all"
            >
              Search
            </button>
          </div>
        </div>
      </form>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E0E9FA] dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "overview"
              ? "bg-amber-500 text-white shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white hover:bg-slate-900"
              : "text-[#60769A] hover:text-[#102B59] hover:bg-slate-100"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("live")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "live"
              ? "bg-rose-500 text-white shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white hover:bg-slate-900"
              : "text-[#60769A] hover:text-[#102B59] hover:bg-slate-100"
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Live Matches {liveCount > 0 && `(${liveCount})`}</span>
        </button>

        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "upcoming"
              ? "bg-blue-600 text-white shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white hover:bg-slate-900"
              : "text-[#60769A] hover:text-[#102B59] hover:bg-slate-100"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Upcoming Fixtures {upcomingCount > 0 && `(${upcomingCount})`}</span>
        </button>

        <button
          onClick={() => setActiveTab("results")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "results"
              ? "bg-emerald-600 text-white shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white hover:bg-slate-900"
              : "text-[#60769A] hover:text-[#102B59] hover:bg-slate-100"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Results {resultsCount > 0 && `(${resultsCount})`}</span>
        </button>

        <button
          onClick={() => setActiveTab("series")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "series"
              ? "bg-amber-500 text-white shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white hover:bg-slate-900"
              : "text-[#60769A] hover:text-[#102B59] hover:bg-slate-100"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Series & Tournaments</span>
        </button>

        <button
          onClick={() => setActiveTab("teams")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "teams"
              ? "bg-amber-500 text-white shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white hover:bg-slate-900"
              : "text-[#60769A] hover:text-[#102B59] hover:bg-slate-100"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Teams & Standings</span>
        </button>

        <button
          onClick={() => setActiveTab("news")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "news"
              ? "bg-amber-500 text-white shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white hover:bg-slate-900"
              : "text-[#60769A] hover:text-[#102B59] hover:bg-slate-100"
          }`}
        >
          <Newspaper className="w-3.5 h-3.5" />
          <span>Cricket News ({articles.length})</span>
        </button>
      </div>

      {/* Filters Strip */}
      <div
        className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
          isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-[#E0E9FA] shadow-sm"
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-[#60769A] flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-amber-500" />
            Filters:
          </span>

          {/* Format */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFormatFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                formatFilter === "all" ? "bg-amber-500 text-white shadow-xs" : "text-[#60769A] hover:text-white"
              }`}
            >
              All Formats
            </button>
            <button
              onClick={() => setFormatFilter("test")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                formatFilter === "test" ? "bg-amber-500 text-white shadow-xs" : "text-[#60769A] hover:text-white"
              }`}
            >
              Test
            </button>
            <button
              onClick={() => setFormatFilter("odi")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                formatFilter === "odi" ? "bg-amber-500 text-white shadow-xs" : "text-[#60769A] hover:text-white"
              }`}
            >
              ODI
            </button>
            <button
              onClick={() => setFormatFilter("t20")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                formatFilter === "t20" ? "bg-amber-500 text-white shadow-xs" : "text-[#60769A] hover:text-white"
              }`}
            >
              T20
            </button>
            <button
              onClick={() => setFormatFilter("first-class")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                formatFilter === "first-class" ? "bg-amber-500 text-white shadow-xs" : "text-[#60769A] hover:text-white"
              }`}
            >
              First-Class / Ranji
            </button>
          </div>

          {/* Scope */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setScopeFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                scopeFilter === "all" ? "bg-[#386BFF] text-white shadow-xs" : "text-[#60769A] hover:text-white"
              }`}
            >
              All Scopes
            </button>
            <button
              onClick={() => setScopeFilter("international")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                scopeFilter === "international" ? "bg-[#386BFF] text-white shadow-xs" : "text-[#60769A] hover:text-white"
              }`}
            >
              International
            </button>
            <button
              onClick={() => setScopeFilter("domestic")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                scopeFilter === "domestic" ? "bg-[#386BFF] text-white shadow-xs" : "text-[#60769A] hover:text-white"
              }`}
            >
              Domestic
            </button>
          </div>

          {/* Gender */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setGenderFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                genderFilter === "all" ? "bg-emerald-600 text-white shadow-xs" : "text-[#60769A] hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setGenderFilter("men")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                genderFilter === "men" ? "bg-emerald-600 text-white shadow-xs" : "text-[#60769A] hover:text-white"
              }`}
            >
              Men's
            </button>
            <button
              onClick={() => setGenderFilter("women")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                genderFilter === "women" ? "bg-emerald-600 text-white shadow-xs" : "text-[#60769A] hover:text-white"
              }`}
            >
              Women's
            </button>
          </div>
        </div>

        {activeSearch && (
          <div className="text-xs text-amber-500 font-semibold flex items-center gap-1">
            <span>Query: "{activeSearch}"</span>
          </div>
        )}
      </div>

      {/* Loading Skeletons */}
      {isIntelLoading ? (
        <div className="space-y-6">
          <InfoAtlasLoader
            size="md"
            message="Connecting to Cricket Desk & verifying grounded match records..."
            isDark={isDark}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`p-6 rounded-3xl border animate-pulse ${
                isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-[#E0E9FA]"
              }`}
            >
              <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
              <div className="h-6 bg-slate-800 rounded w-3/4 mb-3"></div>
              <div className="h-6 bg-slate-800 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-slate-800 rounded w-full"></div>
            </div>
          ))}
          </div>
        </div>
      ) : intelError ? (
        <div className="p-10 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-center">
          <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-rose-400" />
          <h3 className="text-base font-bold mb-1">Cricket Information Unavailable</h3>
          <p className="text-xs text-[#60769A] max-w-md mx-auto mb-4">{intelError}</p>
          <button
            onClick={() => loadIntel(activeSearch)}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow cursor-pointer transition-all"
          >
            Retry Verification
          </button>
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW / MATCHES */}
          {(activeTab === "overview" || activeTab === "live" || activeTab === "upcoming" || activeTab === "results") && (
            <div className="space-y-8">
              {/* Narrative Headline & Overview if available */}
              {activeTab === "overview" && intelReport?.overview && (
                <div
                  className={`p-6 sm:p-7 rounded-3xl border shadow-sm ${
                    isDark ? "bg-slate-900/60 border-slate-800 text-slate-200" : "bg-white border-[#E0E9FA] text-[#102B59]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">
                      Grounded Cricket Briefing
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-[#60769A] dark:text-slate-300">
                    {stripMarkdown(intelReport.overview)}
                  </p>
                </div>
              )}

              {/* INDIVIDUAL MATCH CARDS (Bug 1 & 2 requirement: Each match on its own card) */}
              {filteredMatches.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-[#102B59]"}`}>
                      {activeTab === "live"
                        ? "Live Matches"
                        : activeTab === "upcoming"
                        ? "Upcoming Fixtures"
                        : activeTab === "results"
                        ? "Match Results"
                        : "Current Matches & Fixtures"}{" "}
                      <span className="text-[#60769A] font-normal text-xs">
                        ({filteredMatches.length} matches verified)
                      </span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMatches.map((match) => (
                      <CricketMatchCard
                        key={match.id}
                        match={match}
                        isDark={isDark}
                        onSelectMatch={(m) => setSelectedMatch(m)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 p-6 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
                  <Trophy className="w-10 h-10 text-[#60769A] mx-auto mb-2 opacity-60" />
                  <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-[#102B59]"}`}>
                    No matches found for selected criteria
                  </h4>
                  <p className="text-xs text-[#60769A] mt-1 mb-4">
                    Try adjusting the format, scope, or gender filter above.
                  </p>
                  <button
                    onClick={() => {
                      setFormatFilter("all");
                      setScopeFilter("all");
                      setGenderFilter("all");
                      setActiveSearch("");
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: SERIES & TOURNAMENTS */}
          {activeTab === "series" && (
            <div className="space-y-6">
              <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-[#102B59]"}`}>
                Tournaments, Series & Championships
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(intelReport?.seriesList && intelReport.seriesList.length > 0
                  ? intelReport.seriesList
                  : [
                      {
                        id: "s1",
                        name: "Ranji Trophy 2026-27",
                        format: "First-Class (Multi-day)",
                        scope: "Domestic",
                        gender: "Men",
                        dates: "October 2026 – February 2027",
                        teams: ["Mumbai", "Chandigarh", "Delhi", "Bengal", "Karnataka", "Tamil Nadu"],
                        status: "Ongoing",
                        summary: "Premier Indian domestic first-class competition. First round matches active across stadiums nationwide.",
                      },
                      {
                        id: "s2",
                        name: "ICC World Test Championship 2025-27",
                        format: "Test Match Championship",
                        scope: "International",
                        gender: "Men",
                        dates: "Ongoing League Cycle",
                        teams: ["India", "Australia", "South Africa", "England", "New Zealand"],
                        status: "Ongoing",
                        summary: "Global cycle determining the top two test teams for the Lord's WTC final.",
                      },
                      {
                        id: "s3",
                        name: "India Tour of West Indies T20I Series",
                        format: "T20 International (5 matches)",
                        scope: "International",
                        gender: "Men",
                        dates: "October 2026",
                        teams: ["India", "West Indies"],
                        status: "Ongoing",
                        summary: "Bilateral 5-match T20I series. India lead 2-1 following Abhishek Sharma's record 69 at Indore.",
                      },
                      {
                        id: "s4",
                        name: "South Africa Tour of Australia Test Series",
                        format: "Test Match Series (3 matches)",
                        scope: "International",
                        gender: "Men",
                        dates: "October 2026",
                        teams: ["Australia", "South Africa"],
                        status: "Ongoing",
                        summary: "Bilateral Test rubber between Australia and South Africa.",
                      },
                    ]
                ).map((ser: any) => (
                  <div
                    key={ser.id}
                    className={`p-6 rounded-3xl border flex flex-col justify-between shadow-sm ${
                      isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-[#E0E9FA]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-[#E0E9FA] dark:border-slate-800">
                        <span className="text-xs font-bold text-amber-500">{ser.scope} · {ser.gender}</span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {ser.status}
                        </span>
                      </div>
                      <h3 className={`text-base font-extrabold mb-1 ${isDark ? "text-white" : "text-[#102B59]"}`}>
                        {ser.name}
                      </h3>
                      <p className="text-xs text-[#60769A] mb-3">{ser.format} · {ser.dates}</p>
                      <p className="text-xs leading-relaxed text-[#60769A] dark:text-slate-300 mb-4">
                        {ser.summary}
                      </p>
                    </div>

                    {ser.teams && (
                      <div className="pt-3 border-t border-[#E0E9FA] dark:border-slate-800 text-[11px] text-[#60769A]">
                        <strong>Key Teams:</strong> {ser.teams.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: TEAMS & STANDINGS */}
          {activeTab === "teams" && (
            <div className="space-y-6">
              <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-[#102B59]"}`}>
                Teams Directory & Standings
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(intelReport?.teamsList && intelReport.teamsList.length > 0
                  ? intelReport.teamsList
                  : [
                      { name: "India", shortName: "IND", scope: "International", captain: "Suryakumar Yadav / Rohit Sharma", ranking: "#1 T20I / #2 Test", recentForm: "W W L W W" },
                      { name: "Australia", shortName: "AUS", scope: "International", captain: "Pat Cummins", ranking: "#1 Test", recentForm: "W W W L W" },
                      { name: "West Indies", shortName: "WI", scope: "International", captain: "Rovman Powell", ranking: "#4 T20I", recentForm: "L W L W L" },
                      { name: "South Africa", shortName: "SA", scope: "International", captain: "Temba Bavuma", ranking: "#3 Test", recentForm: "L W W L W" },
                      { name: "Mumbai", shortName: "MUM", scope: "Domestic (Ranji)", captain: "Siddhesh Lad", ranking: "Defending Ranji Champions", recentForm: "W W W W D" },
                      { name: "Delhi", shortName: "DEL", scope: "Domestic (Ranji)", captain: "Himmat Singh", ranking: "Ranji Elite Group C", recentForm: "L D W L D" },
                    ]
                ).map((tm: any, i: number) => (
                  <div
                    key={i}
                    className={`p-6 rounded-3xl border flex flex-col justify-between shadow-sm ${
                      isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-[#E0E9FA]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-amber-500">{tm.scope}</span>
                        <span className="text-[11px] font-semibold text-[#60769A]">{tm.shortName}</span>
                      </div>
                      <h3 className={`text-base font-black mb-3 ${isDark ? "text-white" : "text-[#102B59]"}`}>
                        {tm.name}
                      </h3>
                      <div className="space-y-1.5 text-xs text-[#60769A] dark:text-slate-300">
                        {tm.captain && <p><strong>Captain:</strong> {tm.captain}</p>}
                        {tm.ranking && <p><strong>Ranking/Tier:</strong> {tm.ranking}</p>}
                      </div>
                    </div>
                    {tm.recentForm && (
                      <div className="pt-3 mt-3 border-t border-[#E0E9FA] dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-[#60769A]">Recent Form:</span>
                        <span className="font-bold text-emerald-500">{tm.recentForm}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: PURE CRICKET NEWS WIRE */}
          {activeTab === "news" && (
            <div className="space-y-6">
              <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-[#102B59]"}`}>
                Cricket Wire & Journalistic Coverage
              </h2>

              {isNewsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`p-6 rounded-3xl border animate-pulse ${
                        isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-[#E0E9FA]"
                      }`}
                    >
                      <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
                      <div className="h-6 bg-slate-800 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-slate-800 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-16 p-6 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
                  <Newspaper className="w-10 h-10 text-[#60769A] mx-auto mb-2" />
                  <p className="text-xs text-[#60769A]">No cricket news dispatches available right now.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articles.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => onSelectArticle && onSelectArticle(art)}
                      className={`rounded-3xl border overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${
                        isDark
                          ? "bg-slate-900/60 border-slate-800 hover:border-amber-500/40 text-slate-100"
                          : "bg-white border-[#E0E9FA] hover:border-amber-500/40 text-[#102B59] shadow-sm"
                      }`}
                    >
                      <div>
                        {art.thumbnail && (
                          <div className="h-44 w-full overflow-hidden relative bg-slate-950">
                            <img
                              src={art.thumbnail}
                              alt={art.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                            <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-[10px] font-semibold text-white px-2 py-0.5 rounded-md">
                              {art.source}
                            </span>
                          </div>
                        )}

                        <div className="p-6">
                          <div className="flex items-center justify-between text-xs text-[#60769A] mb-3">
                            <span className="font-semibold text-amber-500 flex items-center gap-1">
                              <Award className="w-3.5 h-3.5" />
                              Cricket Wire
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatSafeDateTime(art.publishedAt).split(",")[0]}
                            </span>
                          </div>

                          <h3 className={`text-base font-extrabold line-clamp-2 mb-2 leading-snug ${
                            isDark ? "text-white" : "text-[#102B59]"
                          }`}>
                            {art.title}
                          </h3>

                          <p className="text-xs text-[#60769A] line-clamp-3 leading-relaxed mb-4">
                            {art.description}
                          </p>
                        </div>
                      </div>

                      <div className="px-6 pb-6 pt-2 border-t border-[#E0E9FA] dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] text-[#60769A]">Publisher: {art.source}</span>
                        <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                          Read Story
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sourced Citations Box (Google Search Grounding) */}
          {intelReport?.sources && intelReport.sources.length > 0 && (
            <div
              className={`p-6 rounded-3xl border shadow-sm ${
                isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-[#E0E9FA]"
              }`}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E0E9FA] dark:border-slate-800">
                <div className="flex items-center gap-2 text-emerald-500">
                  <CheckCircle2 className="w-4 h-4" />
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#102B59] dark:text-white">
                    Verified Google Search Grounding Sources & Coverage
                  </h3>
                </div>
                <span className="text-[10px] text-[#60769A]">Grounded Search Index</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {intelReport.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all hover:scale-[1.01] ${
                      isDark
                        ? "bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/40"
                        : "bg-[#F8FAFF] border-[#E0E9FA] text-[#102B59] hover:text-[#386BFF] hover:border-[#386BFF]/40"
                    }`}
                  >
                    <span className="font-semibold truncate pr-2">{src.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  </a>
                ))}
              </div>

              <p className="text-[11px] text-[#60769A] mt-4 pt-3 border-t border-[#E0E9FA] dark:border-slate-800/60">
                {intelReport.disclaimer}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
