"use client";

import { isMatchLocked, getLockTime } from "@/lib/lockTime";

interface Prediction {
  homeScore: number;
  awayScore: number;
}

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
  prediction?: Prediction | null;
  points?: number | null;
  showPrediction?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

const PHASE_LABELS: Record<string, string> = {
  GROUP: "Grupos",
  ROUND_OF_16: "16 Avos",
  QUARTER_FINAL: "Quartas",
  SEMI_FINAL: "Semi",
  THIRD_PLACE: "3º Lugar",
  FINAL: "Final",
};

type PredResult = "exact" | "winner" | "wrong" | null;

function getPredResult(pred: Prediction, match: MatchCardProps["match"]): PredResult {
  if (match.homeScore === null || match.homeScore === undefined) return null;
  if (pred.homeScore === match.homeScore && pred.awayScore === match.awayScore) return "exact";
  const actualW = match.homeScore > match.awayScore! ? "home" : match.awayScore! > match.homeScore ? "away" : "draw";
  const predW   = pred.homeScore  > pred.awayScore   ? "home" : pred.awayScore   > pred.homeScore  ? "away" : "draw";
  return predW === actualW ? "winner" : "wrong";
}

const RESULT_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
  exact:  { bg: "rgba(255,215,0,0.18)",  color: "#ffd700", icon: "🎯" },
  winner: { bg: "rgba(0,212,170,0.15)",  color: "#00d4aa", icon: "✅" },
  wrong:  { bg: "rgba(239,68,68,0.12)",  color: "#f87171", icon: "❌" },
};

export function MatchCard({
  match,
  prediction,
  points,
  showPrediction = true,
  onClick,
  compact = false,
}: MatchCardProps) {
  const matchDate  = new Date(match.matchDate);
  const locked     = isMatchLocked(matchDate);
  const lockTime   = getLockTime(matchDate);
  const finished   = match.status === "FINISHED";
  const hasResult  = match.homeScore !== null && match.homeScore !== undefined;

  const predResult = prediction && hasResult ? getPredResult(prediction, match) : null;

  const borderColor = finished ? "rgba(0,212,170,0.35)"
    : locked           ? "rgba(245,166,35,0.35)"
    :                    "var(--border-color)";

  const dateStr = matchDate.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
  const timeStr = matchDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${borderColor}`,
        borderRadius: 14,
        padding: compact ? "12px 14px" : "16px",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
        userSelect: "none",
      }}
      onMouseEnter={onClick ? (e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "";
      } : undefined}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#8b5cf6", textTransform: "uppercase", letterSpacing: 0.5 }}>
          {match.groupName ? `Grupo ${match.groupName}` : PHASE_LABELS[match.phase] ?? match.phase}
          {match.round ? ` · R${match.round}` : ""}
        </span>
        <StatusBadge finished={finished} locked={locked} />
      </div>

      {/* Main: teams + score/time */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 10 }}>
        <TeamSide
          team={match.homeTeam}
          align="right"
          predScore={showPrediction && prediction ? prediction.homeScore : undefined}
          predResult={predResult}
          compact={compact}
        />

        {/* Center */}
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          {hasResult ? (
            <div style={{
              background: "var(--bg-secondary)",
              border: "2px solid rgba(0,212,170,0.4)",
              borderRadius: 10,
              padding: "6px 14px",
              display: "inline-flex",
              gap: 6,
              alignItems: "center",
            }}>
              <span style={{ fontSize: compact ? 20 : 24, fontWeight: 900, color: "#00d4aa", lineHeight: 1 }}>
                {match.homeScore}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>–</span>
              <span style={{ fontSize: compact ? 20 : 24, fontWeight: 900, color: "#00d4aa", lineHeight: 1 }}>
                {match.awayScore}
              </span>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600 }}>{dateStr}</div>
              <div style={{ fontSize: compact ? 14 : 16, fontWeight: 800, color: "var(--text-secondary)", lineHeight: 1.2 }}>
                {timeStr}
              </div>
            </div>
          )}
        </div>

        <TeamSide
          team={match.awayTeam}
          align="left"
          predScore={showPrediction && prediction ? prediction.awayScore : undefined}
          predResult={predResult}
          compact={compact}
        />
      </div>

      {/* Footer */}
      {showPrediction && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--border-color)" }}>
          {prediction ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                Seu palpite:{" "}
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                  {prediction.homeScore} – {prediction.awayScore}
                </span>
              </div>
              {points !== null && points !== undefined && (
                <span style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: predResult === "exact" ? "#ffd700" : predResult === "winner" ? "#00d4aa" : "var(--text-secondary)",
                }}>
                  {points > 0 ? `+${points.toFixed(1)} pts` : "0 pts"}
                </span>
              )}
            </div>
          ) : !locked && !finished ? (
            <div style={{ textAlign: "center", fontSize: 12, color: "#60a5fa", fontWeight: 600 }}>
              Toque para palpitar →
            </div>
          ) : (
            <div style={{ textAlign: "center", fontSize: 12, color: "#6b7280" }}>Sem palpite</div>
          )}
        </div>
      )}

      {/* Lock countdown */}
      {!locked && !finished && (
        <div style={{ marginTop: 6, fontSize: 10, color: "var(--text-secondary)", textAlign: "center" }}>
          🔒 {lockTime.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} às {lockTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ finished, locked }: { finished: boolean; locked: boolean }) {
  if (finished) return (
    <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(0,212,170,0.15)", color: "#00d4aa", padding: "2px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: 0.5 }}>
      Finalizado
    </span>
  );
  if (locked) return (
    <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(245,166,35,0.15)", color: "#f5a623", padding: "2px 8px", borderRadius: 999 }}>
      🔒 Bloqueado
    </span>
  );
  return (
    <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(59,130,246,0.15)", color: "#60a5fa", padding: "2px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: 0.5 }}>
      Aberto
    </span>
  );
}

function TeamSide({
  team, align, predScore, predResult, compact,
}: {
  team: string;
  align: "left" | "right";
  predScore?: number;
  predResult: PredResult;
  compact: boolean;
}) {
  const isRight = align === "right";
  const style   = predResult ? RESULT_STYLE[predResult] : null;

  return (
    <div style={{
      textAlign: align,
      display: "flex",
      flexDirection: "column",
      gap: 5,
      alignItems: isRight ? "flex-end" : "flex-start",
    }}>
      {/* Team name */}
      <span style={{
        fontSize: compact ? 13 : 15,
        fontWeight: 700,
        color: "var(--text-primary)",
        lineHeight: 1.2,
        wordBreak: "break-word",
      }}>
        {team}
      </span>

      {/* Prediction score bubble */}
      {predScore !== undefined && (
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          background: style ? style.bg : "rgba(59,130,246,0.15)",
          border: `1.5px solid ${style ? style.color : "rgba(59,130,246,0.4)"}`,
          color: style ? style.color : "#60a5fa",
          borderRadius: 8,
          padding: "3px 12px",
          fontSize: compact ? 16 : 20,
          fontWeight: 900,
          minWidth: 40,
          lineHeight: 1,
        }}>
          {predScore}
          {style && <span style={{ fontSize: 13 }}>{style.icon}</span>}
        </div>
      )}
    </div>
  );
}
