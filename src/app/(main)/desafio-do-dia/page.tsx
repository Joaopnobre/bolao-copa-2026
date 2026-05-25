import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DailyChallengeClient } from "./DailyChallengeClient";
import { getTodayRange, parseHints, CATEGORY_LABELS, type Hint } from "@/lib/daily-challenge";

export default async function DesafioPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const challenge = await prisma.challenge.findFirst({
    where: { status: "PUBLISHED", publishDate: getTodayRange() },
  });

  if (!challenge) {
    return (
      <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-secondary)" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          Desafio do Dia
        </div>
        <div style={{ fontSize: 14 }}>Nenhum desafio publicado para hoje. Volte amanhã!</div>
      </div>
    );
  }

  const attempt = await (prisma as any).challengeAttempt.findUnique({
    where: { userId_challengeId: { userId: session.user.id, challengeId: challenge.id } },
    include: { guesses: { orderBy: { createdAt: "asc" } } },
  });

  const hints = parseHints(challenge.hints);
  const revealedIndices: number[] = JSON.parse(attempt?.revealedIndices ?? "[]");
  const revealedMap: Record<number, Hint> = {};
  revealedIndices.forEach((i) => { if (hints[i]) revealedMap[i] = hints[i]; });
  const initialLostTurn = revealedIndices.some((i) => hints[i]?.type === "LOSE_TURN") && (attempt?.guessesUsed ?? 0) === 0;

  // Cumulative ranking: sum of points across all challenges
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

  const cumulativeRanking = Object.values(userMap)
    .sort((a, b) => b.totalPoints - a.totalPoints || b.solvedCount - a.solvedCount)
    .map((u, i) => ({ rank: i + 1, ...u }));

  return (
    <DailyChallengeClient
      challengeId={challenge.id}
      category={CATEGORY_LABELS[challenge.category] ?? challenge.category}
      totalHints={hints.length}
      initialRevealedMap={revealedMap}
      initialLostTurn={initialLostTurn}
      initialAttempt={attempt ? {
        revealedHintsCount: attempt.revealedHintsCount,
        revealedIndices,
        guessesUsed: attempt.guessesUsed,
        solved: attempt.solved,
        completed: attempt.completed,
        points: attempt.points,
        guesses: attempt.guesses.map((g: any) => ({ guess: g.guess, isCorrect: g.isCorrect })),
        answer: attempt.completed ? challenge.answer : undefined,
      } : null}
      initialRanking={cumulativeRanking}
      currentUserUsername={session.user.username ?? ""}
    />
  );
}
