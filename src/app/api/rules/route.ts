import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/actionLog";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content } = await req.json();

  await prisma.rule.upsert({
    where: { key: "main" },
    create: { key: "main", content },
    update: { content },
  });

  await logAction(session.user.id, session.user.name ?? "", "atualizou as regras do bolão");

  return NextResponse.json({ success: true });
}
