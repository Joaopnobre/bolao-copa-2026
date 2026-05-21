import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { parseHints, calculatePoints, getTodayRange } from "@/lib/daily-challenge";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { challengeId } = await req.json();
  if (!challengeId) return NextResponse.json({ error: "challengeId required" }, { status: 400 });

  const challenge = await prisma.challenge.findFirst({
    where: { id: challengeId, status: "PUBLISHED", publishDate: getTodayRange() },
  });
  if (!challenge) return NextResponse.json({ error: "Desafio não encontrado" }, { status: 404 });

  let attempt = await (prisma as any).challengeAttempt.findUnique({
    where: { userId_challengeId: { userId: session.user.id, challengeId } },
  });

  if (!attempt) {
    attempt = await (prisma as any).challengeAttempt.create({
      data: { userId: session.user.id, challengeId },
    });
  }

  if (attempt.completed) {
    return NextResponse.json({ error: "Desafio já encerrado" }, { status: 400 });
  }

  const hints = parseHints(challenge.hints);
  const nextIndex = attempt.revealedHintsCount;

  if (nextIndex >= hints.length) {
    return NextResponse.json({ error: "Todas as dicas já foram reveladas" }, { status: 400 });
  }

  const nextHint = hints[nextIndex];
  const newCount = nextIndex + 1;
  const isLoseTurn = nextHint.type === "LOSE_TURN";

  const updated = await (prisma as any).challengeAttempt.update({
    where: { id: attempt.id },
    data: {
      revealedHintsCount: newCount,
      ...(isLoseTurn && {
        completed: true,
        points: 0,
        completedAt: new Date(),
      }),
    },
  });

  return NextResponse.json({
    hint: nextHint,
    revealedHintsCount: newCount,
    lostTurn: isLoseTurn,
    completed: updated.completed,
    points: updated.points,
    answer: isLoseTurn ? challenge.answer : null,
  });
}
