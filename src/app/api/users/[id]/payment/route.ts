import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, getIp } from "@/lib/actionLog";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const updated = await prisma.user.update({
    where: { id },
    data: { hasPaid: !user.hasPaid },
  });

  await logAction(
    session.user.id,
    session.user.name ?? "",
    `marcou ${user.name} como ${updated.hasPaid ? "PAGO ✅" : "NÃO PAGO ❌"}`,
    getIp(req)
  );

  return NextResponse.json({ hasPaid: updated.hasPaid });
}
