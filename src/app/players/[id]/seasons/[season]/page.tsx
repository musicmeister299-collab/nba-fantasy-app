import GameLog from "../../GameLog";
import FantasySummary from "../../FantasySummary";

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

type Player = {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  position: string | null;
  height: string | null;
  weight: string | null;
  college: string | null;
  country: string | null;
  jersey_number: string | null;
  draft_year: number | null;
  draft_round: number | null;
  draft_number: number | null;
  team: {
    id: number;
    abbreviation: string;
    name: string;
    city: string;
    full_name: string;
  };
};

import type { Game } from "../../GameTypes";

type PlayerResponse = {
  data: {
    player: Player;
    seasons: Season[];
  };
};

type GamesResponse = {
  data: {
    games: Game[];
  };
};

async function getPlayer(
  id: string
): Promise<PlayerResponse> {
  const response = await fetch(
    `https://nba-fantasy-app-alyq-gilt.vercel.app//api/players/${id}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load player");
  }

  return response.json();
}

async function getGames(
  id: string,
  season: string
): Promise<GamesResponse> {
  const response = await fetch(
    `https://nba-fantasy-app-alyq-gilt.vercel.app//api/players/${id}/games?season=${encodeURIComponent(
      season
    )}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load games");
  }

  return response.json();
}

function formatNumber(
  value: number | null | undefined,
  decimals = 1
) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return value.toFixed(decimals);
}

function formatPercent(
  value: number | null | undefined
) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return `${(value * 100).toFixed(1)}%`;
}

export default async function SeasonPage({
  params,
}: {
  params: Promise<{
    id: string;
    season: string;
  }>;
}) {
  const { id, season: seasonParam } =
    await params;

  const season = decodeURIComponent(
    seasonParam
  );

  const playerResponse =
    await getPlayer(id);

  const {
    player,
    seasons,
  } = playerResponse.data;

  const seasonStats = seasons.find(
    (item) =>
      item.SEASON_ID === season
  );

  if (!seasonStats) {
    return (
      <main className="min-h-screen bg-gray-950 px-4 py-8 text-white">
        <div className="mx-auto max-w-7xl">
          <a
            href={`/players/${id}`}
            className="text-sm text-gray-400 transition hover:text-white"
          >
            ← Back to player
          </a>

          <div className="mt-8 rounded-2xl border border-gray-800 bg-gray-900 p-8">
            <h1 className="text-2xl font-bold">
              Season not found
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              No statistics were found for{" "}
              {season}.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const gamesResponse =
    await getGames(id, season);

  const games =
    gamesResponse.data.games ?? [];

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Back */}
        <a
          href={`/players/${id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
        >
          ← {player.full_name}
        </a>

        {/* Season Header */}
        <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
          <div className="border-b border-gray-800 px-6 py-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-800">
                  <img
                    src={`https://cdn.nba.com/headshots/nba/latest/260x190/${player.id}.png`}
                    alt={player.full_name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">
                      {player.full_name}
                    </h1>

                    <span className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-xs font-medium text-gray-300">
                      {player.position || "—"}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    <span>
                      {season}
                    </span>

                    <span>•</span>

                    <span>
                      {seasonStats.TEAM_ABBREVIATION}
                    </span>

                    <span>•</span>

                    <span>
                      {player.team.full_name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-6">
                <div>
                  <div className="text-xs text-gray-500">
                    GP
                  </div>
                  <div className="mt-1 text-xl font-semibold">
                    {seasonStats.GP}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">
                    PPG
                  </div>
                  <div className="mt-1 text-xl font-semibold">
                    {formatNumber(
                      seasonStats.PTS
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">
                    RPG
                  </div>
                  <div className="mt-1 text-xl font-semibold">
                    {formatNumber(
                      seasonStats.REB
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">
                    APG
                  </div>
                  <div className="mt-1 text-xl font-semibold">
                    {formatNumber(
                      seasonStats.AST
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fantasy */}
          <div className="border-b border-gray-800 px-6 py-5">
            <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Fantasy
            </div>

            <FantasySummary
              games={games}
              gamesPlayed={seasonStats.GP}
            />
          </div>

          {/* Season Stats */}
          <div className="px-6 py-5">
            <div className="mb-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Season Stats
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4 lg:grid-cols-8">
              <div>
                <div className="text-xs text-gray-500">
                  GP
                </div>
                <div className="mt-1 font-semibold">
                  {seasonStats.GP}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">
                  GS
                </div>
                <div className="mt-1 font-semibold">
                  {seasonStats.GS}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">
                  MPG
                </div>
                <div className="mt-1 font-semibold">
                  {formatNumber(
                    seasonStats.MIN
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">
                  FG%
                </div>
                <div className="mt-1 font-semibold">
                  {formatPercent(
                    seasonStats.FG_PCT
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">
                  3P%
                </div>
                <div className="mt-1 font-semibold">
                  {formatPercent(
                    seasonStats.FG3_PCT
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">
                  FT%
                </div>
                <div className="mt-1 font-semibold">
                  {formatPercent(
                    seasonStats.FT_PCT
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">
                  STL
                </div>
                <div className="mt-1 font-semibold">
                  {formatNumber(
                    seasonStats.STL
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">
                  BLK
                </div>
                <div className="mt-1 font-semibold">
                  {formatNumber(
                    seasonStats.BLK
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">
                  TOV
                </div>
                <div className="mt-1 font-semibold">
                  {formatNumber(
                    seasonStats.TOV
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">
                  REB
                </div>
                <div className="mt-1 font-semibold">
                  {formatNumber(
                    seasonStats.REB
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">
                  AST
                </div>
                <div className="mt-1 font-semibold">
                  {formatNumber(
                    seasonStats.AST
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">
                  PTS
                </div>
                <div className="mt-1 font-semibold">
                  {formatNumber(
                    seasonStats.PTS
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Game Log */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
          <div className="flex flex-col gap-2 border-b border-gray-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">
                Game Log
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Every regular-season game from{" "}
                {season}.
              </p>
            </div>

            <div className="text-sm text-gray-500">
              {games.length} games
            </div>
          </div>

          <div className="px-6 py-6">
            <GameLog
              games={games}
              loading={false}
              error={undefined}
              showFantasySummary={false}
            />

            <div className="mt-4 text-xs text-gray-600">
              * Projection currently uses the
              average fantasy score from the
              player's last 10 games. This is a
              temporary/simple projection method.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}