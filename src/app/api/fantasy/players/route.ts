import { NextRequest, NextResponse } from "next/server";

const NBA_PLAYER_GAME_LOGS_URL =
  "https://stats.nba.com/stats/playergamelogs";

const NBA_HEADERS = {
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153.0.0.0 Safari/537.36",
  Referer: "https://www.nba.com/",
  Origin: "https://www.nba.com",
};

type ScoringFormula = {
  PTS: number;
  REB: number;
  AST: number;
  STL: number;
  BLK: number;
  TOV: number;
};

const DEFAULT_FORMULA: ScoringFormula = {
  PTS: 1,
  REB: 1,
  AST: 1,
  STL: 2,
  BLK: 2,
  TOV: -1,
};

function getFormula(
  request: NextRequest
): ScoringFormula {
  const params =
    request.nextUrl.searchParams;

  function value(
    name: keyof ScoringFormula
  ) {
    const raw = params.get(name);

    if (raw === null || raw === "") {
      return DEFAULT_FORMULA[name];
    }

    const number = Number(raw);

    return Number.isFinite(number)
      ? number
      : DEFAULT_FORMULA[name];
  }

  return {
    PTS: value("PTS"),
    REB: value("REB"),
    AST: value("AST"),
    STL: value("STL"),
    BLK: value("BLK"),
    TOV: value("TOV"),
  };
}

function fantasyScore(
  game: Record<string, unknown>,
  formula: ScoringFormula
) {
  return (
    Number(game.PTS ?? 0) * formula.PTS +
    Number(game.REB ?? 0) * formula.REB +
    Number(game.AST ?? 0) * formula.AST +
    Number(game.STL ?? 0) * formula.STL +
    Number(game.BLK ?? 0) * formula.BLK +
    Number(game.TOV ?? 0) * formula.TOV
  );
}

function average(scores: number[]) {
  if (scores.length === 0) {
    return 0;
  }

  return (
    scores.reduce(
      (sum, score) => sum + score,
      0
    ) / scores.length
  );
}

function median(scores: number[]) {
  if (scores.length === 0) {
    return 0;
  }

  const sorted = [...scores].sort(
    (a, b) => a - b
  );

  const middle = Math.floor(
    sorted.length / 2
  );

  if (sorted.length % 2 === 0) {
    return (
      (sorted[middle - 1] +
        sorted[middle]) /
      2
    );
  }

  return sorted[middle];
}

function projection(scores: number[]) {
  return average(
    scores.slice(0, 10)
  );
}

export async function GET(
  request: NextRequest
) {
  try {
    const formula =
      getFormula(request);

    const url =
      `${NBA_PLAYER_GAME_LOGS_URL}` +
      "?DateFrom=" +
      "&DateTo=" +
      "&GameSegment=" +
      "&LastNGames=" +
      "&LeagueID=00" +
      "&Location=" +
      "&MeasureType=" +
      "&Month=" +
      "&OpposingTeamID=0" +
      "&Outcome=" +
      "&PORound=" +
      "&PerMode=Totals" +
      "&Period=0" +
      "&PlayerID=" +
      "&Season=2025-26" +
      "&SeasonSegment=" +
      "&SeasonType=Regular%20Season" +
      "&ShotClockRange=" +
      "&TeamID=" +
      "&VsConference=" +
      "&VsDivision=";

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
            "Failed to load player game logs",
          details: text.slice(0, 2000),
        },
        {
          status: response.status,
        }
      );
    }

    const data = JSON.parse(text);

    const resultSet =
      data.resultSets?.find(
        (set: { name: string }) =>
          set.name ===
          "PlayerGameLogs"
      );

    if (!resultSet) {
      return NextResponse.json(
        {
          error:
            "Player game log data was not found",
        },
        {
          status: 500,
        }
      );
    }

    const headers =
      resultSet.headers ?? [];

    const rows =
      resultSet.rowSet ?? [];

    const players = new Map<
      string,
      {
        player: Record<string, unknown>;
        games: Record<string, unknown>[];
      }
    >();

    for (const row of rows) {
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

      const playerId =
        String(
          game.PLAYER_ID ?? ""
        );

      if (!playerId) {
        continue;
      }

      if (!players.has(playerId)) {
        players.set(playerId, {
          player: game,
          games: [],
        });
      }

      players
        .get(playerId)!
        .games.push(game);
    }

    const results = [];

    for (const [
      playerId,
      value,
    ] of players) {
      const games = value.games;

      const scores = games.map(
        (game) =>
          fantasyScore(
            game,
            formula
          )
      );

      const player =
        value.player;

      results.push({
        player: {
          id: Number(playerId),

          full_name: String(
            player.PLAYER_NAME ?? ""
          ),

          position: null,

          team: {
            id:
              Number(
                player.TEAM_ID ?? 0
              ) || null,

            abbreviation:
              String(
                player.TEAM_ABBREVIATION ??
                  ""
              ),

            name:
              String(
                player.TEAM_NAME ?? ""
              ),
          },
        },

        season: "2025-26",

        games_played:
          games.length,

        avg_score:
          average(scores),

        median_score:
          median(scores),

        projected_score:
          projection(scores),
      });
    }

    return NextResponse.json(
      {
        data: results,

        meta: {
          total_players:
            results.length,

          total_games:
            rows.length,

          formula,

          projection: {
            method:
              "Last 10 games average",

            temporary: true,
          },
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
      "Fantasy players API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to calculate fantasy player data",

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