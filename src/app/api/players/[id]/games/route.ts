import { NextRequest, NextResponse } from "next/server";

const NBA_PLAYER_GAME_LOG_URL =
  "https://stats.nba.com/stats/playergamelog";

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

    const season =
      request.nextUrl.searchParams.get(
        "season"
      );

    if (!id) {
      return NextResponse.json(
        {
          error: "Player ID is required",
        },
        { status: 400 }
      );
    }

    if (!season) {
      return NextResponse.json(
        {
          error: "Season is required",
        },
        { status: 400 }
      );
    }

    const url =
      `${NBA_PLAYER_GAME_LOG_URL}` +
      `?PlayerID=${encodeURIComponent(id)}` +
      `&Season=${encodeURIComponent(season)}` +
      "&SeasonType=Regular%20Season";

    const response = await fetch(url, {
      headers: NBA_HEADERS,

      next: {
        revalidate: 3600,
      },
    });

    const text =
      await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            "Failed to load player game log",
          details: text.slice(0, 2000),
        },
        {
          status: response.status,
        }
      );
    }

    const data = JSON.parse(text);

    const gameLog =
      data.resultSets?.find(
        (set: { name: string }) =>
          set.name === "PlayerGameLog"
      );

    const headers =
      gameLog?.headers ?? [];

    const rows =
      gameLog?.rowSet ?? [];

    const games = rows.map(
      (row: unknown[]) => {
        const game: Record<
          string,
          unknown
        > = {};

        headers.forEach(
          (
            header: string,
            index: number
          ) => {
            game[header] =
              row[index];
          }
        );

        return game;
      }
    );

    return NextResponse.json(
      {
        data: {
          player_id: id,
          season,
          games,
        },

        meta: {
          total_games: games.length,
        },
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error(
      "NBA player game log API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load player game log",

        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}