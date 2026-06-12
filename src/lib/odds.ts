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

// REGRA: placar exato e vencedor/empate usam odds independentes.
// - Cravou o placar exato: k_exact = quantas pessoas palpitaram AQUELE placar específico.
// - Acertou só o vencedor (não cravou): k_winner = quantas pessoas palpitaram naquele
//   vencedor/empate, independente do placar exato de cada uma.
export function calculateMatchPoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number,
  k_exact: number,  // pessoas com o mesmo placar exato
  k_winner: number, // pessoas que acertaram o mesmo vencedor/empate
  N: number
): { points: number; type: "exact" | "winner" | "none" } {
  const isExact = predHome === actualHome && predAway === actualAway;

  const actualWinner =
    actualHome > actualAway ? "home" : actualAway > actualHome ? "away" : "draw";
  const predWinner =
    predHome > predAway ? "home" : predAway > predHome ? "away" : "draw";
  const isWinner = predWinner === actualWinner;

  if (isExact) return { points: ODDS_CONFIG.POINTS.EXACT_SCORE * calculateOdd(k_exact, N), type: "exact" };
  if (isWinner) return { points: ODDS_CONFIG.POINTS.WINNER * calculateOdd(k_winner, N), type: "winner" };
  return { points: 0, type: "none" };
}

// Normaliza texto para comparação: remove acentos, minúsculas, trim e aliases comuns.
// Exemplos equivalentes após normalização:
//   "Vinícius Júnior" = "Vinicius Jr" = "vinicius jr." → "vinicius jr"
//   "São Paulo" = "Sao Paulo" → "sao paulo"
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")   // remove diacríticos
    .toLowerCase()
    .trim()
    .replace(/\./g, "")                // remove pontos ("jr." → "jr")
    .replace(/\s+/g, " ")             // espaços múltiplos → um
    .replace(/\bjunior\b/g, "jr")     // "junior" → "jr"
    .replace(/\bsaint\b/g, "st")      // "saint" → "st"
    .trim();
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
