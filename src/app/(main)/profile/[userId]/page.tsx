import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { isMatchLocked } from "@/lib/lockTime";
import { ProfileClient } from "./ProfileClient";

interface Props { params: Promise<{ userId: string }> }

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, username: true, role: true },
  });
  if (!user || !user.id) notFound();

  // Busca palpites apenas de jogos já bloqueados ou finalizados
  const predictions = await prisma.prediction.findMany({
    where: { userId },
    include: {
      match: true,
    },
    orderBy: { match: { matchDate: "asc" } },
  });

  // Filtra só os visíveis (bloqueados ou finalizados)
  const visiblePredictions = predictions.filter(
    (p) => isMatchLocked(p.match.matchDate) || p.match.status === "FINISHED"
  );

  const specialPredictions = await prisma.specialPrediction.findMany({ where: { userId } });

  // Estatísticas
  const finishedPreds = predictions.filter((p) => p.match.status === "FINISHED");
  const totalPts = finishedPreds.reduce((s, p) => s + (p.points ?? 0), 0)
    + specialPredictions.reduce((s, p) => s + (p.points ?? 0), 0);
  const exactCount = finishedPreds.filter(
    (p) => p.homeScore === p.match.homeScore && p.awayScore === p.match.awayScore
  ).length;
  const winnerCount = finishedPreds.filter((p) => {
    if (p.match.homeScore === null) return false;
    const actualW = p.match.homeScore > p.match.awayScore! ? "home" : p.match.awayScore! > p.match.homeScore ? "away" : "draw";
    const predW   = p.homeScore > p.awayScore ? "home" : p.awayScore > p.homeScore ? "away" : "draw";
    return predW === actualW && !(p.homeScore === p.match.homeScore && p.awayScore === p.match.awayScore);
  }).length;

  // Posição no ranking
  const allUsers = await prisma.user.findMany({
    where: { isActive: true, role: "PARTICIPANT" },
    include: {
      predictions: { select: { points: true } },
      specialPredictions: { select: { points: true } },
    },
  });
  const rankings = allUsers
    .map((u) => ({
      id: u.id,
      total: u.predictions.reduce((s, p) => s + (p.points ?? 0), 0)
        + u.specialPredictions.reduce((s, p) => s + (p.points ?? 0), 0),
    }))
    .sort((a, b) => b.total - a.total);
  const rank = rankings.findIndex((r) => r.id === userId) + 1;

  return (
    <ProfileClient
      user={user}
      predictions={JSON.parse(JSON.stringify(visiblePredictions))}
      specialPredictions={JSON.parse(JSON.stringify(specialPredictions))}
      stats={{ totalPts, exactCount, winnerCount, rank, total: allUsers.length }}
      isOwnProfile={session.user.id === userId}
    />
  );
}
