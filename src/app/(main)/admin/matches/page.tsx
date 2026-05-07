import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

const PHASE_LABELS: Record<string, string> = {
  GROUP: "Fase de Grupos",
  ROUND_OF_16: "16 Avos",
  QUARTER_FINAL: "Quartas",
  SEMI_FINAL: "Semifinal",
  THIRD_PLACE: "3º Lugar",
  FINAL: "Final",
};

export default async function AdminMatchesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const matches = await prisma.match.findMany({
    orderBy: [{ sortOrder: "asc" }, { matchDate: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Jogos"
        subtitle="Gerenciar todos os jogos"
        icon="⚽"
        action={
          <Link href="/admin/matches/new" className="btn-primary" style={{ textDecoration: "none", padding: "8px 16px", borderRadius: 8, background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", fontWeight: 600, fontSize: 13 }}>
            ➕ Novo Jogo
          </Link>
        }
      />

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 100px 80px 100px", padding: "10px 16px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, gap: 8 }}>
          <span>Casa</span>
          <span>Visitante</span>
          <span>Data / Hora</span>
          <span>Fase</span>
          <span>Resultado</span>
          <span style={{ textAlign: "right" }}>Status / Ação</span>
        </div>

        {matches.map((match) => (
          <div
            key={match.id}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 100px 80px 100px", padding: "10px 16px", borderBottom: "1px solid var(--border-color)", fontSize: 13, gap: 8, alignItems: "center" }}
          >
            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{match.homeTeam}</div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{match.awayTeam}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>
              {new Date(match.matchDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
              {" "}
              {new Date(match.matchDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div style={{ fontSize: 11, color: "#8b5cf6" }}>
              {match.groupName ? `Grupo ${match.groupName}` : PHASE_LABELS[match.phase]}
            </div>
            <div style={{ fontWeight: 700, color: match.homeScore !== null ? "#00d4aa" : "var(--text-secondary)" }}>
              {match.homeScore !== null ? `${match.homeScore}–${match.awayScore}` : "–"}
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <span
                style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                  background: match.status === "FINISHED" ? "rgba(0,212,170,0.15)" : match.status === "LOCKED" ? "rgba(245,166,35,0.15)" : "rgba(59,130,246,0.15)",
                  color: match.status === "FINISHED" ? "#00d4aa" : match.status === "LOCKED" ? "#f5a623" : "#60a5fa",
                }}
              >
                {match.status}
              </span>
              <Link
                href={`/admin/matches/${match.id}`}
                style={{ fontSize: 12, color: "#60a5fa", textDecoration: "none", padding: "2px 8px", background: "rgba(59,130,246,0.1)", borderRadius: 6 }}
              >
                ✏️
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
