import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/actionLog";
import bcrypt from "bcryptjs";
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

  const { name, username, email, password, role, isActive } = await req.json();

  const data: any = { name, username, email, role, isActive };
  if (password?.trim()) {
    data.password = await bcrypt.hash(password.trim(), 12);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, username: true, email: true, role: true, isActive: true },
  });

  await logAction(session.user.id, session.user.name ?? "", `atualizou usuário ${name} (@${username})`);

  return NextResponse.json(user);
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

  const user = await prisma.user.delete({ where: { id } });
  await logAction(session.user.id, session.user.name ?? "", `excluiu usuário ${user.name}`);

  return NextResponse.json({ success: true });
}
