import SeasonAccordion from "./SeasonAccordion";

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

type PlayerResponse = {
  data: {
    player: Player;
    seasons: Season[];
  };
};

async function getPlayer(
  id: string
): Promise<PlayerResponse> {
  const response = await fetch(
    `http://localhost:3000/api/players/${id}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load player");
  }

  return response.json();
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const response = await getPlayer(id);

  const { player, seasons } = response.data;

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Back */}
        <a
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
        >
          ← Back to players
        </a>

        {/* Player Header */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
          <div className="border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-950 px-6 py-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-800 ring-4 ring-blue-500/10">
                  <img
                    src={`https://cdn.nba.com/headshots/nba/latest/260x190/${player.id}.png`}
                    alt={player.full_name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400">
                      {player.position || "—"}
                    </span>

                    <span className="text-sm text-gray-500">
                      #{player.jersey_number || "—"}
                    </span>
                  </div>

                  <h1 className="text-3xl font-bold tracking-tight">
                    {player.full_name}
                  </h1>

                  <p className="mt-1 text-sm text-gray-400">
                    {player.team.full_name}
                  </p>
                </div>
              </div>

              {/* Current Team */}
              <div className="rounded-xl border border-gray-800 bg-gray-950/60 px-5 py-4">
                <div className="text-xs uppercase tracking-wider text-gray-500">
                  Current Team
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-gray-800">
                    <img
                      src={`https://cdn.nba.com/logos/nba/${player.team.id}/primary/L/logo.svg`}
                      alt={player.team.full_name}
                      className="h-8 w-8 object-contain"
                    />
                  </div>

                  <div>
                    <div className="text-lg font-semibold">
                      {player.team.abbreviation}
                    </div>

                    <div className="text-xs text-gray-500">
                      {player.team.full_name}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Player Information */}
          <div className="grid grid-cols-2 gap-px bg-gray-800 md:grid-cols-4">
            <div className="bg-gray-900 px-5 py-4">
              <div className="text-xs text-gray-500">
                Height
              </div>

              <div className="mt-1 font-semibold">
                {player.height || "—"}
              </div>
            </div>

            <div className="bg-gray-900 px-5 py-4">
              <div className="text-xs text-gray-500">
                Weight
              </div>

              <div className="mt-1 font-semibold">
                {player.weight
                  ? `${player.weight} lbs`
                  : "—"}
              </div>
            </div>

            <div className="bg-gray-900 px-5 py-4">
              <div className="text-xs text-gray-500">
                College
              </div>

              <div className="mt-1 truncate font-semibold">
                {player.college || "—"}
              </div>
            </div>

            <div className="bg-gray-900 px-5 py-4">
              <div className="text-xs text-gray-500">
                Draft
              </div>

              <div className="mt-1 font-semibold">
                {player.draft_year
                  ? `${player.draft_year} • Round ${player.draft_round} • Pick ${player.draft_number}`
                  : "—"}
              </div>
            </div>
          </div>
        </section>

        {/* Season Statistics */}
        <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
          <div className="border-b border-gray-800 px-6 py-5">
            <h2 className="text-xl font-bold">
              Season Statistics
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Click a season to view every game, or open the season for a dedicated page.
            </p>
          </div>

          <div>
            {[...seasons].reverse().map(
              (season, index) => (
                <SeasonAccordion
                  key={`${season.SEASON_ID}-${season.TEAM_ABBREVIATION}-${index}`}
                  playerId={id}
                  season={season}
                />
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}