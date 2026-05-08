import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, getIp } from "@/lib/actionLog";
import { isMatchLocked } from "@/lib/lockTime";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { matchId, homeScore, awayScore } = body;

  if (typeof homeScore !== "number" || typeof awayScore !== "number" || homeScore < 0 || awayScore < 0) {
    return NextResponse.json({ error: "Placar inválido" }, { status: 400 });
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });

  if (isMatchLocked(match.matchDate) || match.status === "FINISHED") {
    return NextResponse.json({ error: "Palpites bloqueados para este jogo" }, { status: 403 });
  }

  const prediction = await prisma.prediction.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId } },
    create: { userId: session.user.id, matchId, homeScore, awayScore },
    update: { homeScore, awayScore },
  });

  await logAction(
    session.user.id,
    session.user.name ?? "",
    `palpitou ${homeScore}x${awayScore} no jogo ${match.homeTeam} × ${match.awayTeam}`,
    getIp(req)
  );

  return NextResponse.json(prediction);
}

export async function PUT(req: Request) {
  return POST(req);
}
