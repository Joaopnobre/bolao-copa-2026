import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RankingClient } from "./RankingClient";

export default async function RankingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const users = await prisma.user.findMany({
    where: { isActive: true, role: "PARTICIPANT" },
    include: {
      predictions: { include: { match: { select: { homeScore: true, awayScore: true, status: true } } } },
      specialPredictions: true,
    },
  });

  const ranking = users.map((user) => {
    const matchPts = user.predictions.reduce((s, p) => s + (p.points ?? 0), 0);
    const specialPts = user.specialPredictions.reduce((s, p) => s + (p.points ?? 0), 0);
    const champPts = user.specialPredictions.find((p) => p.type === "CHAMPION")?.points ?? 0;
    const scorerPts = user.specialPredictions.find((p) => p.type === "TOP_SCORER")?.points ?? 0;

    const exactCount = user.predictions.filter((p) => {
      if (p.match.homeScore === null || p.match.awayScore === null) return false;
      return p.homeScore === p.match.homeScore && p.awayScore === p.match.awayScore;
    }).length;

    const winnerCount = user.predictions.filter((p) => {
      if (p.match.homeScore === null || p.match.awayScore === null) return false;
      const actualW = p.match.homeScore > p.match.awayScore ? "home" : p.match.awayScore > p.match.homeScore ? "away" : "draw";
      const predW = p.homeScore > p.awayScore ? "home" : p.awayScore > p.homeScore ? "away" : "draw";
      return predW === actualW && !(p.homeScore === p.match.homeScore && p.awayScore === p.match.awayScore);
    }).length;

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      totalPoints: matchPts + specialPts,
      matchPoints: matchPts,
      champPoints: champPts,
      scorerPoints: scorerPts,
      exactCount,
      winnerCount,
    };
  });

  ranking.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return b.exactCount - a.exactCount;
  });

  return (
    <RankingClient
      ranking={ranking}
      currentUserId={session.user.id}
    />
  );
}
