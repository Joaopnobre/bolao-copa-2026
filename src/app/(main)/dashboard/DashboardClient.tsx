"use client";

import Link from "next/link";
import { MatchCard } from "@/components/ui/MatchCard";
import { isSpecialLocked } from "@/lib/lockTime";
import { useRouter } from "next/navigation";

interface Props {
  userName: string;
  isAdmin: boolean;
  upcomingMatches: any[];
  recentMatches: any[];
  userPredictions: any[];
  stats: {
    totalMatches: number;
    finishedMatches: number;
    totalParticipants: number;
    userPredictionCount: number;
    totalPoints: number;
    myRank: number;
    totalPlayers: number;
  };
  firstMatchDate: string | null;
}

export function DashboardClient({
  userName,
  isAdmin,
  upcomingMatches,
  recentMatches,
  userPredictions,
  stats,
  firstMatchDate,
}: Props) {
  const router = useRouter();
  const specialLocked = isSpecialLocked(firstMatchDate ? new Date(firstMatchDate) : null);

  const predMap = new Map(userPredictions.map((p) => [p.matchId, p]));

  return (
    <div style={{ animation: "slide-up 0.4s ease-out" }}>
      {/* Welcome header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
              Olá, <span style={{ background: "linear-gradient(135deg, #f5a623, #ffd700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{userName}</span>! 👋
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "4px 0 0" }}>
              Bolão Copa do Mundo 2026 — Fase de Grupos em andamento
            </p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
        <StatCard
          icon="🎯"
          label="Seus Palpites"
          value={stats.userPredictionCount.toString()}
          sub={`de ${stats.totalMatches} jogos`}
          color="#3b82f6"
        />
        <StatCard
          icon="⭐"
          label="Seus Pontos"
          value={stats.totalPoints.toFixed(1)}
          sub="pontos totais"
          color="#f5a623"
          highlight
        />
        <StatCard
          icon="🏆"
          label="Sua Posição"
          value={stats.myRank > 0 ? `#${stats.myRank}` : "–"}
          sub={`de ${stats.totalPlayers} jogadores`}
          color={stats.myRank === 1 ? "#ffd700" : stats.myRank <= 3 ? "#00d4aa" : "#8b5cf6"}
        />
        <StatCard
          icon="⚽"
          label="Jogos Concluídos"
          value={stats.finishedMatches.toString()}
          sub={`de ${stats.totalMatches} jogos`}
          color="#00d4aa"
        />
      </div>

      {/* Special prediction alert */}
      {!specialLocked && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(245,166,35,0.1), rgba(255,215,0,0.05))",
            border: "1px solid rgba(245,166,35,0.3)",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: "#f5a623", marginBottom: 4 }}>
              👑 Palpite de Campeão e Artilheiro ainda abertos!
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Registre agora antes do início da Copa — bloqueiam 1h antes do jogo de abertura
            </div>
          </div>
          <Link
            href="/champion"
            style={{
              background: "linear-gradient(135deg, #f5a623, #c4831a)",
              color: "#0a0e1a",
              padding: "8px 16px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            Palpitar agora →
          </Link>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
        {/* Quick actions */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
          }}
        >
          <QuickAction href="/predictions" icon="🎯" label="Fazer Palpites" color="#3b82f6" />
          <QuickAction href="/games" icon="⚽" label="Ver Jogos" color="#8b5cf6" />
          <QuickAction href="/ranking" icon="🏆" label="Ranking" color="#f5a623" />
          <QuickAction href="/champion" icon="👑" label="Campeão" color="#00d4aa" />
          {isAdmin && <QuickAction href="/admin" icon="⚙️" label="Admin" color="#ef4444" />}
        </div>

        {/* Upcoming matches */}
        {upcomingMatches.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                ⚡ Próximos Jogos
              </h2>
              <Link href="/games" style={{ fontSize: 12, color: "#60a5fa", textDecoration: "none" }}>
                Ver todos →
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
              {upcomingMatches.slice(0, 6).map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predMap.get(match.id) ?? null}
                  showPrediction
                  onClick={() => router.push(`/predictions/${match.id}`)}
                  compact
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent results */}
        {recentMatches.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                ✅ Resultados Recentes
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
              {recentMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predMap.get(match.id) ?? null}
                  showPrediction
                  compact
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  highlight,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: highlight
          ? `linear-gradient(135deg, rgba(245,166,35,0.12), rgba(255,215,0,0.05))`
          : "var(--bg-card)",
        border: `1px solid ${highlight ? "rgba(245,166,35,0.3)" : "var(--border-color)"}`,
        borderRadius: 12,
        padding: "16px",
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{sub}</div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  color,
}: {
  href: string;
  icon: string;
  label: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "16px 8px",
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: 12,
        textDecoration: "none",
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = color;
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)";
        (e.currentTarget as HTMLElement).style.transform = "";
      }}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{label}</span>
    </Link>
  );
}
