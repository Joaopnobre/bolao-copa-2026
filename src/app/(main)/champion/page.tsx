import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ChampionClient } from "./ChampionClient";
import { isSpecialLocked } from "@/lib/lockTime";

export default async function ChampionPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const firstMatch = await prisma.match.findFirst({ orderBy: { matchDate: "asc" } });
  const locked = isSpecialLocked(firstMatch ? firstMatch.matchDate : null);

  const championPred = await prisma.specialPrediction.findUnique({
    where: { userId_type: { userId: session.user.id, type: "CHAMPION" } },
  });
  const scorerPred = await prisma.specialPrediction.findUnique({
    where: { userId_type: { userId: session.user.id, type: "TOP_SCORER" } },
  });

  // After lock, show all predictions
  let allChampion: any[] = [];
  let allScorer: any[] = [];
  if (locked) {
    allChampion = await prisma.specialPrediction.findMany({
      where: { type: "CHAMPION" },
      include: { user: { select: { name: true, username: true } } },
    });
    allScorer = await prisma.specialPrediction.findMany({
      where: { type: "TOP_SCORER" },
      include: { user: { select: { name: true, username: true } } },
    });
  }

  // Get official results
  const champConfig = await prisma.systemConfig.findUnique({ where: { key: "champion" } });
  const scorerConfig = await prisma.systemConfig.findUnique({ where: { key: "topScorer" } });

  return (
    <ChampionClient
      championPred={championPred ? JSON.parse(JSON.stringify(championPred)) : null}
      scorerPred={scorerPred ? JSON.parse(JSON.stringify(scorerPred)) : null}
      allChampion={JSON.parse(JSON.stringify(allChampion))}
      allScorer={JSON.parse(JSON.stringify(allScorer))}
      locked={locked}
      userId={session.user.id}
      officialChampion={champConfig?.value ?? null}
      officialScorer={scorerConfig?.value ?? null}
      lockTime={firstMatch ? firstMatch.matchDate.toISOString() : null}
      isViewer={session.user.role === "VIEWER"}
    />
  );
}
