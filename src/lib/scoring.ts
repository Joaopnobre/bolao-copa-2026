import { prisma } from "./prisma";
import { calculateMatchPoints, calculateSpecialPoints } from "./odds";

export async function recalculateMatchScores(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { predictions: true },
  });

  if (!match || match.homeScore === null || match.awayScore === null) return;

  const totalParticipants = await prisma.user.count({
    where: { isActive: true, role: "PARTICIPANT" },
  });
  const N = Math.max(totalParticipants, 1);

  // Group predictions by exact score
  const exactGroups: Record<string, string[]> = {};
  const winnerGroups: Record<string, string[]> = {};

  for (const pred of match.predictions) {
    const exactKey = `${pred.homeScore}-${pred.awayScore}`;
    const winner =
      pred.homeScore > pred.awayScore
        ? "home"
        : pred.awayScore > pred.homeScore
        ? "away"
        : "draw";

    if (!exactGroups[exactKey]) exactGroups[exactKey] = [];
    exactGroups[exactKey].push(pred.userId);

    if (!winnerGroups[winner]) winnerGroups[winner] = [];
    winnerGroups[winner].push(pred.userId);
  }

  const actualWinner =
    match.homeScore > match.awayScore
      ? "home"
      : match.awayScore > match.homeScore
      ? "away"
      : "draw";
  const exactKey = `${match.homeScore}-${match.awayScore}`;
  const k_exact = exactGroups[exactKey]?.length ?? 0;
  const k_winner = winnerGroups[actualWinner]?.length ?? 0;

  const updates = match.predictions.map((pred) => {
    const { points } = calculateMatchPoints(
      pred.homeScore,
      pred.awayScore,
      match.homeScore!,
      match.awayScore!,
      k_exact,
      k_winner,
      N
    );
    return prisma.prediction.update({
      where: { id: pred.id },
      data: { points },
    });
  });

  await Promise.all(updates);
}

export async function recalculateSpecialScores(
  type: "CHAMPION" | "TOP_SCORER",
  actualValue: string
) {
  const predictions = await prisma.specialPrediction.findMany({
    where: { type },
  });

  const N = Math.max(
    await prisma.user.count({ where: { isActive: true, role: "PARTICIPANT" } }),
    1
  );

  const winnerPreds = predictions.filter(
    (p) => p.value.toLowerCase().trim() === actualValue.toLowerCase().trim()
  );
  const k = winnerPreds.length;

  const updates = predictions.map((pred) => {
    const points = calculateSpecialPoints(pred.value, actualValue, k, N, type);
    return prisma.specialPrediction.update({
      where: { id: pred.id },
      data: { points },
    });
  });

  await Promise.all(updates);
}

export async function getRanking() {
  const users = await prisma.user.findMany({
    where: { isActive: true, role: "PARTICIPANT" },
    include: {
      predictions: { include: { match: true } },
      specialPredictions: true,
    },
  });

  const ranking = users.map((user) => {
    const matchPoints = user.predictions.reduce(
      (sum, p) => sum + (p.points ?? 0),
      0
    );
    const specialPoints = user.specialPredictions.reduce(
      (sum, p) => sum + (p.points ?? 0),
      0
    );
    const exactCount = user.predictions.filter((p) => {
      if (!p.match.homeScore === null) return false;
      return (
        p.homeScore === p.match.homeScore && p.awayScore === p.match.awayScore
      );
    }).length;
    const winnerCount = user.predictions.filter((p) => {
      if (p.match.homeScore === null || p.match.awayScore === null) return false;
      const actualW =
        p.match.homeScore > p.match.awayScore
          ? "home"
          : p.match.awayScore > p.match.homeScore
          ? "away"
          : "draw";
      const predW =
        p.homeScore > p.awayScore
          ? "home"
          : p.awayScore > p.homeScore
          ? "away"
          : "draw";
      return predW === actualW && !(p.homeScore === p.match.homeScore && p.awayScore === p.match.awayScore);
    }).length;
    const champPoints =
      user.specialPredictions.find((p) => p.type === "CHAMPION")?.points ?? 0;
    const scorerPoints =
      user.specialPredictions.find((p) => p.type === "TOP_SCORER")?.points ?? 0;

    return {
      userId: user.id,
      name: user.name,
      username: user.username,
      totalPoints: matchPoints + specialPoints,
      matchPoints,
      champPoints,
      scorerPoints,
      exactCount,
      winnerCount,
    };
  });

  return ranking.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return b.exactCount - a.exactCount; // tiebreaker: most exact scores
  });
}
