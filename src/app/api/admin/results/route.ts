import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, getIp } from "@/lib/actionLog";
import { recalculateMatchScores, recalculateSpecialScores } from "@/lib/scoring";
import { NextResponse } from "next/server";

// POST: Save match result
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId, homeScore, awayScore } = await req.json();

  if (typeof homeScore !== "number" || typeof awayScore !== "number") {
    return NextResponse.json({ error: "Placar inválido" }, { status: 400 });
  }

  const match = await prisma.match.update({
    where: { id: matchId },
    data: {
      homeScore,
      awayScore,
      status: "FINISHED",
    },
  });

  // Recalculate all points for this match
  await recalculateMatchScores(matchId);

  await logAction(
    session.user.id,
    session.user.name ?? "",
    `inseriu resultado ${match.homeTeam} ${homeScore}×${awayScore} ${match.awayTeam}`
  , getIp(req));

  return NextResponse.json(match);
}

// DELETE: Reset match result (zera placar e pontos, volta para pendente)
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId } = await req.json();

  const match = await prisma.match.update({
    where: { id: matchId },
    data: { homeScore: null, awayScore: null, status: "UPCOMING" },
  });

  await prisma.prediction.updateMany({
    where: { matchId },
    data: { points: null },
  });

  await logAction(
    session.user.id,
    session.user.name ?? "",
    `zerou resultado de ${match.homeTeam} × ${match.awayTeam}`
  , getIp(req));

  return NextResponse.json(match);
}

// PUT: Save special results (champion / top scorer)
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { champion, topScorer } = await req.json();

  if (champion !== undefined && champion !== "") {
    await prisma.systemConfig.upsert({
      where: { key: "champion" },
      create: { key: "champion", value: champion },
      update: { value: champion },
    });
    await recalculateSpecialScores("CHAMPION", champion);
    await logAction(session.user.id, session.user.name ?? "", `definiu campeão oficial: ${champion}`, getIp(req));
  }

  if (topScorer !== undefined && topScorer !== "") {
    await prisma.systemConfig.upsert({
      where: { key: "topScorer" },
      create: { key: "topScorer", value: topScorer },
      update: { value: topScorer },
    });
    await recalculateSpecialScores("TOP_SCORER", topScorer);
    await logAction(session.user.id, session.user.name ?? "", `definiu artilheiro oficial: ${topScorer}`, getIp(req));
  }

  return NextResponse.json({ success: true });
}
