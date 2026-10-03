"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ScoringFormula } from "@/lib/scoring";
import { useScoringFormula } from "@/lib/useScoringFormula";

type Team = {
  id: number;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
};

type Player = {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  height: string | null;
  weight: string | null;
  jersey_number: string | null;
  college: string | null;
  country: string | null;
  draft_year: number | null;
  draft_round: number | null;
  draft_number: number | null;
  team: Team;
};

type FantasyPlayer = {
  player: {
    id: number;
    full_name: string;
    position: string | null;
    team: {
      id: number | null;
      abbreviation: string;
      name: string;
    };
  };
  season: string;
  games_played: number;
  avg_score: number;
  median_score: number;
  projected_score: number;
};

type FantasyResponse = {
  data: FantasyPlayer[];
  meta?: {
    total_players?: number;
    total_games?: number;
    formula?: ScoringFormula;
    projection?: {
      method: string;
      temporary: boolean;
    };
  };
};

type SortKey =
  | "name"
  | "position"
  | "team"
  | "avg"
  | "median"
  | "projection"
  | "games"
  | "availability"
  | "value";

type SortDirection =
  | "asc"
  | "desc";

const REFERENCE_GAMES = 82;

function formatScore(value: number) {
  return value.toFixed(1);
}

function formatPercentage(value: number) {
  return `${value.toFixed(0)}%`;
}

function getPlayerName(player: Player) {
  return `${player.first_name} ${player.last_name}`;
}

function getAvailabilityFactor(
  gamesPlayed: number
) {
  const availability =
    Math.min(
      Math.max(
        gamesPlayed,
        0
      ),
      REFERENCE_GAMES
    ) / REFERENCE_GAMES;

  return (
    0.5 +
    0.5 * availability
  );
}

function getFantasyValue(
  avgScore: number,
  gamesPlayed: number
) {
  return (
    avgScore *
    getAvailabilityFactor(
      gamesPlayed
    )
  );
}

function getAvailabilityPercentage(
  gamesPlayed: number
) {
  return (
    (Math.min(
      Math.max(
        gamesPlayed,
        0
      ),
      REFERENCE_GAMES
    ) /
      REFERENCE_GAMES) *
    100
  );
}

