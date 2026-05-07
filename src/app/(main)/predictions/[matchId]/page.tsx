import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { PredictionFormClient } from "./PredictionFormClient";
import { isMatchLocked } from "@/lib/lockTime";

interface Props {
  params: Promise<{ matchId: string }>;
}

export default async function PredictionPage({ params }: Props) {
  const { matchId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) notFound();

  const prediction = await prisma.prediction.findUnique({
    where: { userId_matchId: { userId: session.user.id, matchId } },
  });

  // If locked and no prediction, still show view (but no editing)
  const locked = isMatchLocked(match.matchDate);

  // After lock: show predictions of all users if visible
  let allPredictions: any[] = [];
  if (locked || match.status === "FINISHED") {
    allPredictions = await prisma.prediction.findMany({
      where: { matchId },
      include: { user: { select: { name: true, username: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  return (
    <PredictionFormClient
      match={JSON.parse(JSON.stringify(match))}
      prediction={prediction ? JSON.parse(JSON.stringify(prediction)) : null}
      allPredictions={JSON.parse(JSON.stringify(allPredictions))}
      userId={session.user.id}
      locked={locked}
    />
  );
}
