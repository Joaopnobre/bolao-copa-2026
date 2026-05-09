import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, getIp } from "@/lib/actionLog";
import { isSpecialLocked } from "@/lib/lockTime";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, value } = await req.json();
  if (!type || !value?.trim()) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  if (!["CHAMPION", "TOP_SCORER"].includes(type)) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });

  const firstMatch = await prisma.match.findFirst({ orderBy: { matchDate: "asc" } });
  if (isSpecialLocked(firstMatch?.matchDate ?? null)) {
    return NextResponse.json({ error: "Palpites especiais bloqueados" }, { status: 403 });
  }

  const pred = await prisma.specialPrediction.upsert({
    where: { userId_type: { userId: session.user.id, type } },
    create: { userId: session.user.id, type, value: value.trim() },
    update: { value: value.trim() },
  });

  await logAction(session.user.id, session.user.name ?? "", `atualizou palpite de ${type === "CHAMPION" ? "campeão" : "artilheiro"}: ${value.trim()}`, getIp(req));

  return NextResponse.json(pred);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type } = await req.json();
  if (!["CHAMPION", "TOP_SCORER"].includes(type)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  const firstMatch = await prisma.match.findFirst({ orderBy: { matchDate: "asc" } });
  if (isSpecialLocked(firstMatch?.matchDate ?? null)) {
    return NextResponse.json({ error: "Palpites especiais bloqueados" }, { status: 403 });
  }

  await prisma.specialPrediction.deleteMany({
    where: { userId: session.user.id, type },
  });

  await logAction(session.user.id, session.user.name ?? "", `excluiu palpite de ${type === "CHAMPION" ? "campeão" : "artilheiro"}`, getIp(req));

  return NextResponse.json({ success: true });
}
