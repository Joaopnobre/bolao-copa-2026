"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

interface RankingEntry {
  id: string;
  name: string;
  username: string;
  totalPoints: number;
  matchPoints: number;
  champPoints: number;
  scorerPoints: number;
  exactCount: number;
  winnerCount: number;
}

interface Props {
  ranking: RankingEntry[];
  currentUserId: string;
}

const MEDALS = ["🥇", "🥈", "🥉"];
const RANK_COLORS = ["#ffd700", "#c0c0c0", "#cd7f32"];

export function RankingClient({ ranking, currentUserId }: Props) {
  if (ranking.length === 0) {
    return (
      <div>
        <PageHeader title="Ranking Geral" subtitle="Classificação dos participantes" icon="🏆" />
        <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Ranking ainda não disponível</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Os pontos aparecerão após os primeiros resultados.</div>
        </div>
      </div>
    );
  }

  const topPlayers = ranking.slice(0, 3);
  const myPosition = ranking.findIndex((r) => r.id === currentUserId);
  const myEntry = ranking[myPosition];

  return (
    <div>
      <PageHeader title="Ranking Geral" subtitle="Classificação dos participantes" icon="🏆" />

      {/* Podium */}
      {topPlayers.length >= 1 && (
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
              gap: 12,
              padding: "24px 16px 0",
            }}
          >
            {[topPlayers[1], topPlayers[0], topPlayers[2]].filter(Boolean).map((player, i) => {
              const originalIdx = i === 0 ? 1 : i === 1 ? 0 : 2;
              const height = originalIdx === 0 ? 120 : originalIdx === 1 ? 100 : 85;
              return (
                <div key={player.id} style={{ textAlign: "center", flex: 1, maxWidth: 160 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{MEDALS[originalIdx]}</div>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background:
                        originalIdx === 0
                          ? "linear-gradient(135deg, #ffd700, #f5a623)"
                          : originalIdx === 1
                          ? "linear-gradient(135deg, #c0c0c0, #9ca3af)"
                          : "linear-gradient(135deg, #cd7f32, #a0522d)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      fontWeight: 800,
                      color: "white",
                      margin: "0 auto 8px",
                      boxShadow: `0 0 20px ${RANK_COLORS[originalIdx]}50`,
                    }}
                  >
                    {player.name[0]}
                  </div>
                  <Link href={`/profile/${player.id}`} style={{ textDecoration: "none" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--verde-escuro)", marginBottom: 2, cursor: "pointer" }}>
                      {player.name}
                    </div>
                  </Link>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: RANK_COLORS[originalIdx],
                    }}
                  >
                    {player.totalPoints.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>pts</div>
                  <div
                    style={{
                      marginTop: 10,
                      height,
                      background:
                        originalIdx === 0
                          ? "linear-gradient(180deg, rgba(255,215,0,0.2), rgba(255,215,0,0.05))"
                          : originalIdx === 1
                          ? "linear-gradient(180deg, rgba(192,192,192,0.15), rgba(192,192,192,0.05))"
                          : "linear-gradient(180deg, rgba(205,127,50,0.15), rgba(205,127,50,0.05))",
                      borderRadius: "8px 8px 0 0",
                      border: `1px solid ${RANK_COLORS[originalIdx]}30`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My position highlight */}
      {myEntry && myPosition > 2 && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.05))",
            border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 900, color: "#60a5fa" }}>#{myPosition + 1}</span>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            Você está em {myPosition + 1}º lugar com {myEntry.totalPoints.toFixed(1)} pontos
          </div>
        </div>
      )}

      {/* Full table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, overflow: "hidden" }}>
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "48px 1fr 80px 70px 70px 70px 70px",
            padding: "10px 16px",
            background: "var(--bg-secondary)",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            borderBottom: "1px solid var(--border-color)",
            gap: 4,
          }}
        >
          <span>#</span>
          <span>Participante</span>
          <span style={{ textAlign: "right" }}>Total</span>
          <span style={{ textAlign: "right" }}>Jogos</span>
          <span style={{ textAlign: "right" }}>👑</span>
          <span style={{ textAlign: "right" }}>⚽</span>
          <span style={{ textAlign: "right" }}>🎯 Exatos</span>
        </div>

        {/* Rows */}
        {ranking.map((entry, idx) => {
          const isMe = entry.id === currentUserId;
          const isTop = idx < 3;
          return (
            <div
              key={entry.id}
              style={{
                display: "grid",
                gridTemplateColumns: "48px 1fr 80px 70px 70px 70px 70px",
                padding: "12px 16px",
                borderBottom: "1px solid var(--border-color)",
                gap: 4,
                alignItems: "center",
                background: isMe
                  ? "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.04))"
                  : "transparent",
                transition: "background 0.2s",
              }}
            >
              {/* Position */}
              <div style={{ fontWeight: 800 }}>
                {idx < 3 ? (
                  <span style={{ fontSize: 20 }}>{MEDALS[idx]}</span>
                ) : (
                  <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{idx + 1}</span>
                )}
              </div>

              {/* Name */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: isMe
                      ? "linear-gradient(135deg, #f5a623, #ffd700)"
                      : isTop
                      ? `linear-gradient(135deg, ${RANK_COLORS[idx]}, ${RANK_COLORS[idx]}88)`
                      : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 800,
                    color: isMe ? "#0a0e1a" : "white",
                    flexShrink: 0,
                  }}
                >
                  {entry.name[0]}
                </div>
                <div>
                  <Link
                    href={`/profile/${entry.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, color: isMe ? "#d4a000" : "var(--verde-escuro)", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                    >
                      {entry.name}
                      {isMe && <span style={{ fontSize: 11, marginLeft: 6, color: "var(--azul-mid)" }}>(você)</span>}
                    </div>
                  </Link>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>@{entry.username}</div>
                </div>
              </div>

              {/* Total */}
              <div style={{ textAlign: "right", fontSize: 16, fontWeight: 800, color: isTop ? RANK_COLORS[idx] : "var(--text-primary)" }}>
                {entry.totalPoints.toFixed(1)}
              </div>

              {/* Match pts */}
              <div style={{ textAlign: "right", fontSize: 13, color: "var(--text-secondary)" }}>
                {entry.matchPoints.toFixed(1)}
              </div>

              {/* Champ pts */}
              <div style={{ textAlign: "right", fontSize: 13, color: entry.champPoints > 0 ? "#ffd700" : "var(--text-secondary)" }}>
                {entry.champPoints > 0 ? `+${entry.champPoints.toFixed(1)}` : "–"}
              </div>

              {/* Scorer pts */}
              <div style={{ textAlign: "right", fontSize: 13, color: entry.scorerPoints > 0 ? "#00d4aa" : "var(--text-secondary)" }}>
                {entry.scorerPoints > 0 ? `+${entry.scorerPoints.toFixed(1)}` : "–"}
              </div>

              {/* Exact count */}
              <div style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: entry.exactCount > 0 ? "#ffd700" : "var(--text-secondary)" }}>
                {entry.exactCount}🎯 / {entry.winnerCount}✅
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "var(--text-secondary)" }}>
        <span>👑 = Pontos Campeão</span>
        <span>⚽ = Pontos Artilheiro</span>
        <span>🎯 = Placares Exatos</span>
        <span>✅ = Vencedores</span>
        <span style={{ color: "#ffd700" }}>Desempate: quem acertou mais placares exatos</span>
      </div>
    </div>
  );
}
