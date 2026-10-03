"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_SCORING_FORMULA,
  ScoringFormula,
} from "./scoring";

const STORAGE_KEY =
  "fantasy-nba-scoring-formula";

function readScoringFormula(): ScoringFormula {
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

    const parsed = JSON.parse(stored);

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

export function useScoringFormula() {
  const [formula, setFormula] =
    useState<ScoringFormula>(
      DEFAULT_SCORING_FORMULA
    );

  useEffect(() => {
    setFormula(readScoringFormula());
  }, []);

  return formula;
}