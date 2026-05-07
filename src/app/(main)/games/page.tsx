import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { GamesClient } from "./GamesClient";

export default async function GamesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const matches = await prisma.match.findMany({
    orderBy: [{ sortOrder: "asc" }, { matchDate: "asc" }],
  });

  const userPredictions = await prisma.prediction.findMany({
    where: { userId: session.user.id },
    select: { matchId: true, homeScore: true, awayScore: true, points: true },
  });

  return (
    <GamesClient
      matches={JSON.parse(JSON.stringify(matches))}
      userPredictions={JSON.parse(JSON.stringify(userPredictions))}
      isAdmin={session.user.role === "ADMIN"}
    />
  );
}
