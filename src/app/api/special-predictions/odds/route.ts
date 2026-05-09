import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/odds";
import { NextResponse } from "next/server";

// Retorna contagens normalizadas de palpites de campeão e artilheiro
// Ex: { CHAMPION: { "brasil": 3, "argentina": 2 }, TOP_SCORER: { "messi": 4 }, total: 10 }
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [predictions, total] = await Promise.all([
    prisma.specialPrediction.findMany({ select: { type: true, value: true } }),
    prisma.user.count({ where: { isActive: true, role: "PARTICIPANT" } }),
  ]);

  const counts: Record<string, Record<string, number>> = {
    CHAMPION: {},
    TOP_SCORER: {},
  };

  for (const p of predictions) {
    const key = normalizeText(p.value);
    counts[p.type][key] = (counts[p.type][key] ?? 0) + 1;
  }

  return NextResponse.json({ counts, total });
}
