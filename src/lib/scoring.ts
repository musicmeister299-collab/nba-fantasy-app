export type ScoringFormula = {
    PTS: number;
    REB: number;
    AST: number;
    STL: number;
    BLK: number;
    TOV: number;
  };
  
  export const DEFAULT_SCORING_FORMULA: ScoringFormula = {
    PTS: 1,
    REB: 1,
    AST: 1,
    STL: 2,
    BLK: 2,
    TOV: -1,
  };
  
  export type ScoringGame = {
    PTS: number;
    REB: number;
    AST: number;
    STL: number;
    BLK: number;
    TOV: number;
  };
  
  export function calculateFantasyScore(
    game: ScoringGame,
    formula: ScoringFormula
  ) {
    return (
      game.PTS * formula.PTS +
      game.REB * formula.REB +
      game.AST * formula.AST +
      game.STL * formula.STL +
      game.BLK * formula.BLK +
      game.TOV * formula.TOV
    );
  }
  
  export function calculateAverage(
    scores: number[]
  ) {
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
  
  export function calculateMedian(
    scores: number[]
  ) {
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
  
  export function calculateProjection(
    scores: number[],
    games = 10
  ) {
    if (scores.length === 0) {
      return 0;
    }
  
    return calculateAverage(
      scores.slice(
        0,
        Math.min(games, scores.length)
      )
    );
  }
  
  export function calculateFantasyMetrics(
    games: ScoringGame[],
    formula: ScoringFormula
  ) {
    const scores = games.map((game) =>
      calculateFantasyScore(
        game,
        formula
      )
    );
  
    return {
      scores,
      average: calculateAverage(scores),
      median: calculateMedian(scores),
      projection: calculateProjection(
        scores
      ),
    };
  }