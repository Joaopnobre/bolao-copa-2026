// Odds formula: odd = max(MIN_ODD, 1 - 0.5 * ((k-1)/(N-1))^POWER)
// k = quantas pessoas palpitaram EXATAMENTE o mesmo placar
// N = total de participantes
// Derivado da planilha: k=10, N=20 → 0.7249819926053037 exato

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

// REGRA: tanto placar exato quanto vencedor/empate usam o mesmo k —
// quantas pessoas palpitaram AQUELE placar específico.
// Ex: jogo termina 1x0. Quem palpitou 2x1 compete só com quem
// também palpitou 2x1 (não com quem palpitou 3x0, mesmo vencedor).
export function calculateMatchPoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number,
  k_exact: number, // pessoas com o mesmo placar exato
  N: number
): { points: number; type: "exact" | "winner" | "none" } {
  const isExact = predHome === actualHome && predAway === actualAway;

  const actualWinner =
    actualHome > actualAway ? "home" : actualAway > actualHome ? "away" : "draw";
  const predWinner =
    predHome > predAway ? "home" : predAway > predHome ? "away" : "draw";
  const isWinner = predWinner === actualWinner;

  // odd calculada sempre sobre o placar específico (k_exact)
  const odd = calculateOdd(k_exact, N);

  if (isExact) return { points: ODDS_CONFIG.POINTS.EXACT_SCORE * odd, type: "exact" };
  if (isWinner) return { points: ODDS_CONFIG.POINTS.WINNER * odd, type: "winner" };
  return { points: 0, type: "none" };
}

// Normaliza texto para comparação: remove acentos, minúsculas, trim
// "Vinícius Jr.", "vinicius jr", "VINICIUS JR" → "vinicius jr"
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function calculateSpecialPoints(
  predValue: string,
  actualValue: string,
  k: number,
  N: number,
  type: "CHAMPION" | "TOP_SCORER"
): number {
  if (normalizeText(predValue) !== normalizeText(actualValue)) return 0;
  const base =
    type === "CHAMPION" ? ODDS_CONFIG.POINTS.CHAMPION : ODDS_CONFIG.POINTS.TOP_SCORER;
  return base * calculateOdd(k, N);
}
