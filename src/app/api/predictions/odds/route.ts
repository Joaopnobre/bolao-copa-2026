import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Retorna quantas pessoas já palpitaram cada placar para um jogo.
// Não expõe QUEM palpitou — só contagens anônimas para calcular odds.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId");
  if (!matchId) return NextResponse.json({ error: "matchId required" }, { status: 400 });

  const predictions = await prisma.prediction.findMany({
    where: { matchId },
    select: { homeScore: true, awayScore: true },
  });

  const totalParticipants = await prisma.user.count({
    where: { isActive: true, role: "PARTICIPANT" },
  });

  // Conta quantas pessoas escolheram cada placar
  const counts: Record<string, number> = {};
  for (const p of predictions) {
    const key = `${p.homeScore}-${p.awayScore}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return NextResponse.json({ counts, total: totalParticipants });
}
