import { NextResponse } from "next/server";

export async function GET() {
  try {
    const playerId = "1630173";

    const url =
      "https://stats.nba.com/stats/playerindex" +
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
      "&HoF=" +
      "&PlayerID=" +
      playerId;

    const response = await fetch(url, {
      headers: {
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153.0.0.0 Safari/537.36",
        Referer: "https://www.nba.com/",
        Origin: "https://www.nba.com",
      },
      cache: "no-store",
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          status: response.status,
          details: text.slice(0, 1000),
        },
        { status: response.status }
      );
    }

    const data = JSON.parse(text);

    return NextResponse.json({
      success: true,
      status: response.status,
      resultSets: data.resultSets?.map(
        (set: any) => ({
          name: set.name,
          headers: set.headers,
          rowCount: set.rowSet?.length ?? 0,
          firstRows: set.rowSet?.slice(0, 5),
        })
      ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}