import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const challenges = await prisma.challenge.findMany({
    orderBy: { publishDate: "desc" },
    include: { _count: { select: { attempts: true } } },
  });

  return NextResponse.json(challenges);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { category, answer, aliases, hints, publishDate, status } = body;

  if (!category || !answer || !publishDate) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const parsedHints = JSON.parse(hints ?? "[]");
  if (parsedHints.length !== 10) {
    return NextResponse.json({ error: "Exatamente 10 dicas são obrigatórias" }, { status: 400 });
  }

  const challenge = await prisma.challenge.create({
    data: {
      category,
      answer,
      aliases: aliases ?? "[]",
      hints,
      publishDate: new Date(publishDate),
      status: status ?? "DRAFT",
    },
  });

  return NextResponse.json(challenge);
}
