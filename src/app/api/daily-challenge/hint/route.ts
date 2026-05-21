import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { parseHints, getTodayRange } from "@/lib/daily-challenge";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { challengeId, hintIndex } = await req.json();
  if (!challengeId || hintIndex === undefined || hintIndex < 0 || hintIndex >= 10) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

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

  const revealedIndices: number[] = JSON.parse(attempt.revealedIndices ?? "[]");

  if (revealedIndices.includes(hintIndex)) {
    return NextResponse.json({ error: "Dica já revelada" }, { status: 400 });
  }

  const hints = parseHints(challenge.hints);
  const hint = hints[hintIndex];
  if (!hint) return NextResponse.json({ error: "Dica não encontrada" }, { status: 404 });

  const isLoseTurn = hint.type === "LOSE_TURN";
  const newRevealedIndices = [...revealedIndices, hintIndex];
  const newCount = newRevealedIndices.length;

  const updated = await (prisma as any).challengeAttempt.update({
    where: { id: attempt.id },
    data: {
      revealedHintsCount: newCount,
      revealedIndices: JSON.stringify(newRevealedIndices),
      ...(isLoseTurn && {
        completed: true,
        points: 0,
        completedAt: new Date(),
      }),
    },
  });

  return NextResponse.json({
    hint,
    hintIndex,
    revealedHintsCount: newCount,
    revealedIndices: newRevealedIndices,
    lostTurn: isLoseTurn,
    completed: updated.completed,
    points: updated.points,
    answer: isLoseTurn ? challenge.answer : null,
  });
}
