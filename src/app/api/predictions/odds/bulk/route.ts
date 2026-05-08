import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Retorna contagens de palpites para vários jogos de uma vez.
// GET /api/predictions/odds/bulk?matchIds=id1,id2,...
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("matchIds") ?? "";
  const matchIds = raw.split(",").filter(Boolean);

  if (!matchIds.length) return NextResponse.json({});

  const [predictions, totalParticipants] = await Promise.all([
    prisma.prediction.findMany({
      where: { matchId: { in: matchIds } },
      select: { matchId: true, homeScore: true, awayScore: true },
    }),
    prisma.user.count({ where: { isActive: true, role: "PARTICIPANT" } }),
  ]);

  // Agrupa por matchId → { "2-1": 3, "1-0": 1 }
  const result: Record<string, { counts: Record<string, number>; total: number }> = {};
  for (const id of matchIds) result[id] = { counts: {}, total: totalParticipants };

  for (const p of predictions) {
    const key = `${p.homeScore}-${p.awayScore}`;
    result[p.matchId].counts[key] = (result[p.matchId].counts[key] ?? 0) + 1;
  }

  return NextResponse.json(result);
}
