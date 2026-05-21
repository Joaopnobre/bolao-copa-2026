import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DailyChallengeClient } from "./DailyChallengeClient";
import { getTodayRange, parseHints, CATEGORY_LABELS } from "@/lib/daily-challenge";

export default async function DesafioPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const todayRange = getTodayRange();

  const challenge = await prisma.challenge.findFirst({
    where: { status: "PUBLISHED", publishDate: todayRange },
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
  const revealedHints = attempt ? hints.slice(0, attempt.revealedHintsCount) : [];

  const rankingAttempts = await (prisma as any).challengeAttempt.findMany({
    where: { challengeId: challenge.id, completed: true },
    include: { user: { select: { name: true, username: true } } },
    orderBy: [{ points: "desc" }, { completedAt: "asc" }],
  });

  const ranking = rankingAttempts.map((a: any, i: number) => ({
    rank: i + 1,
    name: a.user.name,
    username: a.user.username,
    points: a.points ?? 0,
    solved: a.solved,
  }));

  return (
    <DailyChallengeClient
      challengeId={challenge.id}
      category={CATEGORY_LABELS[challenge.category] ?? challenge.category}
      totalHints={hints.length}
      initialRevealedHints={revealedHints}
      initialAttempt={attempt ? {
        revealedHintsCount: attempt.revealedHintsCount,
        guessesUsed: attempt.guessesUsed,
        solved: attempt.solved,
        completed: attempt.completed,
        points: attempt.points,
        guesses: attempt.guesses.map((g: any) => ({ guess: g.guess, isCorrect: g.isCorrect })),
        answer: attempt.completed ? challenge.answer : undefined,
      } : null}
      initialRanking={ranking}
      currentUserId={session.user.id}
      currentUserName={session.user.name ?? ""}
    />
  );
}