export default function Home() {
  const scoringFormula =
    useScoringFormula();

  const [teams, setTeams] =
    useState<Team[]>([]);

  const [players, setPlayers] =
    useState<Player[]>([]);

  const [fantasyPlayers, setFantasyPlayers] =
    useState<FantasyPlayer[]>([]);

  const [search, setSearch] =
    useState("");

  const [teamId, setTeamId] =
    useState("");

  const [position, setPosition] =
    useState("");

  const [loadingPlayers, setLoadingPlayers] =
    useState(true);

  const [loadingFantasy, setLoadingFantasy] =
    useState(true);

  const [error, setError] =
    useState("");

  const [sortKey, setSortKey] =
    useState<SortKey>("value");

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");

  /*
   * Keep the six scoring values primitive.
   *
   * This prevents the fantasy request from being
   * restarted just because a formula object gets
   * recreated.
   */
  const PTS = scoringFormula.PTS;
  const REB = scoringFormula.REB;
  const AST = scoringFormula.AST;
  const STL = scoringFormula.STL;
  const BLK = scoringFormula.BLK;
  const TOV = scoringFormula.TOV;

  /*
   * Request counter.
   *
   * If a newer scoring request starts before an older
   * request finishes, the older response is ignored.
   */
  const fantasyRequestId =
    useRef(0);

  async function loadTeams() {
    try {
      const response =
        await fetch("/api/teams");

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.details ||
            result?.error ||
            "Failed to load teams"
        );
      }

      setTeams(
        result.data ?? []
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load teams"
      );
    }
  }

  async function loadPlayers() {
    try {
      setLoadingPlayers(true);

      const response =
        await fetch(
          "/api/players?per_page=1000"
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.details ||
            result?.error ||
            "Failed to load players"
        );
      }

      setPlayers(
        result.data ?? []
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load players"
      );
    } finally {
      setLoadingPlayers(false);
    }
  }

  async function loadFantasy(
    currentFormula: ScoringFormula
  ) {
    const requestId =
      ++fantasyRequestId.current;

    try {
      setLoadingFantasy(true);

      const params =
        new URLSearchParams();

      params.set(
        "PTS",
        String(currentFormula.PTS)
      );

      params.set(
        "REB",
        String(currentFormula.REB)
      );

      params.set(
        "AST",
        String(currentFormula.AST)
      );

      params.set(
        "STL",
        String(currentFormula.STL)
      );

      params.set(
        "BLK",
        String(currentFormula.BLK)
      );

      params.set(
        "TOV",
        String(currentFormula.TOV)
      );

      const response =
        await fetch(
          `/api/fantasy/players?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

      const result: FantasyResponse & {
        error?: string;
        details?: string;
      } =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.details ||
            result.error ||
            "Failed to load fantasy data"
        );
      }

      /*
       * Only the newest request is allowed
       * to update the table.
       */
      if (
        requestId !==
        fantasyRequestId.current
      ) {
        return;
      }

      setFantasyPlayers(
        result.data ?? []
      );
    } catch (error) {
      /*
       * Ignore stale requests.
       */
      if (
        requestId !==
        fantasyRequestId.current
      ) {
        return;
      }

      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load fantasy data"
      );
    } finally {
      if (
        requestId ===
        fantasyRequestId.current
      ) {
        setLoadingFantasy(false);
      }
    }
  }

  /*
   * Load static player/team data once.
   */
  useEffect(() => {
    loadTeams();
    loadPlayers();
  }, []);

  /*
   * Fantasy data only reloads when one of the
   * six actual scoring numbers changes.
   *
   * Scrolling cannot trigger this effect.
   */
  useEffect(() => {
    loadFantasy({
      PTS,
      REB,
      AST,
      STL,
      BLK,
      TOV,
    });
  }, [
    PTS,
    REB,
    AST,
    STL,
    BLK,
    TOV,
  ]);

  const fantasyByPlayerId =
    useMemo(() => {
      const map = new Map<
        number,
        FantasyPlayer
      >();

      for (
        const player of fantasyPlayers
      ) {
        map.set(
          player.player.id,
          player
        );
      }

      return map;
    }, [fantasyPlayers]);

  const mergedPlayers =
    useMemo(() => {
      return players
        .map((player) => {
          const fantasy =
            fantasyByPlayerId.get(
              player.id
            );

          if (!fantasy) {
            return null;
          }

          const gamesPlayed =
            fantasy.games_played;

          const availability =
            getAvailabilityPercentage(
              gamesPlayed
            );

          const availabilityFactor =
            getAvailabilityFactor(
              gamesPlayed
            );

          const fantasyValue =
            getFantasyValue(
              fantasy.avg_score,
              gamesPlayed
            );

          return {
            player,
            fantasy,
            gamesPlayed,
            availability,
            availabilityFactor,
            fantasyValue,
          };
        })
        .filter(
          (
            value
          ): value is {
            player: Player;
            fantasy: FantasyPlayer;
            gamesPlayed: number;
            availability: number;
            availabilityFactor: number;
            fantasyValue: number;
          } =>
            value !== null
        );
    }, [
      players,
      fantasyByPlayerId,
    ]);

  const filteredPlayers =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      const filtered =
        mergedPlayers.filter(
          ({ player }) => {
            if (
              searchValue &&
              !getPlayerName(player)
                .toLowerCase()
                .includes(
                  searchValue
                )
            ) {
              return false;
            }

            if (
              teamId &&
              String(
                player.team?.id
              ) !== teamId
            ) {
              return false;
            }

            if (
              position &&
              player.position !==
                position
            ) {
              return false;
            }

            return true;
          }
        );

      const positionOrder: Record<
        string,
        number
      > = {
        G: 1,
        F: 2,
        C: 3,
      };

      return [...filtered].sort(
        (a, b) => {
          let comparison = 0;

          switch (sortKey) {
            case "name":
              comparison =
                getPlayerName(
                  a.player
                ).localeCompare(
                  getPlayerName(
                    b.player
                  )
                );
              break;

            case "position": {
              const aPosition =
                positionOrder[
                  a.player.position ||
                    ""
                ] ?? 99;

              const bPosition =
                positionOrder[
                  b.player.position ||
                    ""
                ] ?? 99;

              comparison =
                aPosition -
                bPosition;

              break;
            }

            case "team":
              comparison =
                (
                  a.player.team
                    ?.full_name ||
                  ""
                ).localeCompare(
                  b.player.team
                    ?.full_name ||
                  ""
                );
              break;

            case "avg":
              comparison =
                a.fantasy.avg_score -
                b.fantasy.avg_score;
              break;

            case "median":
              comparison =
                a.fantasy
                  .median_score -
                b.fantasy
                  .median_score;
              break;

            case "projection":
              comparison =
                a.fantasy
                  .projected_score -
                b.fantasy
                  .projected_score;
              break;

            case "games":
              comparison =
                a.gamesPlayed -
                b.gamesPlayed;
              break;

            case "availability":
              comparison =
                a.availability -
                b.availability;
              break;

            case "value":
              comparison =
                a.fantasyValue -
                b.fantasyValue;
              break;
          }

          return sortDirection ===
            "asc"
            ? comparison
            : -comparison;
        }
      );
    }, [
      mergedPlayers,
      search,
      teamId,
      position,
      sortKey,
      sortDirection,
    ]);

  const isLoading =
    loadingPlayers ||
    loadingFantasy;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-[1600px] px-6 py-10">

        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              NBA Fantasy
            </h1>

            <p className="mt-2 text-gray-400">
              NBA Player Database
            </p>
          </div>

          <Link
            href="/settings/scoring"
            className="inline-flex items-center justify-center rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-gray-600 hover:bg-gray-800 hover:text-white"
          >
            Scoring Settings
          </Link>
        </header>

        <section className="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="grid gap-4 md:grid-cols-4">

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Player
              </label>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search player..."
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Team
              </label>

              <select
                value={teamId}
                onChange={(event) =>
                  setTeamId(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                <option value="">
                  {teams.length === 0
                    ? "Loading teams..."
                    : "All teams"}
                </option>

                {teams.map(
                  (team) => (
                    <option
                      key={team.id}
                      value={team.id}
                    >
                      {team.full_name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Position
              </label>

              <select
                value={position}
                onChange={(event) =>
                  setPosition(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                <option value="">
                  All positions
                </option>

                <option value="G">
                  Guard
                </option>

                <option value="F">
                  Forward
                </option>

                <option value="C">
                  Center
                </option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setTeamId("");
                  setPosition("");
                }}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 font-semibold text-gray-300 transition hover:bg-gray-700 hover:text-white"
              >
                Clear Filters
              </button>
            </div>

          </div>
        </section>

        <section className="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-5">

          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Sorting
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Fantasy Value accounts for both
              per-game production and availability.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-300">
                Sort by
              </label>

              <select
                value={sortKey}
                onChange={(event) =>
                  setSortKey(
                    event.target
                      .value as SortKey
                  )
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                <option value="value">
                  Fantasy Value
                </option>

                <option value="avg">
                  Avg Score
                </option>

                <option value="median">
                  Median Score
                </option>

                <option value="projection">
                  Projection
                </option>

                <option value="games">
                  Games Played
                </option>

                <option value="availability">
                  Availability
                </option>

                <option value="name">
                  Player Name
                </option>

                <option value="position">
                  Position
                </option>

                <option value="team">
                  Team
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-300">
                Order
              </label>

              <select
                value={sortDirection}
                onChange={(event) =>
                  setSortDirection(
                    event.target
                      .value as SortDirection
                  )
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                <option value="desc">
                  Highest → Lowest
                </option>

                <option value="asc">
                  Lowest → Highest
                </option>
              </select>
            </div>

          </div>

          <div className="mt-4 rounded-lg border border-gray-800 bg-gray-950 p-4">
            <div className="text-sm text-gray-400">
              <span className="font-semibold text-gray-200">
                Fantasy Value
              </span>{" "}
              = Avg Score × Availability Factor
            </div>

            <div className="mt-2 text-xs text-gray-600">
              Availability Factor =
              0.5 + 0.5 × (Games Played ÷ 82)
            </div>
          </div>

        </section>

        {error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-950 p-4 text-red-300">
            {error}
          </div>
        )}

        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">

          <p className="text-gray-400">
            Players found:{" "}
            <span className="font-bold text-white">
              {filteredPlayers.length}
            </span>
          </p>

          <div className="flex items-center gap-4">
            <p className="text-xs text-gray-600">
              Season: 2025-26
            </p>

            <Link
              href="/settings/scoring"
              className="text-xs text-blue-400 transition hover:text-blue-300"
            >
              Edit scoring
            </Link>
          </div>

        </div>

        {isLoading && (
          <div className="rounded-xl border border-gray-800 bg-gray-900 px-6 py-16 text-center text-gray-400">
            Loading fantasy player data...
          </div>
        )}

        {!isLoading &&
          filteredPlayers.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/80">

              <div className="hidden border-b border-gray-800 bg-gray-950/80 px-6 py-3 md:grid md:grid-cols-[minmax(260px,2.2fr)_70px_minmax(180px,1.4fr)_90px_110px_110px_110px_120px] md:items-center md:gap-3">

                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Player
                </div>

                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Pos
                </div>

                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Team
                </div>

                <div className="text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  GP
                </div>

                <div className="text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Avail.
                </div>

                <div className="text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Avg
                </div>

                <div className="text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Proj.
                </div>

                <div className="text-right text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Value
                </div>

              </div>

              <div>
                {filteredPlayers.map(
                  ({
                    player,
                    fantasy,
                    gamesPlayed,
                    availability,
                    fantasyValue,
                  }) => (
                    <Link
                      key={player.id}
                      href={`/players/${player.id}`}
                      className="group grid w-full grid-cols-1 gap-4 border-b border-gray-800/80 px-5 py-4 text-left transition last:border-b-0 hover:bg-gray-800/50 md:grid-cols-[minmax(260px,2.2fr)_70px_minmax(180px,1.4fr)_90px_110px_110px_110px_120px] md:items-center md:gap-3 md:px-6"
                    >

                      <div className="flex min-w-0 items-center gap-4">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-800 ring-1 ring-gray-700 transition group-hover:ring-blue-500">

                          <img
                            src={`https://cdn.nba.com/headshots/nba/latest/260x190/${player.id}.png`}
                            alt={getPlayerName(
                              player
                            )}
                            className="h-full w-full object-cover"
                          />

                        </div>

                        <div className="min-w-0">

                          <div className="truncate text-[15px] font-semibold text-white transition group-hover:text-blue-400">
                            {getPlayerName(
                              player
                            )}
                          </div>

                          <div className="mt-0.5 text-xs text-gray-500">
                            NBA ID{" "}
                            {player.id}
                          </div>

                        </div>

                      </div>

                      <div>
                        <span className="inline-flex min-w-[42px] justify-center rounded-md border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400">
                          {player.position ||
                            "—"}
                        </span>
                      </div>

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-800 ring-1 ring-gray-700">

                          {player.team?.id ? (
                            <img
                              src={`https://cdn.nba.com/logos/nba/${player.team.id}/primary/L/logo.svg`}
                              alt={
                                player.team
                                  ?.full_name ||
                                "Team"
                              }
                              className="h-7 w-7 object-contain"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400">
                              —
                            </span>
                          )}

                        </div>

                        <div className="min-w-0">

                          <div className="truncate text-sm font-medium text-gray-200">
                            {player.team
                              ?.full_name ||
                              "Team unknown"}
                          </div>

                        </div>

                      </div>

                      <div className="text-right">

                        <div className="text-xs text-gray-500 md:hidden">
                          GP
                        </div>

                        <div className="text-base font-semibold text-gray-200">
                          {gamesPlayed}
                        </div>

                      </div>

                      <div className="text-right">

                        <div className="text-xs text-gray-500 md:hidden">
                          Availability
                        </div>

                        <div className="text-base font-semibold text-gray-300">
                          {formatPercentage(
                            availability
                          )}
                        </div>

                      </div>

                      <div className="text-right">

                        <div className="text-xs text-gray-500 md:hidden">
                          Avg Score
                        </div>

                        <div className="text-base font-semibold text-white">
                          {formatScore(
                            fantasy.avg_score
                          )}
                        </div>

                      </div>

                      <div className="text-right">

                        <div className="text-xs text-gray-500 md:hidden">
                          Projection
                        </div>

                        <div className="text-base font-semibold text-gray-300">
                          {formatScore(
                            fantasy.projected_score
                          )}
                        </div>

                      </div>

                      <div className="text-right">

                        <div className="text-xs text-gray-500 md:hidden">
                          Fantasy Value
                        </div>

                        <div className="text-lg font-bold text-blue-400">
                          {formatScore(
                            fantasyValue
                          )}
                        </div>

                      </div>

                    </Link>
                  )
                )}
              </div>

            </div>
          )}

        {!isLoading &&
          filteredPlayers.length === 0 &&
          !error && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-10 text-center text-gray-400">
              No players found.
            </div>
          )}

        <div className="mt-5 text-xs leading-5 text-gray-600">
          Fantasy Value applies a soft availability
          adjustment to Avg Score. A player who
          misses games receives a lower value, but
          the penalty is intentionally gradual rather
          than treating every missed game as a direct
          loss of fantasy production.
        </div>

        <div className="mt-1 text-xs text-gray-600">
          Availability is based on games played in
          the 2025-26 regular season, using 82 games
          as the reference season length.
        </div>

        <div className="mt-1 text-xs text-gray-600">
          * Projection currently uses the average
          fantasy score from the player's last 10
          games. This is a temporary projection
          method.
        </div>

      </div>
    </main>
  );
}