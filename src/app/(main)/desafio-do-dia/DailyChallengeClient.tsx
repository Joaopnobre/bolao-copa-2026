"use client";

import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Hint } from "@/lib/daily-challenge";

interface RankingEntry {
  rank: number;
  name: string;
  username: string;
  points: number;
  solved: boolean;
}

interface AttemptState {
  revealedHintsCount: number;
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
  initialRevealedHints: Hint[];
  initialAttempt: AttemptState | null;
  initialRanking: RankingEntry[];
  currentUserId: string;
  currentUserName: string;
}

export function DailyChallengeClient({
  challengeId,
  category,
  totalHints,
  initialRevealedHints,
  initialAttempt,
  initialRanking,
  currentUserId,
  currentUserName,
}: Props) {
  const [revealedHints, setRevealedHints] = useState<Hint[]>(initialRevealedHints);
  const [attempt, setAttempt] = useState<AttemptState | null>(initialAttempt);
  const [guess, setGuess] = useState("");
  const [loading, setLoading] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [ranking, setRanking] = useState<RankingEntry[]>(initialRanking);
  const [newHintIndex, setNewHintIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const revealedCount = attempt?.revealedHintsCount ?? revealedHints.length;
  const completed = attempt?.completed ?? false;
  const allHintsRevealed = revealedCount >= totalHints;

  async function refreshRanking() {
    try {
      const res = await fetch("/api/daily-challenge/ranking");
      if (res.ok) setRanking(await res.json());
    } catch {}
  }

  async function handleRevealHint() {
    setHintLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/daily-challenge/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });
      const data = await res.json();
      if (!res.ok) { setFeedback({ type: "error", msg: data.error }); return; }

      setRevealedHints((prev) => [...prev, data.hint]);
      setNewHintIndex(revealedCount);
      setTimeout(() => setNewHintIndex(null), 1000);

      setAttempt((prev) => ({
        ...(prev ?? { guessesUsed: 0, solved: false, guesses: [] }),
        revealedHintsCount: data.revealedHintsCount,
        completed: data.completed,
        points: data.points,
        answer: data.answer ?? prev?.answer,
        lostTurn: data.lostTurn,
      }));

      if (data.lostTurn) {
        await refreshRanking();
      }
    } catch {
      setFeedback({ type: "error", msg: "Erro ao revelar dica." });
    } finally {
      setHintLoading(false);
    }
  }

  async function handleGuess(e: React.FormEvent) {
    e.preventDefault();
    if (!guess.trim() || loading) return;
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
        ...(prev ?? { revealedHintsCount: revealedCount, solved: false }),
        guessesUsed: data.guessesUsed,
        solved: data.solved,
        completed: data.completed,
        points: data.points,
        answer: data.answer ?? prev?.answer,
        guesses: [
          ...(prev?.guesses ?? []),
          { guess: guess.trim(), isCorrect: data.isCorrect },
        ],
      }));

      setGuess("");

      if (data.isCorrect) {
        setFeedback({ type: "success", msg: "🎉 Correto! Parabéns!" });
      } else if (data.completed) {
        setFeedback({ type: "error", msg: "Tentativas esgotadas." });
      } else {
        const remaining = 2 - data.guessesUsed;
        setFeedback({ type: "info", msg: `❌ Incorreto. Você ainda tem ${remaining} palpite${remaining > 1 ? "s" : ""}.` });
      }

      if (data.completed) await refreshRanking();
    } catch {
      setFeedback({ type: "error", msg: "Erro ao enviar palpite." });
    } finally {
      setLoading(false);
    }
  }

  const lostTurn = attempt?.lostTurn;
  const guessesRemaining = 2 - (attempt?.guessesUsed ?? 0);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <PageHeader title="Desafio do Dia!" subtitle="Adivinhe baseado nas dicas" icon="🎯" />

      {/* Category card */}
      <div style={{
        background: "linear-gradient(135deg, var(--verde-escuro), var(--azul))",
        borderRadius: 16,
        padding: "20px 24px",
        marginBottom: 20,
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.75, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Categoria</div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>🎯 EU SOU: {category.toUpperCase()}</div>
        </div>
        <div style={{
          background: "rgba(249,194,0,0.2)",
          border: "2px solid #F9C200",
          borderRadius: 10,
          padding: "8px 16px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 10, color: "#F9C200", fontWeight: 600 }}>DICAS</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#F9C200" }}>{revealedCount}/{totalHints}</div>
        </div>
      </div>

      {/* Guesses feedback */}
      {attempt?.guesses && attempt.guesses.length > 0 && (
        <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          {attempt.guesses.map((g, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 14px",
              borderRadius: 8,
              background: g.isCorrect ? "rgba(0,212,170,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${g.isCorrect ? "rgba(0,212,170,0.3)" : "rgba(239,68,68,0.3)"}`,
              fontSize: 13,
              color: g.isCorrect ? "#00d4aa" : "#f87171",
              fontWeight: 600,
            }}>
              {g.isCorrect ? "✅" : "❌"} {g.guess}
            </div>
          ))}
        </div>
      )}

      {/* Feedback message */}
      {feedback && (
        <div style={{
          padding: "10px 16px",
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
          fontWeight: 600,
          textAlign: "center",
          background: feedback.type === "success" ? "rgba(0,212,170,0.1)" : feedback.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(59,130,246,0.1)",
          border: `1px solid ${feedback.type === "success" ? "rgba(0,212,170,0.3)" : feedback.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.3)"}`,
          color: feedback.type === "success" ? "#00d4aa" : feedback.type === "error" ? "#f87171" : "#60a5fa",
        }}>
          {feedback.msg}
        </div>
      )}

      {/* LOSE TURN special message */}
      {lostTurn && completed && (
        <div style={{
          background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.05))",
          border: "2px solid rgba(239,68,68,0.4)",
          borderRadius: 16,
          padding: "20px 24px",
          marginBottom: 20,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>💀</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#f87171", marginBottom: 4 }}>
            PERCA SUA VEZ!
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Você encontrou a dica especial. Desafio encerrado!
          </div>
        </div>
      )}

      {/* Result card when completed */}
      {completed && (
        <div style={{
          background: attempt?.solved
            ? "linear-gradient(135deg, rgba(0,212,170,0.1), rgba(0,156,59,0.05))"
            : "rgba(239,68,68,0.05)",
          border: `2px solid ${attempt?.solved ? "rgba(0,212,170,0.4)" : "rgba(239,68,68,0.3)"}`,
          borderRadius: 16,
          padding: "20px 24px",
          marginBottom: 20,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>
            {attempt?.solved ? "🏆" : "😔"}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: attempt?.solved ? "#00d4aa" : "#f87171", marginBottom: 8 }}>
            {attempt?.solved ? "Você acertou!" : "Não foi dessa vez"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
            Resposta correta: <strong style={{ color: "var(--text-primary)" }}>{attempt?.answer}</strong>
          </div>
          {attempt?.solved && (
            <div style={{
              display: "inline-block",
              background: "rgba(249,194,0,0.15)",
              border: "2px solid #F9C200",
              borderRadius: 10,
              padding: "8px 20px",
            }}>
              <div style={{ fontSize: 10, color: "#F9C200", fontWeight: 600 }}>PONTUAÇÃO</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#F9C200" }}>{attempt.points} pts</div>
            </div>
          )}
        </div>
      )}

      {/* Hints list */}
      {revealedHints.length > 0 && (
        <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {revealedHints.map((hint, i) => (
            <div
              key={i}
              style={{
                background: hint.type === "LOSE_TURN"
                  ? "rgba(239,68,68,0.1)"
                  : "var(--bg-card)",
                border: `1px solid ${hint.type === "LOSE_TURN" ? "rgba(239,68,68,0.3)" : "var(--border-color)"}`,
                borderRadius: 10,
                padding: "12px 16px",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                animation: i === newHintIndex ? "slide-up 0.3s ease-out" : undefined,
              }}
            >
              <span style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: hint.type === "LOSE_TURN" ? "rgba(239,68,68,0.2)" : "rgba(249,194,0,0.15)",
                color: hint.type === "LOSE_TURN" ? "#f87171" : "#F9C200",
                fontSize: 11,
                fontWeight: 800,
                flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <span style={{
                fontSize: 14,
                color: hint.type === "LOSE_TURN" ? "#f87171" : "var(--text-primary)",
                fontWeight: hint.type === "LOSE_TURN" ? 700 : 400,
              }}>
                {hint.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions (only when not completed) */}
      {!completed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {/* Reveal hint button */}
          {!allHintsRevealed && (
            <button
              onClick={handleRevealHint}
              disabled={hintLoading}
              style={{
                background: "var(--bg-card)",
                border: "1px dashed var(--border-color)",
                borderRadius: 10,
                padding: "12px 20px",
                color: "var(--text-secondary)",
                fontSize: 14,
                fontWeight: 600,
                cursor: hintLoading ? "not-allowed" : "pointer",
                opacity: hintLoading ? 0.6 : 1,
                transition: "all 0.2s",
                textAlign: "center",
              }}
            >
              {hintLoading ? "Revelando..." : revealedHints.length === 0 ? "👁️ Ver primeira dica" : "👁️ Mostrar próxima dica"}
            </button>
          )}

          {/* Guess input */}
          <form onSubmit={handleGuess} style={{ display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
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
          <div style={{ fontSize: 11, color: "var(--text-secondary)", textAlign: "center" }}>
            {guessesRemaining} palpite{guessesRemaining !== 1 ? "s" : ""} restante{guessesRemaining !== 1 ? "s" : ""}
            {revealedHints.length === 0 && " · Você pode palpitar sem ver dicas"}
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
            Ninguém completou o desafio ainda. Seja o primeiro!
          </div>
        ) : (
          ranking.map((entry) => (
            <div key={entry.username} style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 20px",
              borderBottom: "1px solid var(--border-color)",
              background: entry.username === (currentUserName?.toLowerCase?.()) ? "rgba(59,130,246,0.05)" : "transparent",
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
