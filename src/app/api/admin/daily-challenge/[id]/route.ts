import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { category, answer, aliases, hints, publishDate, status } = body;

  const parsedHints = JSON.parse(hints ?? "[]");
  if (parsedHints.length !== 10) {
    return NextResponse.json({ error: "Exatamente 10 dicas são obrigatórias" }, { status: 400 });
  }

  const challenge = await prisma.challenge.update({
    where: { id },
    data: {
      category,
      answer,
      aliases: aliases ?? "[]",
      hints,
      publishDate: new Date(publishDate),
      status,
    },
  });

  return NextResponse.json(challenge);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.challenge.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
