import { NextResponse } from "next/server";

const NBA_URL =
  "https://stats.nba.com/stats/playercareerstats";

export async function GET() {
  try {
    // Precious Achiuwa
    const playerId = "1630173";

    const url =
      `${NBA_URL}` +
      "?PlayerID=" +
      playerId +
      "&PerMode=PerGame" +
      "&LeagueID=00";

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
          error: text.slice(0, 2000),
        },
        { status: response.status }
      );
    }

    const data = JSON.parse(text);

    return NextResponse.json({
      success: true,
      status: response.status,
      resultSets: data.resultSets,
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