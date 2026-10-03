import { NextRequest, NextResponse } from "next/server";

const NBA_URL =
  "https://stats.nba.com/stats/playerindex";

type NBAPlayerRow = [
  number, // PERSON_ID
  string, // PLAYER_LAST_NAME
  string, // PLAYER_FIRST_NAME
  string, // PLAYER_SLUG
  number, // TEAM_ID
  string, // TEAM_SLUG
  number, // IS_DEFUNCT
  string, // TEAM_CITY
  string, // TEAM_NAME
  string, // TEAM_ABBREVIATION
  string | null, // JERSEY_NUMBER
  string | null, // POSITION
  string | null, // HEIGHT
  string | null, // WEIGHT
  string | null, // COLLEGE
  string | null, // COUNTRY
  number | null, // DRAFT_YEAR
  number | null, // DRAFT_ROUND
  number | null, // DRAFT_NUMBER
  number, // ROSTER_STATUS
  string, // FROM_YEAR
  string, // TO_YEAR
  number | null, // PTS
  number | null, // REB
  number | null, // AST
  string, // STATS_TIMEFRAME
  number // SUPPLEMENTAL_STATUS
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search =
      searchParams.get("search")?.trim().toLowerCase() ?? "";

    const teamId = searchParams.get("team_id") ?? "";

    const position =
      searchParams.get("position")?.trim().toUpperCase() ?? "";

    const url =
      `${NBA_URL}` +
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

    const response = await fetch(url, {
      headers: {
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153.0.0.0 Safari/537.36",
        Referer: "https://www.nba.com/",
        Origin: "https://www.nba.com",
      },
      next: {
        revalidate: 3600,
      },
    });

    const text = await response.text();

    if (!response.ok) {
      console.error(
        "NBA.com players error:",
        response.status,
        text
      );

      return NextResponse.json(
        {
          error: "Failed to load NBA players",
          details: text.slice(0, 1000),
        },
        { status: response.status }
      );
    }

    const data = JSON.parse(text);

    const resultSet = data.resultSets?.find(
      (set: { name: string }) =>
        set.name === "PlayerIndex"
    );

    if (!resultSet) {
      return NextResponse.json(
        {
          error: "NBA player data was not found",
        },
        { status: 500 }
      );
    }

    const players: NBAPlayerRow[] =
      resultSet.rowSet ?? [];

    const filteredPlayers = players
      .filter((player) => player[19] === 1)
      .filter((player) => {
        if (!search) {
          return true;
        }

        const fullName =
          `${player[2]} ${player[1]}`.toLowerCase();

        return fullName.includes(search);
      })
      .filter((player) => {
        if (!teamId) {
          return true;
        }

        return String(player[4]) === teamId;
      })
      .filter((player) => {
        if (!position) {
          return true;
        }

        const playerPosition =
          player[11]?.toUpperCase() ?? "";

        return playerPosition
          .split("-")
          .includes(position);
      })
      .map((player) => ({
        id: player[0],
        first_name: player[2],
        last_name: player[1],
        full_name: `${player[2]} ${player[1]}`,
        position: player[11] ?? "",
        height: player[12],
        weight: player[13],
        college: player[14],
        country: player[15],
        jersey_number: player[10],
        draft_year: player[16],
        draft_round: player[17],
        draft_number: player[18],
        roster_status: player[19],
        from_year: player[20],
        to_year: player[21],
        team: {
          id: player[4],
          city: player[7],
          name: player[8],
          full_name: `${player[7]} ${player[8]}`,
          abbreviation: player[9],
        },
      }));

    return NextResponse.json({
      data: filteredPlayers,
      meta: {
        total: filteredPlayers.length,
      },
    });
  } catch (error) {
    console.error("NBA players API error:", error);

    return NextResponse.json(
      {
        error: "Failed to load NBA players",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}