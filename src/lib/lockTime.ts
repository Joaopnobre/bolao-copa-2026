// Returns true if predictions for this match are locked (1h before kickoff)
export function isMatchLocked(matchDate: Date): boolean {
  const lockTime = new Date(matchDate.getTime() - 60 * 60 * 1000); // 1h before
  return new Date() >= lockTime;
}

// Returns true if special predictions (champion/top scorer) are locked
// Locks 1h before the opening match
export function isSpecialLocked(openingMatchDate: Date | null): boolean {
  if (!openingMatchDate) return false;
  const lockTime = new Date(openingMatchDate.getTime() - 60 * 60 * 1000);
  return new Date() >= lockTime;
}

export function getLockTime(matchDate: Date): Date {
  return new Date(matchDate.getTime() - 60 * 60 * 1000);
}
