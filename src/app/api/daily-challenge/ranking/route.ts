import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getTodayRange } from "@/lib/daily-challenge";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = getTodayRange();
  const challenge = await prisma.challenge.findFirst({
    where: { status: "PUBLISHED", publishDate: today },
  });

  if (!challenge) return NextResponse.json([]);

  const attempts = await (prisma as any).challengeAttempt.findMany({
    where: { challengeId: challenge.id, completed: true },
    include: { user: { select: { name: true, username: true } } },
    orderBy: [{ points: "desc" }, { completedAt: "asc" }],
  });

  const ranking = attempts.map((a: any, i: number) => ({
    rank: i + 1,
    name: a.user.name,
    username: a.user.username,
    points: a.points ?? 0,
    solved: a.solved,
  }));

  return NextResponse.json(ranking);
}
