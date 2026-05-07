import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/actionLog";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { homeTeam, awayTeam, matchDate, phase, groupName, round, sortOrder } = body;

  const match = await prisma.match.update({
    where: { id },
    data: {
      homeTeam,
      awayTeam,
      matchDate: matchDate ? new Date(matchDate) : undefined,
      phase,
      groupName: groupName || null,
      round: round || null,
      sortOrder: sortOrder ?? undefined,
    },
  });

  await logAction(session.user.id, session.user.name ?? "", `editou jogo ${homeTeam} × ${awayTeam}`);

  return NextResponse.json(match);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const match = await prisma.match.delete({ where: { id } });
  await logAction(session.user.id, session.user.name ?? "", `excluiu jogo ${match.homeTeam} × ${match.awayTeam}`);

  return NextResponse.json({ success: true });
}
