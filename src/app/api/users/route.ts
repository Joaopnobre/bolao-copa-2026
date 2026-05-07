import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/actionLog";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, username, email, password, role, isActive } = await req.json();

  if (!name || !username || !email || !password) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    return NextResponse.json({ error: "Username ou email já em uso" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, username, email, password: hashed, role: role ?? "PARTICIPANT", isActive: isActive ?? true },
    select: { id: true, name: true, username: true, email: true, role: true },
  });

  await logAction(session.user.id, session.user.name ?? "", `criou usuário ${name} (@${username})`);

  return NextResponse.json(user);
}
