import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, getIp } from "@/lib/actionLog";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, type, value } = await req.json();
  if (!userId || !type || !value?.trim())
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  if (!["CHAMPION", "TOP_SCORER"].includes(type))
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });

  const pred = await prisma.specialPrediction.upsert({
    where: { userId_type: { userId, type } },
    create: { userId, type, value: value.trim() },
    update: { value: value.trim() },
  });

  const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  await logAction(
    session.user.id,
    session.user.name ?? "",
    `[ADMIN] corrigiu palpite de ${type === "TOP_SCORER" ? "artilheiro" : "campeão"} de ${targetUser?.name}: ${value.trim()}`,
    getIp(req)
  );

  return NextResponse.json(pred);
}
