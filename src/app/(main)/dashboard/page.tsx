import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const now = new Date();

  // Next 5 upcoming matches
  const upcomingMatches = await prisma.match.findMany({
    where: { matchDate: { gte: now }, status: "UPCOMING" },
    orderBy: [{ matchDate: "asc" }, { sortOrder: "asc" }],
    take: 6,
  });

  // Recent finished matches
  const recentMatches = await prisma.match.findMany({
    where: { status: "FINISHED" },
    orderBy: { matchDate: "desc" },
    take: 4,
  });

  // User predictions for upcoming matches
  const userPredictions = await prisma.prediction.findMany({
    where: {
      userId: session.user.id,
      matchId: { in: upcomingMatches.map((m) => m.id) },
    },
  });

  // Stats
  const totalMatches = await prisma.match.count();
  const finishedMatches = await prisma.match.count({ where: { status: "FINISHED" } });
  const totalParticipants = await prisma.user.count({ where: { isActive: true, role: "PARTICIPANT" } });
  const userPredictionCount = await prisma.prediction.count({ where: { userId: session.user.id } });
  const userPoints = await prisma.prediction.aggregate({
    where: { userId: session.user.id },
    _sum: { points: true },
  });
  const userSpecialPoints = await prisma.specialPrediction.aggregate({
    where: { userId: session.user.id },
    _sum: { points: true },
  });

  const totalPoints = (userPoints._sum.points ?? 0) + (userSpecialPoints._sum.points ?? 0);

  // Ranking position
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
      total: u.predictions.reduce((s, p) => s + (p.points ?? 0), 0) +
        u.specialPredictions.reduce((s, p) => s + (p.points ?? 0), 0),
    }))
    .sort((a, b) => b.total - a.total);
  const myRank = rankings.findIndex((r) => r.id === session.user.id) + 1;

  // Special predictions lock time = 1h before first match
  const firstMatch = await prisma.match.findFirst({ orderBy: { matchDate: "asc" } });

  return (
    <DashboardClient
      userName={session.user.name ?? ""}
      isAdmin={session.user.role === "ADMIN"}
      upcomingMatches={JSON.parse(JSON.stringify(upcomingMatches))}
      recentMatches={JSON.parse(JSON.stringify(recentMatches))}
      userPredictions={JSON.parse(JSON.stringify(userPredictions))}
      stats={{
        totalMatches,
        finishedMatches,
        totalParticipants,
        userPredictionCount,
        totalPoints,
        myRank: myRank || 0,
        totalPlayers: allUsers.length,
      }}
      firstMatchDate={firstMatch ? firstMatch.matchDate.toISOString() : null}
    />
  );
}
