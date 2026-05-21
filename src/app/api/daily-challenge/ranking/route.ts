import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allAttempts = await (prisma as any).challengeAttempt.findMany({
    where: { completed: true },
    include: { user: { select: { name: true, username: true } } },
  });

  const userMap: Record<string, { name: string; username: string; totalPoints: number; solvedCount: number; playedCount: number }> = {};
  for (const a of allAttempts) {
    if (!userMap[a.userId]) {
      userMap[a.userId] = { name: a.user.name, username: a.user.username, totalPoints: 0, solvedCount: 0, playedCount: 0 };
    }
    userMap[a.userId].totalPoints += a.points ?? 0;
    userMap[a.userId].playedCount += 1;
    if (a.solved) userMap[a.userId].solvedCount += 1;
  }

  const ranking = Object.values(userMap)
    .sort((a, b) => b.totalPoints - a.totalPoints || b.solvedCount - a.solvedCount)
    .map((u, i) => ({ rank: i + 1, ...u }));

  return NextResponse.json(ranking);
}
