"use client";

import { useEffect, useState } from "react";
import GameLog from "./GameLog";
import FantasySummary from "./FantasySummary";

type Season = {
  SEASON_ID: string;
  TEAM_ABBREVIATION: string;
  PLAYER_AGE: number;
  GP: number;
  GS: number;
  MIN: number;
  FG_PCT: number;
  FG3_PCT: number;
  FT_PCT: number;
  REB: number;
  AST: number;
  STL: number;
  BLK: number;
  TOV: number;
  PTS: number;
};

type Game = Record<string, unknown>;

type Props = {
  playerId: string;
  season: Season;
};

export default function SeasonAccordion({
  playerId,
  season,
}: Props) {
  const [isOpen, setIsOpen] =
    useState(false);

  const [games, setGames] =
    useState<Game[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadGames() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/players/${playerId}/games?season=${encodeURIComponent(
            season.SEASON_ID
          )}`
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Failed to load games"
          );
        }

        if (!cancelled) {
          setGames(
            data?.data?.games ?? []
          );
        }
      } catch (err) {
        console.error(
          "Season game log error:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load games"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadGames();

    return () => {
      cancelled = true;
    };
  }, [playerId, season.SEASON_ID]);

  return (
    <div className="border-b border-gray-800 last:border-b-0">
      {/* Season Row */}
      <div className="px-6 py-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          {/* Season / Expand */}
          <button
            type="button"
            onClick={() =>
              setIsOpen(
                (current) => !current
              )
            }
            className="flex min-w-0 flex-1 items-center gap-4 text-left"
          >
            <span
              className={`shrink-0 text-gray-500 transition-transform ${
                isOpen
                  ? "rotate-90"
                  : ""
              }`}
            >
              ▶
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-lg font-semibold">
                  {season.SEASON_ID}
                </span>

                <span className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-xs font-medium text-gray-300">
                  {season.TEAM_ABBREVIATION}
                </span>
              </div>

              <div className="mt-1 text-sm text-gray-500">
                Age {season.PLAYER_AGE}
              </div>
            </div>
          </button>

          {/* Traditional Stats */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4 lg:flex lg:items-center lg:gap-6">
            <div>
              <div className="text-xs text-gray-500">
                GP
              </div>

              <div className="mt-1 font-semibold">
                {season.GP}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500">
                PPG
              </div>

              <div className="mt-1 font-semibold">
                {season.PTS?.toFixed(1)}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500">
                RPG
              </div>

              <div className="mt-1 font-semibold">
                {season.REB?.toFixed(1)}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500">
                APG
              </div>

              <div className="mt-1 font-semibold">
                {season.AST?.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Fantasy Stats */}
          <div className="lg:min-w-[390px]">
            {loading ? (
              <div className="text-sm text-gray-500">
                Loading fantasy...
              </div>
            ) : (
              <FantasySummary
                games={games}
                gamesPlayed={season.GP}
              />
            )}
          </div>

          {/* View Season */}
          <a
            href={`/players/${playerId}/seasons/${encodeURIComponent(
              season.SEASON_ID
            )}`}
            onClick={(event) =>
              event.stopPropagation()
            }
            className="group inline-flex shrink-0 items-center gap-1 self-start text-sm font-medium text-gray-400 transition hover:text-white lg:self-center"
          >
            <span>
              View season
            </span>

            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </a>
        </div>
      </div>

      {/* Expanded Game Log */}
      {isOpen && (
        <div className="border-t border-gray-800 bg-gray-950/40 px-6 py-6">
          <GameLog
            games={games}
            loading={loading}
            error={error}
            showFantasySummary={false}
          />

          <div className="mt-4 text-xs text-gray-600">
            * Projection currently uses the
            average fantasy score from the
            player's last 10 games. This is a
            temporary/simple projection method.
          </div>
        </div>
      )}
    </div>
  );
}