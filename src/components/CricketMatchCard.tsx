import React from "react";
import { CricketMatch } from "../types";
import {
  Clock,
  MapPin,
  Trophy,
  ExternalLink,
  ChevronRight,
  Award,
  Radio,
  Calendar,
  Sparkles,
} from "lucide-react";
import { stripMarkdown } from "../utils/text";

interface CricketMatchCardProps {
  match: CricketMatch;
  isDark: boolean;
  onSelectMatch: (match: CricketMatch) => void;
}

export const CricketMatchCard: React.FC<CricketMatchCardProps> = ({
  match,
  isDark,
  onSelectMatch,
}) => {
  const isLive = match.status === "LIVE";
  const isCompleted = match.status === "COMPLETED";
  const isUpcoming = match.status === "UPCOMING";
  const isAbandoned = match.status === "ABANDONED" || match.status === "POSTPONED";

  const statusBadge = () => {
    if (isLive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <Radio className="w-3 h-3 text-rose-500" />
          LIVE
        </span>
      );
    }
    if (isCompleted) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          COMPLETED
        </span>
      );
    }
    if (isUpcoming) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Calendar className="w-3 h-3" />
          UPCOMING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        {match.status}
      </span>
    );
  };

  return (
    <div
      onClick={() => onSelectMatch(match)}
      className={`rounded-3xl border p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between cursor-pointer ${
        isDark
          ? "bg-slate-900/70 border-slate-800 hover:border-amber-500/40 text-slate-100"
          : "bg-white border-[#E0E9FA] hover:border-amber-500/40 text-[#102B59] shadow-sm"
      }`}
    >
      <div>
        {/* Header: Competition & Status */}
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E0E9FA] dark:border-slate-800">
          <div className="flex items-center gap-2 truncate">
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-bold truncate text-[#102B59] dark:text-white">
              {stripMarkdown(match.competition)}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[#60769A]">
              {stripMarkdown(match.format)}
            </span>
          </div>
          <div className="shrink-0">{statusBadge()}</div>
        </div>

        {/* Teams & Scores */}
        <div className="space-y-3 mb-4">
          {/* Team 1 */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 truncate">
              <span className="text-xl shrink-0" role="img" aria-label="flag">
                {match.team1?.flagEmoji || "🏏"}
              </span>
              <span className="text-sm sm:text-base font-bold truncate">
                {stripMarkdown(match.team1?.name)}
              </span>
              {match.team1?.shortName && (
                <span className="text-[11px] text-[#60769A] font-semibold">
                  ({stripMarkdown(match.team1.shortName)})
                </span>
              )}
            </div>
            <div className="text-right shrink-0">
              {match.team1?.score ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-extrabold tracking-tight">
                    {stripMarkdown(match.team1.score)}
                  </span>
                  {match.team1.overs && (
                    <span className="text-[11px] text-[#60769A] font-medium">
                      ({stripMarkdown(match.team1.overs)} ov)
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-[#60769A]">Yet to bat</span>
              )}
            </div>
          </div>

          {/* Team 2 */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 truncate">
              <span className="text-xl shrink-0" role="img" aria-label="flag">
                {match.team2?.flagEmoji || "🏏"}
              </span>
              <span className="text-sm sm:text-base font-bold truncate">
                {stripMarkdown(match.team2?.name)}
              </span>
              {match.team2?.shortName && (
                <span className="text-[11px] text-[#60769A] font-semibold">
                  ({stripMarkdown(match.team2.shortName)})
                </span>
              )}
            </div>
            <div className="text-right shrink-0">
              {match.team2?.score ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-extrabold tracking-tight">
                    {stripMarkdown(match.team2.score)}
                  </span>
                  {match.team2.overs && (
                    <span className="text-[11px] text-[#60769A] font-medium">
                      ({stripMarkdown(match.team2.overs)} ov)
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-[#60769A]">Yet to bat</span>
              )}
            </div>
          </div>
        </div>

        {/* Result or Status Note */}
        {(match.result || match.statusNote) && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold mb-4 leading-relaxed ${
              isLive
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                : isCompleted
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                : "bg-slate-100 dark:bg-slate-800/60 text-[#60769A] dark:text-slate-300"
            }`}
          >
            {stripMarkdown(match.result || match.statusNote)}
          </div>
        )}

        {/* Venue & Date */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#60769A] mb-4">
          {match.venue && (
            <span className="flex items-center gap-1 truncate max-w-[200px]">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{stripMarkdown(match.venue)}</span>
            </span>
          )}
          {match.dateTime && (
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3 shrink-0" />
              <span>{stripMarkdown(match.dateTime)}</span>
            </span>
          )}
        </div>

        {/* Top Performer summary if available */}
        {match.battingFiguresSummary && (
          <div className="text-[11px] text-[#60769A] dark:text-slate-400 mb-2 truncate">
            <strong className="text-[#102B59] dark:text-white">Batting:</strong>{" "}
            {stripMarkdown(match.battingFiguresSummary)}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-[#E0E9FA] dark:border-slate-800 flex items-center justify-between">
        {match.sourceUrl ? (
          <a
            href={match.sourceUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] text-[#60769A] hover:text-amber-500 flex items-center gap-1 font-medium transition-colors"
          >
            <span>{match.sourceTitle || "Verified Source"}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-[10px] text-[#60769A]">Sourced Data</span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectMatch(match);
          }}
          className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
        >
          <span>View Scorecard</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
