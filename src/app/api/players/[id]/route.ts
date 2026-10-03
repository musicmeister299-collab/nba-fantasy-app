import { NextRequest, NextResponse } from "next/server";

const NBA_PLAYER_INDEX_URL =
  "https://stats.nba.com/stats/playerindex";

const NBA_PLAYER_CAREER_URL =
  "https://stats.nba.com/stats/playercareerstats";

const NBA_HEADERS = {
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153.0.0.0 Safari/537.36",
  Referer: "https://www.nba.com/",
  Origin: "https://www.nba.com",
};

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Player ID is required",
        },
        { status: 400 }
      );
    }

    /*
     * Get player information from PlayerIndex.
     */
    const playerIndexUrl =
      `${NBA_PLAYER_INDEX_URL}` +
      "?LeagueID=00" +
      "&Season=2026-27" +
      "&PlayerExperience=" +
      "&PlayerPosition=" +
      "&Height=" +
      "&Weight=" +
      "&College=" +
      "&Country=" +
      "&DraftYear=" +
      "&DraftPick=" +
      "&DraftTeamID=" +
      "&TeamID=" +
      "&Historical=" +
      "&AllStar=" +
      "&RookieYear=" +
      "&HoF=";

    const playerResponse = await fetch(
      playerIndexUrl,
      {
        headers: NBA_HEADERS,
        next: {
          revalidate: 3600,
        },
      }
    );

    const playerText = await playerResponse.text();

    if (!playerResponse.ok) {
      return NextResponse.json(
        {
          error: "Failed to load player information",
          details: playerText.slice(0, 1000),
        },
        { status: playerResponse.status }
      );
    }

    const playerData = JSON.parse(playerText);

    const playerResultSet =
      playerData.resultSets?.find(
        (set: { name: string }) =>
          set.name === "PlayerIndex"
      );

    const playerRow = (
      playerResultSet?.rowSet ?? []
    ).find(
      (player: unknown[]) =>
        String(player[0]) === id
    );

    if (!playerRow) {
      return NextResponse.json(
        {
          error: "Player not found",
        },
        { status: 404 }
      );
    }

    /*
     * Get the player's career statistics.
     */
    const careerUrl =
      `${NBA_PLAYER_CAREER_URL}` +
      `?PlayerID=${encodeURIComponent(id)}` +
      "&PerMode=PerGame" +
      "&LeagueID=00";

    const careerResponse = await fetch(
      careerUrl,
      {
        headers: NBA_HEADERS,
        next: {
          revalidate: 3600,
        },
      }
    );

    const careerText =
      await careerResponse.text();

    if (!careerResponse.ok) {
      return NextResponse.json(
        {
          error: "Failed to load player statistics",
          details: careerText.slice(0, 1000),
        },
        { status: careerResponse.status }
      );
    }

    const careerData =
      JSON.parse(careerText);

    const regularSeason =
      careerData.resultSets?.find(
        (set: { name: string }) =>
          set.name ===
          "SeasonTotalsRegularSeason"
      );

    const headers =
      regularSeason?.headers ?? [];

    const rows =
      regularSeason?.rowSet ?? [];

    /*
     * Convert NBA.com's array-based data
     * into easier-to-use objects.
     */
    const seasons = rows
      .filter(
        (row: unknown[]) =>
          row[4] !== "TOT"
      )
      .map((row: unknown[]) => {
        const season: Record<
          string,
          unknown
        > = {};

        headers.forEach(
          (header: string, index: number) => {
            season[header] = row[index];
          }
        );

        return season;
      });

    const player = {
      id: playerRow[0],
      first_name: playerRow[2],
      last_name: playerRow[1],
      full_name: `${playerRow[2]} ${playerRow[1]}`,
      slug: playerRow[3],

      team: {
        id: playerRow[4],
        abbreviation: playerRow[9],
        name: playerRow[8],
        city: playerRow[7],
        full_name: `${playerRow[7]} ${playerRow[8]}`,
      },

      jersey_number: playerRow[10],
      position: playerRow[11],
      height: playerRow[12],
      weight: playerRow[13],
      college: playerRow[14],
      country: playerRow[15],

      draft_year: playerRow[16],
      draft_round: playerRow[17],
      draft_number: playerRow[18],

      roster_status: playerRow[19],
      from_year: playerRow[20],
      to_year: playerRow[21],
    };

    return NextResponse.json({
      data: {
        player,
        seasons,
      },
      meta: {
        total_seasons: seasons.length,
      },
    });
  } catch (error) {
    console.error(
      "NBA player detail API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load player information",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}