import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { parseAliases, checkAnswer, normalizeText, calculatePoints, getTodayRange } from "@/lib/daily-challenge";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { challengeId, guess } = await req.json();
  if (!challengeId || !guess?.trim()) {
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

  if (attempt.guessesUsed >= 2) {
    return NextResponse.json({ error: "Tentativas esgotadas" }, { status: 400 });
  }

  const aliases = parseAliases(challenge.aliases);
  const isCorrect = checkAnswer(guess, challenge.answer, aliases);
  const newGuessesUsed = attempt.guessesUsed + 1;
  const shouldComplete = isCorrect || newGuessesUsed >= 2;
  const points = shouldComplete ? calculatePoints(attempt.revealedHintsCount, isCorrect) : null;

  await (prisma as any).challengeGuess.create({
    data: {
      attemptId: attempt.id,
      guess: guess.trim(),
      normalizedGuess: normalizeText(guess),
      isCorrect,
    },
  });

  const updated = await (prisma as any).challengeAttempt.update({
    where: { id: attempt.id },
    data: {
      guessesUsed: newGuessesUsed,
      solved: isCorrect,
      ...(shouldComplete && {
        completed: true,
        points,
        completedAt: new Date(),
      }),
    },
  });

  return NextResponse.json({
    isCorrect,
    solved: updated.solved,
    completed: updated.completed,
    points: updated.points,
    guessesUsed: updated.guessesUsed,
    answer: shouldComplete ? challenge.answer : null,
  });
}
