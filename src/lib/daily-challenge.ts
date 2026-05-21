export interface Hint {
  text: string;
  type: "NORMAL" | "LOSE_TURN";
}

export const CATEGORY_LABELS: Record<string, string> = {
  PLAYER: "Jogador",
  TEAM: "Seleção",
  STADIUM: "Estádio",
  HISTORIC_MATCH: "Partida Histórica",
  YEAR: "Ano",
};

export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function checkAnswer(guess: string, answer: string, aliases: string[]): boolean {
  const norm = normalizeText(guess);
  return [answer, ...aliases].map(normalizeText).some((a) => a === norm);
}

export function calculatePoints(revealedHintsCount: number, solved: boolean): number {
  if (!solved) return 0;
  return Math.max(1, 11 - revealedHintsCount);
}

export function parseHints(json: string): Hint[] {
  try { return JSON.parse(json) ?? []; } catch { return []; }
}

export function parseAliases(json: string): string[] {
  try { return JSON.parse(json) ?? []; } catch { return []; }
}

export function getTodayRange(): { gte: Date; lt: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { gte: today, lt: tomorrow };
}
