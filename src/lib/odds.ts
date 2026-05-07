// Odds formula: odd = max(MIN_ODD, 1 - 0.5 * ((k-1)/(N-1))^POWER)
// k = count of people who made the same prediction
// N = total participants
// Derived from spreadsheet: k=10, N=20 → 0.7249819926053037 exactly

export const ODDS_CONFIG = {
  POWER: 0.8,
  MIN_ODD: 0.5,
  POINTS: {
    EXACT_SCORE: 10,
    WINNER: 5,
    CHAMPION: 15,
    TOP_SCORER: 15,
  },
};

export function calculateOdd(k: number, N: number): number {
  if (N <= 1) return 1.0;
  if (k <= 1) return 1.0;
  const ratio = (k - 1) / (N - 1);
  const odd = 1 - 0.5 * Math.pow(ratio, ODDS_CONFIG.POWER);
  return Math.max(ODDS_CONFIG.MIN_ODD, odd);
}

export function calculateMatchPoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number,
  k_exact: number,
  k_winner: number,
  N: number
): { points: number; type: "exact" | "winner" | "none" } {
  const isExact = predHome === actualHome && predAway === actualAway;

  const actualWinner =
    actualHome > actualAway ? "home" : actualAway > actualHome ? "away" : "draw";
  const predWinner =
    predHome > predAway ? "home" : predAway > predHome ? "away" : "draw";
  const isWinner = predWinner === actualWinner;

  if (isExact) {
    const odd = calculateOdd(k_exact, N);
    const pts = ODDS_CONFIG.POINTS.EXACT_SCORE * odd;
    return { points: pts, type: "exact" };
  }

  if (isWinner) {
    const odd = calculateOdd(k_winner, N);
    const pts = ODDS_CONFIG.POINTS.WINNER * odd;
    return { points: pts, type: "winner" };
  }

  return { points: 0, type: "none" };
}

export function calculateSpecialPoints(
  predValue: string,
  actualValue: string,
  k: number,
  N: number,
  type: "CHAMPION" | "TOP_SCORER"
): number {
  if (predValue.toLowerCase().trim() !== actualValue.toLowerCase().trim()) return 0;
  const base =
    type === "CHAMPION" ? ODDS_CONFIG.POINTS.CHAMPION : ODDS_CONFIG.POINTS.TOP_SCORER;
  const odd = calculateOdd(k, N);
  return base * odd;
}
