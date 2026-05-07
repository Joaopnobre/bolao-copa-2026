"use client";

import { isMatchLocked, getLockTime } from "@/lib/lockTime";

interface MatchCardProps {
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    matchDate: string | Date;
    phase: string;
    groupName?: string | null;
    round?: number | null;
    homeScore?: number | null;
    awayScore?: number | null;
    status: string;
  };
  prediction?: { homeScore: number; awayScore: number } | null;
  points?: number | null;
  pointType?: "exact" | "winner" | "none" | null;
  showPrediction?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

const PHASE_LABELS: Record<string, string> = {
  GROUP: "Fase de Grupos",
  ROUND_OF_16: "16 Avos",
  QUARTER_FINAL: "Quartas",
  SEMI_FINAL: "Semifinal",
  THIRD_PLACE: "3º Lugar",
  FINAL: "Final",
};

export function MatchCard({
  match,
  prediction,
  points,
  pointType,
  showPrediction = true,
  onClick,
  compact = false,
}: MatchCardProps) {
  const matchDate = new Date(match.matchDate);
  const locked = isMatchLocked(matchDate);
  const lockTime = getLockTime(matchDate);
  const finished = match.status === "FINISHED";
  const hasResult = match.homeScore !== null && match.homeScore !== undefined;

  const dateStr = matchDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    weekday: "short",
  });
  const timeStr = matchDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const borderColor = finished
    ? "rgba(0,212,170,0.4)"
    : locked
    ? "rgba(245,166,35,0.4)"
    : "var(--border-color)";

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        padding: compact ? "12px 16px" : "16px",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Phase & status header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#8b5cf6",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {match.groupName ? `Grupo ${match.groupName}` : PHASE_LABELS[match.phase] ?? match.phase}
            {match.round ? ` · R${match.round}` : ""}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {finished && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: "rgba(0,212,170,0.15)",
                color: "#00d4aa",
                padding: "2px 8px",
                borderRadius: 999,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Finalizado
            </span>
          )}
          {!finished && locked && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: "rgba(245,166,35,0.15)",
                color: "#f5a623",
                padding: "2px 8px",
                borderRadius: 999,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              🔒 Bloqueado
            </span>
          )}
          {!finished && !locked && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: "rgba(59,130,246,0.15)",
                color: "#60a5fa",
                padding: "2px 8px",
                borderRadius: 999,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Aberto
            </span>
          )}
        </div>
      </div>

      {/* Teams and score */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 12,
          marginBottom: 10,
        }}
      >
        {/* Home team */}
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: compact ? 14 : 16,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 2,
            }}
          >
            {match.homeTeam}
          </div>
        </div>

        {/* Score / VS */}
        <div style={{ textAlign: "center" }}>
          {hasResult ? (
            <div
              style={{
                display: "flex",
                gap: 4,
                alignItems: "center",
                background: "var(--bg-secondary)",
                borderRadius: 8,
                padding: "4px 12px",
                border: "1px solid var(--border-highlight)",
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 800, color: "#00d4aa" }}>
                {match.homeScore}
              </span>
              <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>–</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#00d4aa" }}>
                {match.awayScore}
              </span>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>
                {dateStr}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-secondary)" }}>
                {timeStr}
              </div>
            </div>
          )}
        </div>

        {/* Away team */}
        <div style={{ textAlign: "left" }}>
          <div
            style={{
              fontSize: compact ? 14 : 16,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 2,
            }}
          >
            {match.awayTeam}
          </div>
        </div>
      </div>

      {/* Palpite e pontos */}
      {showPrediction && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {prediction ? (
              <span>
                Palpite:{" "}
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                  {prediction.homeScore} – {prediction.awayScore}
                </span>
              </span>
            ) : locked ? (
              <span style={{ color: "#6b7280" }}>Sem palpite</span>
            ) : (
              <span style={{ color: "#60a5fa" }}>Clique para palpitar</span>
            )}
          </div>
          {points !== null && points !== undefined && (
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color:
                  pointType === "exact"
                    ? "#ffd700"
                    : pointType === "winner"
                    ? "#00d4aa"
                    : "#6b7280",
              }}
            >
              {points > 0
                ? `+${points.toFixed(1)} pts`
                : "0 pts"}
            </div>
          )}
        </div>
      )}

      {/* Lock countdown */}
      {!locked && !finished && (
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: "var(--text-secondary)",
            textAlign: "center",
          }}
        >
          🔒 Bloqueia às {lockTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} de{" "}
          {lockTime.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
        </div>
      )}
    </div>
  );
}
