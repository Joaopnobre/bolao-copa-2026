"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";

const PHASE_LABELS: Record<string, string> = {
  GROUP: "Grupos", ROUND_OF_16: "16 Avos", ROUND_OF_8: "Oitavas", QUARTER_FINAL: "Quartas",
  SEMI_FINAL: "Semi", THIRD_PLACE: "3º Lugar", FINAL: "Final",
};

interface Props {
  user: { id: string; name: string; username: string; role: string };
  predictions: any[];
  specialPredictions: any[];
  stats: { totalPts: number; exactCount: number; winnerCount: number; rank: number; total: number };
  isOwnProfile: boolean;
}

export function ProfileClient({ user, predictions, specialPredictions, stats, isOwnProfile }: Props) {
  const router = useRouter();

  function getPredResult(pred: any) {
    const m = pred.match;
    if (m.homeScore === null) return null;
    if (pred.homeScore === m.homeScore && pred.awayScore === m.awayScore) return "exact";
    const actualW = m.homeScore > m.awayScore ? "home" : m.awayScore > m.homeScore ? "away" : "draw";
    const predW   = pred.homeScore > pred.awayScore ? "home" : pred.awayScore > pred.homeScore ? "away" : "draw";
    return predW === actualW ? "winner" : "none";
  }

  const finishedPreds = predictions.filter((p) => p.match.status === "FINISHED");
  const pendingPreds  = predictions.filter((p) => p.match.status !== "FINISHED");
  const champion = specialPredictions.find((p) => p.type === "CHAMPION");
  const scorer   = specialPredictions.find((p) => p.type === "TOP_SCORER");

  const MEDALS = ["🥇", "🥈", "🥉"];

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <button onClick={() => router.back()} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer", marginBottom: 20, padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
        ← Voltar
      </button>

      {/* Header do perfil */}
      <div style={{
        background: "linear-gradient(135deg, var(--verde-escuro), var(--azul))",
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        color: "white",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, #F9C200, #d4a000)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 900, color: "#002776", flexShrink: 0,
          }}>
            {user.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{user.name}</div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>@{user.username}</div>
          </div>
          {isOwnProfile && (
            <Link href="/settings" style={{
              background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
              color: "white", padding: "8px 16px", borderRadius: 8,
              textDecoration: "none", fontSize: 13, fontWeight: 600,
            }}>
              ⚙️ Alterar senha
            </Link>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20 }}>
          {[
            { label: "Posição", value: stats.rank > 0 ? (stats.rank <= 3 ? MEDALS[stats.rank - 1] + ` #${stats.rank}` : `#${stats.rank}`) : "–" },
            { label: "Pontos", value: stats.totalPts.toFixed(1) },
            { label: "🎯 Exatos", value: stats.exactCount },
            { label: "✅ Vencedores", value: stats.winnerCount },
          ].map((s) => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Palpites especiais */}
      {(champion || scorer) && (
        <div style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-color)", borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Palpites Especiais</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {champion && (
              <div style={{ background: "var(--ouro-bg)", border: "1px solid #fcd34d", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, color: "#854d0e", fontWeight: 600, marginBottom: 4 }}>👑 Campeão</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{champion.value}</div>
                {champion.points !== null && (
                  <div style={{ fontSize: 12, color: "#d4a000", fontWeight: 700 }}>+{champion.points?.toFixed(1)} pts</div>
                )}
              </div>
            )}
            {scorer && (
              <div style={{ background: "var(--verde-bg)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, color: "var(--verde-escuro)", fontWeight: 600, marginBottom: 4 }}>⚽ Artilheiro</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{scorer.value}</div>
                {scorer.points !== null && (
                  <div style={{ fontSize: 12, color: "var(--verde)", fontWeight: 700 }}>+{scorer.points?.toFixed(1)} pts</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resultados finalizados */}
      {finishedPreds.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
            ✅ Resultados ({finishedPreds.length} jogos)
          </div>
          <div style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-color)", borderRadius: 14, overflow: "hidden" }}>
            {finishedPreds.map((pred) => {
              const result = getPredResult(pred);
              return (
                <div key={pred.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 16px", borderBottom: "1px solid var(--verde-bg)",
                }}>
                  {/* Fase */}
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", minWidth: 50, textAlign: "center" }}>
                    {pred.match.groupName ? `Grp ${pred.match.groupName}` : PHASE_LABELS[pred.match.phase]}
                  </div>

                  {/* Jogo */}
                  <div style={{ flex: 1, fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{pred.match.homeTeam}</span>
                    <span style={{ color: "var(--text-secondary)", margin: "0 6px" }}>
                      {pred.match.homeScore}–{pred.match.awayScore}
                    </span>
                    <span style={{ fontWeight: 600 }}>{pred.match.awayTeam}</span>
                  </div>

                  {/* Palpite */}
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", minWidth: 40, textAlign: "center" }}>
                    <span style={{
                      fontWeight: 700,
                      color: result === "exact" ? "#d4a000" : result === "winner" ? "var(--verde)" : "#ef4444",
                    }}>
                      {pred.homeScore}–{pred.awayScore}
                    </span>
                  </div>

                  {/* Ícone */}
                  <div style={{ fontSize: 16, minWidth: 20, textAlign: "center" }}>
                    {result === "exact" ? "🎯" : result === "winner" ? "✅" : "❌"}
                  </div>

                  {/* Pontos */}
                  <div style={{ fontSize: 13, fontWeight: 700, minWidth: 52, textAlign: "right",
                    color: result === "exact" ? "#d4a000" : result === "winner" ? "var(--verde)" : "var(--text-secondary)"
                  }}>
                    {(pred.points ?? 0) > 0 ? `+${pred.points?.toFixed(1)}` : "0"} pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Palpites pendentes (bloqueados mas sem resultado ainda) */}
      {pendingPreds.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
            🔒 Palpites Bloqueados ({pendingPreds.length})
          </div>
          <div style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-color)", borderRadius: 14, overflow: "hidden" }}>
            {pendingPreds.map((pred) => (
              <div key={pred.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 16px", borderBottom: "1px solid var(--verde-bg)",
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", minWidth: 50, textAlign: "center" }}>
                  {pred.match.groupName ? `Grp ${pred.match.groupName}` : PHASE_LABELS[pred.match.phase]}
                </div>
                <div style={{ flex: 1, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{pred.match.homeTeam}</span>
                  <span style={{ color: "var(--text-secondary)", margin: "0 6px" }}>×</span>
                  <span style={{ fontWeight: 600 }}>{pred.match.awayTeam}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                  {pred.homeScore}–{pred.awayScore}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {predictions.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <div>Nenhum palpite visível ainda.</div>
        </div>
      )}
    </div>
  );
}
