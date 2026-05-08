import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, getIp } from "@/lib/actionLog";
import { isMatchLocked } from "@/lib/lockTime";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prediction = await prisma.prediction.findUnique({
    where: { id },
    include: { match: true },
  });

  if (!prediction) return NextResponse.json({ error: "Palpite não encontrado" }, { status: 404 });

  // Only owner can delete
  if (prediction.userId !== session.user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  // Check lock
  if (isMatchLocked(prediction.match.matchDate) || prediction.match.status === "FINISHED") {
    return NextResponse.json({ error: "Não é possível excluir palpites bloqueados" }, { status: 403 });
  }

  await prisma.prediction.delete({ where: { id } });
  await logAction(session.user.id, session.user.name ?? "", `excluiu palpite do jogo ${prediction.match.homeTeam} × ${prediction.match.awayTeam}`, getIp(req));

  return NextResponse.json({ success: true });
}
