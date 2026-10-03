import { NextResponse } from "next/server";

const NBA_URL =
  "https://stats.nba.com/stats/commonallplayers";

export async function GET() {
  try {
    const url =
      `${NBA_URL}` +
      "?LeagueID=00" +
      "&Season=2026-27" +
      "&IsOnlyCurrentSeason=1";

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
        revalidate: 86400,
      },
    });

    const text = await response.text();

    if (!response.ok) {
      console.error(
        "NBA.com teams error:",
        response.status,
        text
      );

      return NextResponse.json(
        {
          error: "Failed to load NBA teams",
          details: text.slice(0, 1000),
        },
        { status: response.status }
      );
    }

    const data = JSON.parse(text);

    const resultSet = data.resultSets?.find(
      (set: { name: string }) =>
        set.name === "CommonAllPlayers"
    );

    if (!resultSet) {
      return NextResponse.json(
        {
          error: "NBA team data was not found",
        },
        { status: 500 }
      );
    }

    const teamsMap = new Map<
      number,
      {
        id: number;
        city: string;
        name: string;
        full_name: string;
        abbreviation: string;
      }
    >();

    for (const player of resultSet.rowSet ?? []) {
      const teamId = player[8];

      if (!teamId || teamsMap.has(teamId)) {
        continue;
      }

      teamsMap.set(teamId, {
        id: teamId,
        city: player[9],
        name: player[10],
        full_name: `${player[9]} ${player[10]}`,
        abbreviation: player[11],
      });
    }

    const teams = Array.from(teamsMap.values()).sort(
      (a, b) => a.full_name.localeCompare(b.full_name)
    );

    return NextResponse.json({
      data: teams,
      meta: {
        total: teams.length,
      },
    });
  } catch (error) {
    console.error("NBA teams API error:", error);

    return NextResponse.json(
      {
        error: "Failed to load NBA teams",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}