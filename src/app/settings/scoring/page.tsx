"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_SCORING_FORMULA,
  ScoringFormula,
} from "@/lib/scoring";

const STORAGE_KEY = "fantasy-nba-scoring-formula";

const STAT_LABELS: {
  key: keyof ScoringFormula;
  label: string;
  description: string;
}[] = [
  {
    key: "PTS",
    label: "Points",
    description: "Points scored",
  },
  {
    key: "REB",
    label: "Rebounds",
    description: "Total rebounds",
  },
  {
    key: "AST",
    label: "Assists",
    description: "Assists",
  },
  {
    key: "STL",
    label: "Steals",
    description: "Steals",
  },
  {
    key: "BLK",
    label: "Blocks",
    description: "Blocks",
  },
  {
    key: "TOV",
    label: "Turnovers",
    description: "Turnovers",
  },
];

function loadFormula(): ScoringFormula {
  if (typeof window === "undefined") {
    return DEFAULT_SCORING_FORMULA;
  }

  try {
    const stored =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (!stored) {
      return DEFAULT_SCORING_FORMULA;
    }

    const parsed = JSON.parse(
      stored
    );

    return {
      PTS:
        typeof parsed.PTS === "number"
          ? parsed.PTS
          : DEFAULT_SCORING_FORMULA.PTS,
      REB:
        typeof parsed.REB === "number"
          ? parsed.REB
          : DEFAULT_SCORING_FORMULA.REB,
      AST:
        typeof parsed.AST === "number"
          ? parsed.AST
          : DEFAULT_SCORING_FORMULA.AST,
      STL:
        typeof parsed.STL === "number"
          ? parsed.STL
          : DEFAULT_SCORING_FORMULA.STL,
      BLK:
        typeof parsed.BLK === "number"
          ? parsed.BLK
          : DEFAULT_SCORING_FORMULA.BLK,
      TOV:
        typeof parsed.TOV === "number"
          ? parsed.TOV
          : DEFAULT_SCORING_FORMULA.TOV,
    };
  } catch {
    return DEFAULT_SCORING_FORMULA;
  }
}

function formatPoints(
  value: number
) {
  if (value === 0) {
    return "0";
  }

  return Number.isInteger(value)
    ? value.toString()
    : value.toFixed(2);
}

function buildFormula(
  formula: ScoringFormula
) {
  const parts = [
    {
      label: "PTS",
      value: formula.PTS,
    },
    {
      label: "REB",
      value: formula.REB,
    },
    {
      label: "AST",
      value: formula.AST,
    },
    {
      label: "STL",
      value: formula.STL,
    },
    {
      label: "BLK",
      value: formula.BLK,
    },
    {
      label: "TOV",
      value: formula.TOV,
    },
  ];

  return parts.map(
    (part, index) => {
      const value = part.value;

      if (index === 0) {
        return `${part.label} × ${formatPoints(
          value
        )}`;
      }

      if (value < 0) {
        return `− ${part.label} × ${formatPoints(
          Math.abs(value)
        )}`;
      }

      return `+ ${part.label} × ${formatPoints(
        value
      )}`;
    }
  ).join(" ");
}

export default function ScoringSettingsPage() {
  const [formula, setFormula] =
    useState<ScoringFormula>(
      DEFAULT_SCORING_FORMULA
    );

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {
    setFormula(loadFormula());
  }, []);

  function updateValue(
    key: keyof ScoringFormula,
    value: string
  ) {
    const parsed = Number(value);

    setSaved(false);

    if (!Number.isFinite(parsed)) {
      return;
    }

    setFormula(
      (current) => ({
        ...current,
        [key]: parsed,
      })
    );
  }

  function saveSettings() {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(formula)
    );

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  function resetSettings() {
    setFormula(
      DEFAULT_SCORING_FORMULA
    );

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        DEFAULT_SCORING_FORMULA
      )
    );

    setSaved(false);
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <a
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
        >
          ← Back to players
        </a>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Scoring Settings
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Customize how fantasy points are calculated
            throughout the app.
          </p>
        </div>

        <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
          <div className="border-b border-gray-800 px-6 py-5">
            <h2 className="text-lg font-semibold">
              Fantasy Scoring
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Set the fantasy value for each statistical
              category.
            </p>
          </div>

          <div className="divide-y divide-gray-800">
            {STAT_LABELS.map(
              ({
                key,
                label,
                description,
              }) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-6 px-6 py-5"
                >
                  <div>
                    <div className="font-medium">
                      {label}
                    </div>

                    <div className="mt-1 text-sm text-gray-500">
                      {description}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm text-gray-500">
                      points
                    </span>

                    <input
                      type="number"
                      step="0.1"
                      value={formula[key]}
                      onChange={(event) =>
                        updateValue(
                          key,
                          event.target.value
                        )
                      }
                      className="h-11 w-24 rounded-lg border border-gray-700 bg-gray-950 px-3 text-right text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )
            )}
          </div>

          <div className="border-t border-gray-800 bg-gray-950/50 px-6 py-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Current Formula
            </div>

            <div className="mt-3 overflow-x-auto rounded-lg border border-gray-800 bg-gray-900 px-4 py-4">
              <div className="min-w-max font-mono text-sm text-gray-200">
                {buildFormula(formula)}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={resetSettings}
              className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-gray-600 hover:bg-gray-700 hover:text-white"
            >
              Reset to Default
            </button>

            <div className="flex items-center gap-4">
              {saved && (
                <span className="text-sm text-green-400">
                  Settings saved
                </span>
              )}

              <button
                type="button"
                onClick={saveSettings}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Save Settings
              </button>
            </div>
          </div>
        </section>

        <p className="mt-4 text-xs text-gray-600">
          These settings are saved in this browser and
          are used by the fantasy calculations in the app.
        </p>
      </div>
    </main>
  );
}