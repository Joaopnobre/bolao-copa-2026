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

  // Agrupa por placar exato — cada placar tem seu próprio k
  const exactGroups: Record<string, number> = {};
  for (const pred of match.predictions) {
    const key = `${pred.homeScore}-${pred.awayScore}`;
    exactGroups[key] = (exactGroups[key] ?? 0) + 1;
  }

  // Cada predição usa o k do seu próprio placar exato
  // — válido tanto para acerto exato quanto para acerto de vencedor
  const updates = match.predictions.map((pred) => {
    const key = `${pred.homeScore}-${pred.awayScore}`;
    const k = exactGroups[key] ?? 1;
    const { points } = calculateMatchPoints(
      pred.homeScore,
      pred.awayScore,
      match.homeScore!,
      match.awayScore!,
      k,
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
  const predictions = await prisma.specialPrediction.findMany({ where: { type } });
  const N = Math.max(
    await prisma.user.count({ where: { isActive: true, role: "PARTICIPANT" } }),
    1
  );
  const k = predictions.filter(
    (p) => p.value.toLowerCase().trim() === actualValue.toLowerCase().trim()
  ).length;

  const updates = predictions.map((pred) => {
    const points = calculateSpecialPoints(pred.value, actualValue, k, N, type);
    return prisma.specialPrediction.update({ where: { id: pred.id }, data: { points } });
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
    const matchPoints    = user.predictions.reduce((s, p) => s + (p.points ?? 0), 0);
    const specialPoints  = user.specialPredictions.reduce((s, p) => s + (p.points ?? 0), 0);
    const champPoints    = user.specialPredictions.find((p) => p.type === "CHAMPION")?.points ?? 0;
    const scorerPoints   = user.specialPredictions.find((p) => p.type === "TOP_SCORER")?.points ?? 0;

    const exactCount = user.predictions.filter((p) => {
      if (p.match.homeScore === null) return false;
      return p.homeScore === p.match.homeScore && p.awayScore === p.match.awayScore;
    }).length;

    const winnerCount = user.predictions.filter((p) => {
      if (p.match.homeScore === null || p.match.awayScore === null) return false;
      const actualW = p.match.homeScore > p.match.awayScore ? "home" : p.match.awayScore > p.match.homeScore ? "away" : "draw";
      const predW   = p.homeScore > p.awayScore ? "home" : p.awayScore > p.homeScore ? "away" : "draw";
      return predW === actualW && !(p.homeScore === p.match.homeScore && p.awayScore === p.match.awayScore);
    }).length;

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

  return ranking.sort((a, b) =>
    b.totalPoints !== a.totalPoints ? b.totalPoints - a.totalPoints : b.exactCount - a.exactCount
  );
}
