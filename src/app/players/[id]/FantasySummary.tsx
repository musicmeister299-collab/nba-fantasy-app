"use client";

import {
  calculateFantasyMetrics,
} from "@/lib/scoring";
import {
  useScoringFormula,
} from "@/lib/useScoringFormula";

type Game = Record<string, unknown>;

type Props = {
  games: Game[];
  gamesPlayed?: number;
};

const REFERENCE_GAMES = 82;

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
  average: number,
  gamesPlayed: number
) {
  return (
    average *
    getAvailabilityFactor(
      gamesPlayed
    )
  );
}

export default function FantasySummary({
  games,
  gamesPlayed = games.length,
}: Props) {
  const scoringFormula =
    useScoringFormula();

  const metrics =
    games.length > 0
      ? calculateFantasyMetrics(
          games.map((game) => ({
            PTS: Number(
              game.PTS ?? 0
            ),
            REB: Number(
              game.REB ?? 0
            ),
            AST: Number(
              game.AST ?? 0
            ),
            STL: Number(
              game.STL ?? 0
            ),
            BLK: Number(
              game.BLK ?? 0
            ),
            TOV: Number(
              game.TOV ?? 0
            ),
          })),
          scoringFormula
        )
      : null;

  const availability =
    getAvailabilityPercentage(
      gamesPlayed
    );

  const value = metrics
    ? getFantasyValue(
        metrics.average,
        gamesPlayed
      )
    : null;

  const items = [
    {
      label: "Avg",
      value: metrics
        ? metrics.average.toFixed(1)
        : "—",
      className:
        "text-blue-400",
    },
    {
      label: "Median",
      value: metrics
        ? metrics.median.toFixed(1)
        : "—",
      className:
        "text-white",
    },
    {
      label: "Proj.",
      value: metrics
        ? metrics.projection.toFixed(1)
        : "—",
      className:
        "text-white",
    },
    {
      label: "Avail.",
      value: `${availability.toFixed(
        0
      )}%`,
      className:
        "text-white",
    },
    {
      label: "Value",
      value:
        value !== null
          ? value.toFixed(1)
          : "—",
      className:
        "text-green-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3 lg:flex lg:items-center lg:gap-6">
      {items.map(
        (item) => (
          <div
            key={item.label}
          >
            <div className="text-xs text-gray-500">
              {item.label}
            </div>

            <div
              className={`mt-1 font-semibold ${item.className}`}
            >
              {item.value}
            </div>
          </div>
        )
      )}
    </div>
  );
}