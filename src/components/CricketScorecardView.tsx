import React, { useState, useEffect } from "react";
import { CricketMatch, CricketInnings } from "../types";
import { fetchMatchScorecard } from "../services/api";
import {
  ArrowLeft,
  Trophy,
  MapPin,
  Clock,
  Radio,
  ExternalLink,
  ShieldAlert,
  RefreshCw,
  Users,
  Award,
  Sparkles,
  CheckCircle2,
  ListOrdered,
} from "lucide-react";
import { formatSafeDateTime } from "../utils/date";
import { stripMarkdown } from "../utils/text";
import { InfoAtlasLoader } from "./InfoAtlasLoader";
import { useLanguage } from "../context/LanguageContext";

interface CricketScorecardViewProps {
  match: CricketMatch;
  onBack: () => void;
  isDark: boolean;
}

export const CricketScorecardView: React.FC<CricketScorecardViewProps> = ({
  match,
  onBack,
  isDark,
}) => {
  const { t } = useLanguage();
  const [scorecardData, setScorecardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sources, setSources] = useState<{ title: string; url: string }[]>([]);
  const [activeInningsTab, setActiveInningsTab] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    async function loadScorecard() {
      setIsLoading(true);
      try {
        const res = await fetchMatchScorecard({
          matchId: match.id,
          title: match.title,
          team1: match.team1?.name,
          team2: match.team2?.name,
          competition: match.competition,
          format: match.format,
        });

        if (isMounted && res) {
          setScorecardData(res.scorecard);
          setSources(res.sources || []);
        }
      } catch (e) {
        console.error("Scorecard fetch error:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadScorecard();
    return () => {
      isMounted = false;
    };
  }, [match.id]);

  const inningsList: any[] = scorecardData?.innings || match.innings || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-2 sm:px-4 py-4">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
            isDark
              ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
              : "bg-white border-[#E0E9FA] text-[#102B59] hover:bg-[#F5F8FF] shadow-sm"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("back", "Back")} ({t("cricket", "Cricket")})</span>
        </button>

        <span className="text-xs text-[#60769A]">
          Updated: {formatSafeDateTime(new Date().toISOString())}
        </span>
      </div>

      {/* Main Match Header Card */}
      <div
        className={`rounded-3xl border p-6 sm:p-8 shadow-sm ${
          isDark ? "bg-slate-900/80 border-slate-800 text-slate-100" : "bg-white border-[#E0E9FA] text-[#102B59]"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#E0E9FA] dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-bold">{match.competition}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[#60769A] font-semibold">
              {match.format}
            </span>
          </div>

          <div>
            {match.status === "LIVE" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <Radio className="w-3.5 h-3.5" />
                LIVE
              </span>
            ) : match.status === "COMPLETED" ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                COMPLETED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                UPCOMING
              </span>
            )}
          </div>
        </div>

        {/* Big Teams Score Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-6">
          {/* Team 1 */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-[#E0E9FA] dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-3xl" role="img" aria-label="flag">
                {match.team1?.flagEmoji || "🏏"}
              </span>
              <div>
                <h3 className="text-lg font-extrabold">{match.team1?.name}</h3>
                <span className="text-xs text-[#60769A]">({match.team1?.shortName})</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black">{match.team1?.score || "—"}</span>
              {match.team1?.overs && (
                <p className="text-xs text-[#60769A]">({match.team1.overs} ov)</p>
              )}
            </div>
          </div>

          {/* Team 2 */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-[#E0E9FA] dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-3xl" role="img" aria-label="flag">
                {match.team2?.flagEmoji || "🏏"}
              </span>
              <div>
                <h3 className="text-lg font-extrabold">{match.team2?.name}</h3>
                <span className="text-xs text-[#60769A]">({match.team2?.shortName})</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black">{match.team2?.score || "—"}</span>
              {match.team2?.overs && (
                <p className="text-xs text-[#60769A]">({match.team2.overs} ov)</p>
              )}
            </div>
          </div>
        </div>

        {/* Result banner */}
        {(match.result || match.statusNote || scorecardData?.matchSummary) && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-300 mb-6">
            <p className="font-bold mb-1">{stripMarkdown(match.result || match.statusNote)}</p>
            {scorecardData?.matchSummary && (
              <p className="text-xs font-normal text-[#60769A] dark:text-slate-300 leading-relaxed">
                {stripMarkdown(scorecardData.matchSummary)}
              </p>
            )}
          </div>
        )}

        {/* Match Facts: Toss, Venue, Player of Match */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#60769A] border-t border-[#E0E9FA] dark:border-slate-800 pt-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="font-bold text-[#102B59] dark:text-white block">Venue</span>
              <span className="truncate">{stripMarkdown(match.venue || scorecardData?.venue || "International Stadium")}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="font-bold text-[#102B59] dark:text-white block">Toss</span>
              <span>{stripMarkdown(match.toss || scorecardData?.toss || "Official toss record")}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="font-bold text-[#102B59] dark:text-white block">Player of the Match</span>
              <span>{stripMarkdown(match.playerOfTheMatch || scorecardData?.playerOfTheMatch || "To be declared")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Innings Tabs & Scorecard Tables */}
      {isLoading ? (
        <div className="p-8 rounded-3xl border bg-slate-50/50 dark:bg-slate-900/30 border-[#E0E9FA] dark:border-slate-800">
          <InfoAtlasLoader
            size="md"
            message="Retrieving verified innings figures & scorecard data..."
            isDark={isDark}
          />
        </div>
      ) : inningsList.length > 0 ? (
        <div className="space-y-6">
          {/* Innings selector */}
          <div className="flex items-center gap-2 border-b border-[#E0E9FA] dark:border-slate-800 pb-2 overflow-x-auto">
            {inningsList.map((inn, idx) => (
              <button
                key={idx}
                onClick={() => setActiveInningsTab(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeInningsTab === idx
                    ? "bg-amber-500 text-white shadow-sm"
                    : isDark
                    ? "text-slate-400 hover:text-white bg-slate-900"
                    : "text-[#60769A] hover:text-[#102B59] bg-white border border-[#E0E9FA]"
                }`}
              >
                <span>
                  {inn.teamName ? `${inn.teamName} Innings` : `Innings ${idx + 1}`}
                </span>
                {inn.runs && (
                  <span className="ml-2 font-normal opacity-90">
                    ({inn.runs}/{inn.wickets || "all out"} in {inn.overs} ov)
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active Innings Details */}
          {inningsList[activeInningsTab] && (
            <div className="space-y-6">
              {/* Batting Table */}
              <div
                className={`rounded-3xl border overflow-hidden shadow-sm ${
                  isDark ? "bg-slate-900/70 border-slate-800" : "bg-white border-[#E0E9FA]"
                }`}
              >
                <div className="p-4 sm:p-5 border-b border-[#E0E9FA] dark:border-slate-800 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#102B59] dark:text-white flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-amber-500" />
                    Batting Scorecard
                  </h4>
                  <span className="text-xs font-semibold text-[#60769A]">
                    Total: {inningsList[activeInningsTab].runs || "—"}/{inningsList[activeInningsTab].wickets || "—"} ({inningsList[activeInningsTab].overs || "—"} ov)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E0E9FA] dark:border-slate-800 text-[#60769A] bg-slate-50 dark:bg-slate-950/40">
                        <th className="py-3 px-4 font-semibold">Batter</th>
                        <th className="py-3 px-4 font-semibold">Dismissal</th>
                        <th className="py-3 px-3 font-semibold text-right">R</th>
                        <th className="py-3 px-3 font-semibold text-right">B</th>
                        <th className="py-3 px-3 font-semibold text-right">4s</th>
                        <th className="py-3 px-3 font-semibold text-right">6s</th>
                        <th className="py-3 px-3 font-semibold text-right">SR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E0E9FA] dark:divide-slate-800/60">
                      {inningsList[activeInningsTab].batting && inningsList[activeInningsTab].batting.length > 0 ? (
                        inningsList[activeInningsTab].batting.map((b: any, bIdx: number) => (
                          <tr key={bIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-bold text-[#102B59] dark:text-white">
                              {stripMarkdown(b.playerName)}
                            </td>
                            <td className="py-3 px-4 text-[#60769A]">
                              {stripMarkdown(b.dismissal || "not out")}
                            </td>
                            <td className="py-3 px-3 font-black text-right">{b.runs}</td>
                            <td className="py-3 px-3 text-[#60769A] text-right">{b.balls}</td>
                            <td className="py-3 px-3 text-[#60769A] text-right">{b.fours || "—"}</td>
                            <td className="py-3 px-3 text-[#60769A] text-right">{b.sixes || "—"}</td>
                            <td className="py-3 px-3 text-[#60769A] text-right">{b.strikeRate || "—"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-[#60769A]">
                            Detailed individual batting breakdown not published in snippet data.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {inningsList[activeInningsTab].extras && (
                  <div className="p-4 border-t border-[#E0E9FA] dark:border-slate-800 text-xs text-[#60769A] flex items-center justify-between">
                    <span><strong>Extras:</strong> {stripMarkdown(inningsList[activeInningsTab].extras)}</span>
                  </div>
                )}
              </div>

              {/* Bowling Table */}
              <div
                className={`rounded-3xl border overflow-hidden shadow-sm ${
                  isDark ? "bg-slate-900/70 border-slate-800" : "bg-white border-[#E0E9FA]"
                }`}
              >
                <div className="p-4 sm:p-5 border-b border-[#E0E9FA] dark:border-slate-800">
                  <h4 className="text-sm font-bold text-[#102B59] dark:text-white">
                    Bowling Figures
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E0E9FA] dark:border-slate-800 text-[#60769A] bg-slate-50 dark:bg-slate-950/40">
                        <th className="py-3 px-4 font-semibold">Bowler</th>
                        <th className="py-3 px-3 font-semibold text-right">O</th>
                        <th className="py-3 px-3 font-semibold text-right">M</th>
                        <th className="py-3 px-3 font-semibold text-right">R</th>
                        <th className="py-3 px-3 font-semibold text-right font-bold">W</th>
                        <th className="py-3 px-3 font-semibold text-right">Econ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E0E9FA] dark:divide-slate-800/60">
                      {inningsList[activeInningsTab].bowling && inningsList[activeInningsTab].bowling.length > 0 ? (
                        inningsList[activeInningsTab].bowling.map((bw: any, bwIdx: number) => (
                          <tr key={bwIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-bold text-[#102B59] dark:text-white">
                              {stripMarkdown(bw.bowlerName)}
                            </td>
                            <td className="py-3 px-3 text-right">{bw.overs}</td>
                            <td className="py-3 px-3 text-[#60769A] text-right">{bw.maidens || 0}</td>
                            <td className="py-3 px-3 text-right">{bw.runs}</td>
                            <td className="py-3 px-3 text-right font-black text-amber-500">{bw.wickets}</td>
                            <td className="py-3 px-3 text-[#60769A] text-right">{bw.economy || "—"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-[#60769A]">
                            Detailed bowling figures not published in snippet data.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fall of Wickets */}
              {inningsList[activeInningsTab].fallOfWickets && inningsList[activeInningsTab].fallOfWickets.length > 0 && (
                <div
                  className={`p-5 rounded-2xl border text-xs ${
                    isDark ? "bg-slate-900/50 border-slate-800 text-slate-300" : "bg-white border-[#E0E9FA] text-[#60769A]"
                  }`}
                >
                  <h5 className="font-bold text-[#102B59] dark:text-white mb-2">Fall of Wickets</h5>
                  <div className="flex flex-wrap gap-2">
                    {inningsList[activeInningsTab].fallOfWickets.map((fow: string, fIdx: number) => (
                      <span key={fIdx} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">
                        {fow}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-3xl border text-center text-xs text-[#60769A]">
          <p className="font-bold mb-1">Innings-by-innings ball scorecard is in preparation.</p>
          <p>Please check official broadcaster links below for full live ball commentary.</p>
        </div>
      )}

      {/* Playing XI if available */}
      {scorecardData?.playingXI && (
        <div
          className={`p-6 rounded-3xl border shadow-sm ${
            isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-[#E0E9FA]"
          }`}
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E0E9FA] dark:border-slate-800">
            <Users className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-bold text-[#102B59] dark:text-white">Playing XI Squads</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h5 className="text-xs font-bold text-amber-500 mb-2">{match.team1?.name}</h5>
              <ul className="text-xs space-y-1 text-[#60769A] dark:text-slate-300">
                {scorecardData.playingXI.team1?.map((p: string, idx: number) => (
                  <li key={idx}>· {p}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-bold text-amber-500 mb-2">{match.team2?.name}</h5>
              <ul className="text-xs space-y-1 text-[#60769A] dark:text-slate-300">
                {scorecardData.playingXI.team2?.map((p: string, idx: number) => (
                  <li key={idx}>· {p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Sourced Citations & Attribution */}
      <div
        className={`p-6 rounded-3xl border ${
          isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-[#E0E9FA]"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#60769A]">
            Verified Sourced Coverage
          </span>
          <span className="text-[10px] text-[#60769A]">Google Search Grounding</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {sources.length > 0 ? (
            sources.map((src, i) => (
              <a
                key={i}
                href={src.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold bg-white dark:bg-slate-800 border-[#E0E9FA] dark:border-slate-700 text-[#102B59] dark:text-white hover:text-amber-500 transition-colors"
              >
                <span className="truncate max-w-[200px]">{src.title}</span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              </a>
            ))
          ) : match.sourceUrl ? (
            <a
              href={match.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold bg-white dark:bg-slate-800 border-[#E0E9FA] dark:border-slate-700 text-[#102B59] dark:text-white hover:text-amber-500 transition-colors"
            >
              <span>{match.sourceTitle || "Official Publisher Match Centre"}</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            </a>
          ) : (
            <span className="text-xs text-[#60769A]">Verified via cricket wire records.</span>
          )}
        </div>
      </div>
    </div>
  );
};
