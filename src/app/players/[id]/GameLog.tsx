"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateFantasyMetrics,
  calculateFantasyScore,
  type ScoringFormula,
} from "@/lib/scoring";
import { useScoringFormula } from "@/lib/useScoringFormula";

type Game = {
  Game_ID: string;
  GAME_DATE: string;
  MATCHUP: string;
  WL: string;
  MIN: number;
  FGM: number;
  FGA: number;
  FG_PCT: number;
  FG3M: number;
  FG3A: number;
  FG3_PCT: number;
  FTM: number;
  FTA: number;
  FT_PCT: number;
  REB: number;
  AST: number;
  STL: number;
  BLK: number;
  TOV: number;
  PTS: number;
  PLUS_MINUS: number;
};

type Team = {
  id: number;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
};

type TeamsResponse = {
  data: Team[];
};

type Props = {
  games?: Game[];
  loading?: boolean;
  error?: string;
  scoringFormula?: ScoringFormula;
  showFantasySummary?: boolean;
};

function formatPercentage(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatMinutes(value: number) {
  return Number.isInteger(value)
    ? `${value}`
    : value.toFixed(1);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getMatchupTeams(matchup: string) {
  const cleaned = matchup
    .replace(/\s+/g, " ")
    .trim();

  const match = cleaned.match(
    /^([A-Z]{2,4})\s+(@|vs\.?)\s+([A-Z]{2,4})$/i
  );

  if (!match) {
    return null;
  }

  return {
    homeOrAway: match[2].toLowerCase(),
    firstTeam: match[1].toUpperCase(),
    secondTeam: match[3].toUpperCase(),
  };
}

function TeamLogo({
  team,
}: {
  team?: Team;
}) {
  if (!team) {
    return null;
  }

  return (
    <img
      src={`https://cdn.nba.com/logos/nba/${team.id}/primary/L/logo.svg`}
      alt={`${team.full_name} logo`}
      className="h-7 w-7 object-contain"
    />
  );
}

export default function GameLog({
  games = [],
  loading = false,
  error = "",
  scoringFormula: scoringFormulaProp,
  showFantasySummary = true,
}: Props) {
  const savedScoringFormula =
    useScoringFormula();

  const scoringFormula =
    scoringFormulaProp ??
    savedScoringFormula;

  const [teams, setTeams] =
    useState<Team[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadTeams() {
      try {
        const response = await fetch(
          "/api/teams"
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load teams"
          );
        }

        const data: TeamsResponse =
          await response.json();

        if (!cancelled) {
          setTeams(data.data);
        }
      } catch (error) {
        console.error(
          "Failed to load teams:",
          error
        );
      }
    }

    loadTeams();

    return () => {
      cancelled = true;
    };
  }, []);

  const teamsByAbbreviation =
    new Map(
      teams.map((team) => [
        team.abbreviation.toUpperCase(),
        team,
      ])
    );

  const fantasyGames = useMemo(
    () =>
      games.map((game) => ({
        ...game,
        fantasyScore:
          calculateFantasyScore(
            {
              PTS: Number(
                game.PTS ?? 0
              ),
              REB: Number(
                game.REB ?? 0
              ),
              AST: Number(
                game.AST ?? 0
              ),
              STL: Number(
                game.STL ?? 0
              ),
              BLK: Number(
                game.BLK ?? 0
              ),
              TOV: Number(
                game.TOV ?? 0
              ),
            },
            scoringFormula
          ),
      })),
    [games, scoringFormula]
  );

  const fantasyMetrics =
    useMemo(
      () =>
        calculateFantasyMetrics(
          games.map((game) => ({
            PTS: Number(
              game.PTS ?? 0
            ),
            REB: Number(
              game.REB ?? 0
            ),
            AST: Number(
              game.AST ?? 0
            ),
            STL: Number(
              game.STL ?? 0
            ),
            BLK: Number(
              game.BLK ?? 0
            ),
            TOV: Number(
              game.TOV ?? 0
            ),
          })),
          scoringFormula
        ),
      [games, scoringFormula]
    );

  if (loading) {
    return (
      <div className="px-6 py-10 text-center text-sm text-gray-500">
        Loading games...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-10 text-center text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-sm text-gray-500">
        No games found for this season.
      </div>
    );
  }

  return (
    <div>
      {showFantasySummary && (
        <div className="border-b border-gray-800 bg-gray-950/40 px-5 py-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Fantasy Performance
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Calculated from this season's
                games using your current
                scoring formula.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Avg Score
              </div>

              <div className="mt-1 text-2xl font-bold text-white">
                {fantasyMetrics.average.toFixed(
                  1
                )}
              </div>
            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Median Score
              </div>

              <div className="mt-1 text-2xl font-bold text-white">
                {fantasyMetrics.median.toFixed(
                  1
                )}
              </div>
            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Proj. Score*
              </div>

              <div className="mt-1 text-2xl font-bold text-blue-400">
                {fantasyMetrics.projection.toFixed(
                  1
                )}
              </div>

              <div className="mt-1 text-[11px] text-gray-600">
                Last 10 games average
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1350px] text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-5 py-4">
                Date
              </th>
              <th className="px-5 py-4">
                Matchup
              </th>
              <th className="px-5 py-4">
                Result
              </th>
              <th className="px-5 py-4">
                MIN
              </th>
              <th className="px-5 py-4">
                FG
              </th>
              <th className="px-5 py-4">
                3P
              </th>
              <th className="px-5 py-4">
                FT
              </th>
              <th className="px-5 py-4">
                REB
              </th>
              <th className="px-5 py-4">
                AST
              </th>
              <th className="px-5 py-4">
                STL
              </th>
              <th className="px-5 py-4">
                BLK
              </th>
              <th className="px-5 py-4">
                TOV
              </th>
              <th className="px-5 py-4">
                PTS
              </th>
              <th className="px-5 py-4">
                +/-
              </th>
              <th className="px-5 py-4">
                Fantasy
              </th>
            </tr>
          </thead>

          <tbody>
            {fantasyGames.map(
              (game) => {
                const matchup =
                  getMatchupTeams(
                    game.MATCHUP
                  );

                const firstTeam =
                  matchup
                    ? teamsByAbbreviation.get(
                        matchup.firstTeam
                      )
                    : undefined;

                const secondTeam =
                  matchup
                    ? teamsByAbbreviation.get(
                        matchup.secondTeam
                      )
                    : undefined;

                return (
                  <tr
                    key={game.Game_ID}
                    className="border-b border-gray-800/80 last:border-b-0 hover:bg-gray-800/40"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-gray-300">
                      {formatDate(
                        game.GAME_DATE
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {matchup ? (
                        <div className="flex items-center gap-2">
                          <TeamLogo
                            team={firstTeam}
                          />

                          <span className="font-semibold text-white">
                            {
                              matchup.firstTeam
                            }
                          </span>

                          <span className="text-gray-500">
                            {matchup.homeOrAway ===
                            "@"
                              ? "@"
                              : "vs"}
                          </span>

                          <TeamLogo
                            team={secondTeam}
                          />

                          <span className="font-semibold text-white">
                            {
                              matchup.secondTeam
                            }
                          </span>
                        </div>
                      ) : (
                        <span className="font-medium text-white">
                          {game.MATCHUP}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={
                          game.WL === "W"
                            ? "font-semibold text-green-400"
                            : "font-semibold text-red-400"
                        }
                      >
                        {game.WL}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-300">
                      {formatMinutes(
                        game.MIN
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-300">
                      {game.FGM}-
                      {game.FGA}{" "}
                      <span className="text-gray-500">
                        (
                        {formatPercentage(
                          game.FG_PCT
                        )}
                        )
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-300">
                      {game.FG3M}-
                      {game.FG3A}{" "}
                      <span className="text-gray-500">
                        (
                        {formatPercentage(
                          game.FG3_PCT
                        )}
                        )
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-300">
                      {game.FTM}-
                      {game.FTA}{" "}
                      <span className="text-gray-500">
                        (
                        {formatPercentage(
                          game.FT_PCT
                        )}
                        )
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-300">
                      {game.REB}
                    </td>

                    <td className="px-5 py-4 text-gray-300">
                      {game.AST}
                    </td>

                    <td className="px-5 py-4 text-gray-300">
                      {game.STL}
                    </td>

                    <td className="px-5 py-4 text-gray-300">
                      {game.BLK}
                    </td>

                    <td className="px-5 py-4 text-gray-300">
                      {game.TOV}
                    </td>

                    <td className="px-5 py-4 text-lg font-bold text-white">
                      {game.PTS}
                    </td>

                    <td
                      className={`px-5 py-4 font-semibold ${
                        game.PLUS_MINUS >
                        0
                          ? "text-green-400"
                          : game.PLUS_MINUS <
                            0
                          ? "text-red-400"
                          : "text-gray-400"
                      }`}
                    >
                      {game.PLUS_MINUS >
                      0
                        ? `+${game.PLUS_MINUS}`
                        : game.PLUS_MINUS}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-bold text-blue-400">
                        {game.fantasyScore.toFixed(
                          1
                        )}
                      </span>
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-800 px-5 py-3 text-xs text-gray-600">
        * Projection currently uses the
        average fantasy score from the last
        10 games. This is a temporary
        projection method.
      </div>
    </div>
  );
}