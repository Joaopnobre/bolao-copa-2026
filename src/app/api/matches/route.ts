import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, getIp } from "@/lib/actionLog";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { homeTeam, awayTeam, matchDate, phase, groupName, round, sortOrder } = body;

  if (!homeTeam || !awayTeam || !matchDate) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const match = await prisma.match.create({
    data: {
      homeTeam,
      awayTeam,
      matchDate: new Date(matchDate),
      phase: phase ?? "GROUP",
      groupName: groupName || null,
      round: round || null,
      sortOrder: sortOrder ?? 0,
    },
  });

  await logAction(session.user.id, session.user.name ?? "", `criou jogo ${homeTeam} × ${awayTeam}`, getIp(req));

  return NextResponse.json(match);
}
