"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isMatchLocked, getLockTime } from "@/lib/lockTime";
import { calculateOdd, ODDS_CONFIG } from "@/lib/odds";

const PHASE_LABELS: Record<string, string> = {
  GROUP: "Fase de Grupos",
  ROUND_OF_16: "16 Avos",
  QUARTER_FINAL: "Quartas",
  SEMI_FINAL: "Semifinal",
  THIRD_PLACE: "3º Lugar",
  FINAL: "Final",
};

interface Props {
  match: any;
  prediction: { id: string; homeScore: number; awayScore: number } | null;
  allPredictions: any[];
  userId: string;
  locked: boolean;
}

export function PredictionFormClient({ match, prediction, allPredictions, userId, locked }: Props) {
  const router = useRouter();
  const [homeScore, setHomeScore] = useState<string>(prediction?.homeScore?.toString() ?? "");
  const [awayScore, setAwayScore] = useState<string>(prediction?.awayScore?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [oddData, setOddData] = useState<{ counts: Record<string, number>; winnerCounts: Record<string, number>; total: number } | null>(null);

  const matchDate = new Date(match.matchDate);
  const lockTime  = getLockTime(matchDate);
  const isLocked  = locked || isMatchLocked(matchDate);
  const finished  = match.status === "FINISHED";
  const hasResult = match.homeScore !== null && match.homeScore !== undefined;

  // Busca odds e repete a cada 20s para capturar novos palpites de outros usuários
  useEffect(() => {
    if (isLocked || finished) return;
    const fetchOdds = () => {
      fetch(`/api/predictions/odds?matchId=${match.id}`)
        .then((r) => r.json())
        .then((d) => setOddData(d))
        .catch(() => {});
    };
    fetchOdds();
    const interval = setInterval(fetchOdds, 10000); // atualiza a cada 10s
    return () => clearInterval(interval);
  }, [match.id, isLocked, finished]);

  function calcOdds() {
    if (!oddData || homeScore === "" || awayScore === "") return null;

    const N   = Math.max(oddData.total, 1);
    const key = `${homeScore}-${awayScore}`;
    const outcome = parseInt(homeScore) > parseInt(awayScore) ? "home"
      : parseInt(awayScore) > parseInt(homeScore) ? "away" : "draw";

    // k_exact: desconta o próprio usuário se já tem esse placar exato
    const alreadyHasThisExact =
      prediction?.homeScore?.toString() === homeScore &&
      prediction?.awayScore?.toString() === awayScore;
    const k_exact = (oddData.counts[key] ?? 0) + (alreadyHasThisExact ? 0 : 1);

    // k_winner: desconta o usuário se o palpite atual já está contado no mesmo outcome
    const prevOutcome = prediction
      ? (prediction.homeScore > prediction.awayScore ? "home" : prediction.awayScore > prediction.homeScore ? "away" : "draw")
      : null;
    const alreadyCountedForOutcome = prevOutcome === outcome;
    const k_winner = (oddData.winnerCounts?.[outcome] ?? 0) + (alreadyCountedForOutcome ? 0 : 1);

    const oddExact  = calculateOdd(Math.max(k_exact, 1), N);
    const oddWinner = calculateOdd(Math.max(k_winner, 1), N);

    return {
      oddExact,
      oddWinner,
      ptsExact:  ODDS_CONFIG.POINTS.EXACT_SCORE * oddExact,
      ptsWinner: ODDS_CONFIG.POINTS.WINNER * oddWinner,
      k_exact,
      k_winner,
    };
  }

  const odds = calcOdds();

  function oddColor(odd: number) {
    if (odd >= 0.85) return "#009C3B";  // verde: palpite raro, odd alta
    if (odd >= 0.65) return "#d97706";  // laranja: moderado
    return "#dc2626";                   // vermelho: muito popular, odd baixa
  }

  async function handleSave() {
    if (homeScore === "" || awayScore === "") {
      setFeedback({ type: "error", msg: "Preencha o placar completo." });
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          homeScore: parseInt(homeScore),
          awayScore: parseInt(awayScore),
          ...(prediction ? { id: prediction.id } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      setFeedback({ type: "success", msg: prediction ? "Palpite atualizado!" : "Palpite salvo!" });
      setTimeout(() => router.push("/predictions"), 1200);
    } catch (e: any) {
      setFeedback({ type: "error", msg: e.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!prediction || !confirm("Excluir seu palpite?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/predictions/${prediction.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      router.push("/predictions");
    } catch {
      setFeedback({ type: "error", msg: "Erro ao excluir palpite." });
    } finally {
      setDeleting(false);
    }
  }

  function getPredResult(homeS: number, awayS: number) {
    if (!hasResult) return null;
    if (homeS === match.homeScore && awayS === match.awayScore) return "exact";
    const actualW = match.homeScore > match.awayScore ? "home" : match.awayScore > match.homeScore ? "away" : "draw";
    const predW   = homeS > awayS ? "home" : awayS > homeS ? "away" : "draw";
    return predW === actualW ? "winner" : "none";
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      {/* Back */}
      <button onClick={() => router.back()} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer", marginBottom: 20, padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
        ← Voltar
      </button>

      {/* Match header card */}
      <div style={{ background: "var(--bg-card)", border: `1px solid ${isLocked ? "rgba(245,166,35,0.4)" : "var(--border-color)"}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#8b5cf6", textTransform: "uppercase", letterSpacing: 0.5 }}>
            {match.groupName ? `Grupo ${match.groupName}` : PHASE_LABELS[match.phase]}
            {match.round ? ` · Rodada ${match.round}` : ""}
          </span>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            {matchDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}{" "}
            às {matchDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        {/* Teams */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
              {match.homeTeam}
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            {hasResult ? (
              <div style={{ background: "var(--bg-secondary)", border: "2px solid rgba(0,212,170,0.4)", borderRadius: 10, padding: "8px 16px", display: "inline-flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: "#00d4aa" }}>{match.homeScore}</span>
                <span style={{ fontSize: 16, color: "var(--text-secondary)" }}>–</span>
                <span style={{ fontSize: 28, fontWeight: 900, color: "#00d4aa" }}>{match.awayScore}</span>
              </div>
            ) : (
              <div style={{ color: "var(--text-secondary)", fontSize: 22, fontWeight: 700 }}>×</div>
            )}
          </div>

          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
              {match.awayTeam}
            </div>
          </div>
        </div>

        {/* Status */}
        <div style={{ textAlign: "center", marginTop: 14 }}>
          {finished ? (
            <span style={{ fontSize: 12, fontWeight: 700, background: "rgba(0,212,170,0.15)", color: "#00d4aa", padding: "4px 12px", borderRadius: 999 }}>✅ Finalizado</span>
          ) : isLocked ? (
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, background: "rgba(245,166,35,0.15)", color: "#f5a623", padding: "4px 12px", borderRadius: 999 }}>🔒 Palpites Bloqueados</span>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                Bloqueado às {lockTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ) : (
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, background: "rgba(59,130,246,0.15)", color: "#60a5fa", padding: "4px 12px", borderRadius: 999 }}>✏️ Palpites Abertos</span>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                🔒 Bloqueia às {lockTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} de{" "}
                {lockTime.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prediction form */}
      {!isLocked && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 20px", textAlign: "center" }}>
            {prediction ? "✏️ Editar Palpite" : "🎯 Fazer Palpite"}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 1fr", alignItems: "center", gap: 8, marginBottom: 20 }}>
            {/* Home */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textAlign: "center", lineHeight: 1.3 }}>
                {match.homeTeam}
              </span>
              <input
                type="number"
                className="score-input"
                min={0} max={20}
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value.replace(/^0+(?=\d)/, ""))}
                placeholder="0"
                style={{ width: 64, height: 64, fontSize: 28 }}
              />
            </div>

            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-secondary)" }}>–</span>
            </div>

            {/* Away */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textAlign: "center", lineHeight: 1.3 }}>
                {match.awayTeam}
              </span>
              <input
                type="number"
                className="score-input"
                min={0} max={20}
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value.replace(/^0+(?=\d)/, ""))}
                placeholder="0"
                style={{ width: 64, height: 64, fontSize: 28 }}
              />
            </div>
          </div>

          {/* Pontuação esperada em tempo real */}
          {odds ? (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 10,
              }}>
                {/* Placar exato */}
                <div style={{
                  background: odds.oddExact >= 0.85 ? "linear-gradient(135deg, #f0fdf4, #dcfce7)"
                    : odds.oddExact >= 0.65 ? "linear-gradient(135deg, #fffbeb, #fef3c7)"
                    : "linear-gradient(135deg, #fef2f2, #fee2e2)",
                  border: `2px solid ${oddColor(odds.oddExact)}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: oddColor(odds.oddExact), marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    🎯 Se acertar o placar exato
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: oddColor(odds.oddExact), lineHeight: 1 }}>
                    {odds.ptsExact.toFixed(1)}
                    <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 3 }}>pts</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                    odd {(odds.oddExact * 100).toFixed(0)}% · {odds.k_exact} pessoa{odds.k_exact !== 1 ? "s" : ""} com {homeScore}–{awayScore}
                  </div>
                </div>

                {/* Só o vencedor */}
                <div style={{
                  background: odds.oddWinner >= 0.85 ? "linear-gradient(135deg, #f0fdf4, #dcfce7)"
                    : odds.oddWinner >= 0.65 ? "linear-gradient(135deg, #fffbeb, #fef3c7)"
                    : "linear-gradient(135deg, #fef2f2, #fee2e2)",
                  border: `2px solid ${oddColor(odds.oddWinner)}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: oddColor(odds.oddWinner), marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    ✅ Se acertar o vencedor
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: oddColor(odds.oddWinner), lineHeight: 1 }}>
                    {odds.ptsWinner.toFixed(1)}
                    <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 3 }}>pts</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                    odd {(odds.oddWinner * 100).toFixed(0)}% · {odds.k_winner} pessoa{odds.k_winner !== 1 ? "s" : ""} com o mesmo vencedor
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", textAlign: "center" }}>
                💡 Placar exato e vencedor têm odds independentes. Atualiza a cada 10s.
              </div>
            </div>
          ) : homeScore !== "" && awayScore !== "" ? (
            <div style={{ marginBottom: 16, textAlign: "center", fontSize: 13, color: "var(--text-secondary)" }}>
              Calculando odds...
            </div>
          ) : null}

          {feedback && (
            <div className={feedback.type === "success" ? "alert-success" : "alert-error"} style={{ marginBottom: 16, textAlign: "center", fontSize: 14 }}>
              {feedback.msg}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleSave} disabled={loading} className="btn-primary" style={{ flex: 1, justifyContent: "center", padding: "12px", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Salvando..." : prediction ? "💾 Atualizar" : "💾 Salvar Palpite"}
            </button>
            {prediction && (
              <button onClick={handleDelete} disabled={deleting} className="btn-primary btn-danger" style={{ padding: "12px 16px", opacity: deleting ? 0.7 : 1 }}>
                🗑️
              </button>
            )}
          </div>
        </div>
      )}

      {/* My prediction (locked) */}
      {isLocked && prediction && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-highlight)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, textAlign: "center" }}>
            Seu Palpite
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "right" }}>{match.homeTeam}</span>
              <span style={{ fontSize: 36, fontWeight: 900, color: "var(--text-primary)" }}>{prediction.homeScore}</span>
            </div>
            <span style={{ fontSize: 20, color: "var(--text-secondary)", fontWeight: 700 }}>–</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{match.awayTeam}</span>
              <span style={{ fontSize: 36, fontWeight: 900, color: "var(--text-primary)" }}>{prediction.awayScore}</span>
            </div>
          </div>
          {hasResult && (() => {
            const result = getPredResult(prediction.homeScore, prediction.awayScore);
            return (
              <div style={{ marginTop: 14, textAlign: "center", fontSize: 15, fontWeight: 800, color: result === "exact" ? "#ffd700" : result === "winner" ? "#00d4aa" : "#ef4444" }}>
                {result === "exact" ? "🎯 Placar Exato!" : result === "winner" ? "✅ Vencedor Correto" : "❌ Errou"}
              </div>
            );
          })()}
        </div>
      )}

      {/* All predictions table (after lock) */}
      {isLocked && allPredictions.length > 0 && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-color)" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>📊 Palpites dos Participantes</h3>
          </div>
          <div>
            {allPredictions.map((pred: any) => {
              const result = getPredResult(pred.homeScore, pred.awayScore);
              return (
                <div key={pred.id} style={{ display: "flex", alignItems: "center", padding: "10px 20px", borderBottom: "1px solid var(--border-color)", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: pred.userId === userId ? "linear-gradient(135deg, #f5a623, #ffd700)" : "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: pred.userId === userId ? "#0a0e1a" : "white", flexShrink: 0 }}>
                    {pred.user.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: pred.userId === userId ? "#f5a623" : "var(--text-primary)" }}>
                      {pred.user.name}{pred.userId === userId ? " (você)" : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontWeight: 900, fontSize: 17, color: result === "exact" ? "#ffd700" : result === "winner" ? "#00d4aa" : "var(--text-primary)" }}>
                      {pred.homeScore}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>–</span>
                    <span style={{ fontWeight: 900, fontSize: 17, color: result === "exact" ? "#ffd700" : result === "winner" ? "#00d4aa" : "var(--text-primary)" }}>
                      {pred.awayScore}
                    </span>
                  </div>
                  <div style={{ fontSize: 16, minWidth: 20, textAlign: "center" }}>
                    {result === null ? "" : result === "exact" ? "🎯" : result === "winner" ? "✅" : "❌"}
                  </div>
                  {pred.points !== null && (
                    <div style={{ fontSize: 12, fontWeight: 700, color: result === "exact" ? "#ffd700" : result === "winner" ? "#00d4aa" : "#6b7280", minWidth: 46, textAlign: "right" }}>
                      {pred.points > 0 ? `+${pred.points.toFixed(1)}` : "0"} pts
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
