"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";

interface Hint {
  text: string;
  type: "NORMAL" | "LOSE_TURN";
}

interface RankingEntry {
  rank: number;
  name: string;
  username: string;
  points: number;
  solved: boolean;
}

interface AttemptState {
  revealedHintsCount: number;
  revealedIndices: number[];
  guessesUsed: number;
  solved: boolean;
  completed: boolean;
  points: number | null;
  guesses: { guess: string; isCorrect: boolean }[];
  answer?: string;
  lostTurn?: boolean;
}

interface Props {
  challengeId: string;
  category: string;
  totalHints: number;
  initialRevealedMap: Record<number, Hint>;
  initialAttempt: AttemptState | null;
  initialRanking: RankingEntry[];
  currentUserUsername: string;
}

export function DailyChallengeClient({
  challengeId,
  category,
  totalHints,
  initialRevealedMap,
  initialAttempt,
  initialRanking,
  currentUserUsername,
}: Props) {
  const [revealedMap, setRevealedMap] = useState<Record<number, Hint>>(initialRevealedMap);
  const [attempt, setAttempt] = useState<AttemptState | null>(initialAttempt);
  const [guess, setGuess] = useState("");
  const [loading, setLoading] = useState(false);
  const [revealingIndex, setRevealingIndex] = useState<number | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>(initialRanking);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  const completed = attempt?.completed ?? false;
  const revealedIndices = attempt?.revealedIndices ?? Object.keys(initialRevealedMap).map(Number);
  const revealedCount = attempt?.revealedHintsCount ?? revealedIndices.length;
  const guessesRemaining = 2 - (attempt?.guessesUsed ?? 0);

  async function refreshRanking() {
    try {
      const res = await fetch("/api/daily-challenge/ranking");
      if (res.ok) setRanking(await res.json());
    } catch {}
  }

  async function handleRevealHint(hintIndex: number) {
    if (completed || revealedMap[hintIndex] !== undefined || revealingIndex !== null) return;
    setRevealingIndex(hintIndex);
    try {
      const res = await fetch("/api/daily-challenge/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, hintIndex }),
      });
      const data = await res.json();
      if (!res.ok) return;

      setRevealedMap((prev) => ({ ...prev, [hintIndex]: data.hint }));
      setAttempt((prev) => ({
        ...(prev ?? { guessesUsed: 0, solved: false, guesses: [] }),
        revealedHintsCount: data.revealedHintsCount,
        revealedIndices: data.revealedIndices,
        completed: data.completed,
        points: data.points ?? prev?.points ?? null,
        answer: data.answer ?? prev?.answer,
        lostTurn: data.lostTurn || prev?.lostTurn,
      }));

      if (data.lostTurn) await refreshRanking();
    } finally {
      setRevealingIndex(null);
    }
  }

  async function handleGuess(e: React.FormEvent) {
    e.preventDefault();
    if (!guess.trim() || loading || completed) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/daily-challenge/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, guess: guess.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setFeedback({ type: "error", msg: data.error }); return; }

      setAttempt((prev) => ({
        ...(prev ?? { revealedHintsCount: revealedCount, revealedIndices, solved: false }),
        guessesUsed: data.guessesUsed,
        solved: data.solved,
        completed: data.completed,
        points: data.points,
        answer: data.answer ?? prev?.answer,
        guesses: [...(prev?.guesses ?? []), { guess: guess.trim(), isCorrect: data.isCorrect }],
      }));
      setGuess("");

      if (data.isCorrect) {
        setFeedback({ type: "success", msg: "🎉 Correto! Parabéns!" });
      } else if (data.completed) {
        setFeedback({ type: "error", msg: "Tentativas esgotadas." });
      } else {
        const rem = 2 - data.guessesUsed;
        setFeedback({ type: "info", msg: `❌ Incorreto. Você ainda tem ${rem} palpite${rem > 1 ? "s" : ""}.` });
      }

      if (data.completed) await refreshRanking();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <PageHeader title="Desafio do Dia!" subtitle="Toque em uma dica para revelá-la" icon="🎯" />

      {/* Disclaimer */}
      <div style={{
        background: "rgba(249,194,0,0.08)",
        border: "1px solid rgba(249,194,0,0.25)",
        borderRadius: 10,
        padding: "10px 16px",
        marginBottom: 20,
        textAlign: "center",
      }}>
        <strong style={{ fontSize: 13, color: "#F9C200", textTransform: "uppercase", letterSpacing: 0.5 }}>
          ESSA PARTE NÃO AFETA EM NADA O BOLÃO! É APENAS PARA DIVERSÃO.
        </strong>
      </div>

      {/* Category + counter */}
      <div style={{
        background: "linear-gradient(135deg, var(--verde-escuro), var(--azul))",
        borderRadius: 16,
        padding: "18px 24px",
        marginBottom: 20,
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.75, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Categoria</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>🎯 EU SOU: {category.toUpperCase()}</div>
        </div>
        <div style={{
          background: "rgba(249,194,0,0.2)",
          border: "2px solid #F9C200",
          borderRadius: 10,
          padding: "8px 16px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 10, color: "#F9C200", fontWeight: 600 }}>DICAS ABERTAS</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#F9C200" }}>{revealedCount}/{totalHints}</div>
        </div>
      </div>

      {/* LOSE TURN */}
      {attempt?.lostTurn && completed && (
        <div style={{
          background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.05))",
          border: "2px solid rgba(239,68,68,0.4)",
          borderRadius: 16, padding: "20px 24px", marginBottom: 20, textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>💀</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#f87171", marginBottom: 4 }}>PERCA SUA VEZ!</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Você encontrou a dica especial. Desafio encerrado!</div>
        </div>
      )}

      {/* Result */}
      {completed && (
        <div style={{
          background: attempt?.solved ? "rgba(0,212,170,0.08)" : "rgba(239,68,68,0.05)",
          border: `2px solid ${attempt?.solved ? "rgba(0,212,170,0.4)" : "rgba(239,68,68,0.3)"}`,
          borderRadius: 16, padding: "20px 24px", marginBottom: 20, textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{attempt?.solved ? "🏆" : "😔"}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: attempt?.solved ? "#00d4aa" : "#f87171", marginBottom: 8 }}>
            {attempt?.solved ? "Você acertou!" : "Não foi dessa vez"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
            Resposta: <strong style={{ color: "var(--text-primary)" }}>{attempt?.answer}</strong>
          </div>
          {attempt?.solved && (
            <div style={{
              display: "inline-block",
              background: "rgba(249,194,0,0.15)",
              border: "2px solid #F9C200",
              borderRadius: 10, padding: "8px 20px",
            }}>
              <div style={{ fontSize: 10, color: "#F9C200", fontWeight: 600 }}>PONTUAÇÃO</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#F9C200" }}>{attempt.points} pts</div>
            </div>
          )}
        </div>
      )}

      {/* Guess history */}
      {(attempt?.guesses?.length ?? 0) > 0 && (
        <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          {attempt!.guesses.map((g, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: g.isCorrect ? "rgba(0,212,170,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${g.isCorrect ? "rgba(0,212,170,0.3)" : "rgba(239,68,68,0.3)"}`,
              color: g.isCorrect ? "#00d4aa" : "#f87171",
            }}>
              {g.isCorrect ? "✅" : "❌"} {g.guess}
            </div>
          ))}
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div style={{
          padding: "10px 16px", borderRadius: 8, marginBottom: 16,
          fontSize: 13, fontWeight: 600, textAlign: "center",
          background: feedback.type === "success" ? "rgba(0,212,170,0.1)" : feedback.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(59,130,246,0.1)",
          border: `1px solid ${feedback.type === "success" ? "rgba(0,212,170,0.3)" : feedback.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.3)"}`,
          color: feedback.type === "success" ? "#00d4aa" : feedback.type === "error" ? "#f87171" : "#60a5fa",
        }}>
          {feedback.msg}
        </div>
      )}

      {/* Hint tiles grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 24 }}>
        {Array.from({ length: totalHints }, (_, i) => {
          const revealed = revealedMap[i];
          const isRevealing = revealingIndex === i;
          const isLoseTurn = revealed?.type === "LOSE_TURN";

          return (
            <div
              key={i}
              onClick={() => !completed && !revealed && handleRevealHint(i)}
              style={{
                background: revealed
                  ? isLoseTurn ? "rgba(239,68,68,0.15)" : "var(--bg-card)"
                  : completed ? "rgba(255,255,255,0.03)" : "rgba(249,194,0,0.08)",
                border: revealed
                  ? isLoseTurn ? "1px solid rgba(239,68,68,0.4)" : "1px solid var(--border-color)"
                  : completed ? "1px solid rgba(255,255,255,0.06)" : "1px dashed rgba(249,194,0,0.35)",
                borderRadius: 10,
                padding: "10px 8px",
                minHeight: 80,
                cursor: revealed || completed ? "default" : "pointer",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 6,
                opacity: isRevealing ? 0.6 : 1,
              }}
            >
              <span style={{
                fontSize: 11, fontWeight: 800,
                color: revealed
                  ? isLoseTurn ? "#f87171" : "#F9C200"
                  : completed ? "rgba(255,255,255,0.2)" : "rgba(249,194,0,0.7)",
                background: revealed
                  ? isLoseTurn ? "rgba(239,68,68,0.2)" : "rgba(249,194,0,0.15)"
                  : "transparent",
                borderRadius: 20,
                padding: revealed ? "2px 7px" : "0",
                flexShrink: 0,
              }}>
                {isRevealing ? "..." : revealed ? `#${i + 1}` : i + 1}
              </span>

              {revealed ? (
                <span style={{
                  fontSize: 12,
                  color: isLoseTurn ? "#f87171" : "var(--text-primary)",
                  fontWeight: isLoseTurn ? 700 : 400,
                  textAlign: "center",
                  lineHeight: 1.4,
                }}>
                  {revealed.text}
                </span>
              ) : (
                !completed && <span style={{ fontSize: 18, opacity: 0.4 }}>👁️</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Guess input */}
      {!completed && (
        <div style={{ marginBottom: 28 }}>
          <form onSubmit={handleGuess} style={{ display: "flex", gap: 8 }}>
            <input
              className="input-field"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Seu palpite..."
              disabled={loading}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn-primary btn-gold"
              disabled={loading || !guess.trim()}
              style={{ padding: "0 20px", opacity: loading ? 0.7 : 1, whiteSpace: "nowrap" }}
            >
              {loading ? "..." : `Palpitar (${guessesRemaining})`}
            </button>
          </form>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 8, textAlign: "center" }}>
            {guessesRemaining} palpite{guessesRemaining !== 1 ? "s" : ""} restante{guessesRemaining !== 1 ? "s" : ""} · Você pode palpitar a qualquer hora
          </div>
        </div>
      )}

      {/* Ranking */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-color)" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
            🏅 Ranking do Desafio de Hoje
          </h3>
        </div>
        {ranking.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
            Ninguém completou ainda. Seja o primeiro!
          </div>
        ) : (
          ranking.map((entry) => (
            <div key={entry.username} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 20px", borderBottom: "1px solid var(--border-color)",
              background: entry.username === currentUserUsername ? "rgba(59,130,246,0.05)" : "transparent",
            }}>
              <span style={{ fontSize: 16, fontWeight: 800, minWidth: 28, color: entry.rank <= 3 ? "#F9C200" : "var(--text-secondary)" }}>
                {entry.rank <= 3 ? ["🥇","🥈","🥉"][entry.rank - 1] : `#${entry.rank}`}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{entry.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>@{entry.username}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: entry.solved ? "#00d4aa" : "#f87171" }}>
                  {entry.solved ? `${entry.points} pts` : "0 pts"}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>
                  {entry.solved ? "✅ acertou" : "❌ errou"}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
