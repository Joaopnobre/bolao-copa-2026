"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MatchCard } from "@/components/ui/MatchCard";
import { PageHeader } from "@/components/ui/PageHeader";

const PHASE_LABELS: Record<string, string> = {
  GROUP: "Fase de Grupos",
  ROUND_OF_16: "16 Avos de Final",
  QUARTER_FINAL: "Quartas de Final",
  SEMI_FINAL: "Semifinal",
  THIRD_PLACE: "Disputa 3º Lugar",
  FINAL: "Final",
};

const PHASE_ORDER = ["GROUP", "ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL"];

interface Props {
  matches: any[];
  userPredictions: any[];
  isAdmin: boolean;
}

export function GamesClient({ matches, userPredictions, isAdmin }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("ALL");
  const [groupFilter, setGroupFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateSort, setDateSort] = useState<"asc" | "desc">("asc");

  const predMap = new Map(userPredictions.map((p) => [p.matchId, p]));

  const groups = [...new Set(matches.filter((m) => m.groupName).map((m) => m.groupName))].sort();
  const phases = [...new Set(matches.map((m) => m.phase))];

  const filtered = matches.filter((m) => {
    if (filter !== "ALL" && m.phase !== filter) return false;
    if (groupFilter !== "ALL" && m.groupName !== groupFilter) return false;
    if (statusFilter !== "ALL" && m.status !== statusFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const d = new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
    return dateSort === "asc" ? d : -d;
  });

  // Group by phase
  const byPhase: Record<string, any[]> = {};
  for (const m of sorted) {
    if (!byPhase[m.phase]) byPhase[m.phase] = [];
    byPhase[m.phase].push(m);
  }

  // Group by group within GROUP phase
  const groupsByName: Record<string, any[]> = {};
  if (byPhase["GROUP"]) {
    for (const m of byPhase["GROUP"]) {
      const g = m.groupName || "?";
      if (!groupsByName[g]) groupsByName[g] = [];
      groupsByName[g].push(m);
    }
  }

  return (
    <div>
      <PageHeader
        title="Jogos"
        subtitle="Todos os jogos da Copa do Mundo 2026"
        icon="⚽"
      />

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <FilterButton active={filter === "ALL"} onClick={() => setFilter("ALL")}>
          Todas Fases
        </FilterButton>
        {PHASE_ORDER.filter((p) => phases.includes(p)).map((phase) => (
          <FilterButton key={phase} active={filter === phase} onClick={() => setFilter(phase)}>
            {PHASE_LABELS[phase]}
          </FilterButton>
        ))}
      </div>

      {/* Group + date filters — always visible */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        {groups.length > 0 && (
          <>
            <FilterButton small active={groupFilter === "ALL"} onClick={() => setGroupFilter("ALL")}>
              Todos Grupos
            </FilterButton>
            {groups.map((g) => (
              <FilterButton key={g} small active={groupFilter === g} onClick={() => setGroupFilter(g as string)}>
                Grupo {g}
              </FilterButton>
            ))}
            <div style={{ width: 1, background: "var(--border-color)", height: 20, margin: "0 4px" }} />
          </>
        )}
        <FilterButton small active={dateSort === "asc"} onClick={() => setDateSort(dateSort === "asc" ? "desc" : "asc")}>
          {dateSort === "asc" ? "Data ↑" : "Data ↓"}
        </FilterButton>
      </div>

      {filter === "GROUP" || filter === "ALL" ? (
        <>
          {filter === "ALL" && (
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              <FilterButton small active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")}>
                Todos
              </FilterButton>
              <FilterButton small active={statusFilter === "UPCOMING"} onClick={() => setStatusFilter("UPCOMING")}>
                Abertos
              </FilterButton>
              <FilterButton small active={statusFilter === "FINISHED"} onClick={() => setStatusFilter("FINISHED")}>
                Finalizados
              </FilterButton>
            </div>
          )}

          {/* Group phase: flat list sorted by date */}
          {filter === "GROUP" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
              {(byPhase["GROUP"] ?? []).map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predMap.get(match.id) ?? null}
                  showPrediction
                  onClick={() => router.push(`/predictions/${match.id}`)}
                />
              ))}
            </div>
          )}

          {/* All phases: flat list sorted by date */}
          {filter === "ALL" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {PHASE_ORDER.filter((p) => byPhase[p]?.length > 0).map((phase) => (
                <div key={phase}>
                  <SectionTitle title={PHASE_LABELS[phase]} count={byPhase[phase].filter((m: any) => statusFilter === "ALL" || m.status === statusFilter).length} phase={phase} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
                    {byPhase[phase].filter((m) => statusFilter === "ALL" || m.status === statusFilter).map((match) => (
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
              ))}
            </div>
          )}
        </>
      ) : (
        /* Single phase view */
        <div>
          <SectionTitle title={PHASE_LABELS[filter]} count={filtered.length} phase={filter} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
            {filtered.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predMap.get(match.id) ?? null}
                showPrediction
                onClick={() => router.push(`/predictions/${match.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterButton({
  children,
  active,
  onClick,
  small,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: small ? "4px 12px" : "6px 16px",
        borderRadius: 999,
        fontSize: small ? 11 : 13,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s",
        background: active ? "#3b82f6" : "var(--bg-card)",
        color: active ? "white" : "var(--text-secondary)",
        border: active ? "1px solid #3b82f6" : "1px solid var(--border-color)",
      }}
    >
      {children}
    </button>
  );
}

function SectionTitle({ title, count, phase }: { title: string; count: number; phase?: string }) {
  const color = phase === "FINAL" ? "#ffd700" : phase === "SEMI_FINAL" ? "#f97316" : phase === "QUARTER_FINAL" ? "#f59e0b" : "#60a5fa";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color, margin: 0 }}>{title}</h2>
      <span style={{ fontSize: 12, color: "var(--text-secondary)", background: "var(--bg-card)", padding: "2px 8px", borderRadius: 999, border: "1px solid var(--border-color)" }}>
        {count} {count === 1 ? "jogo" : "jogos"}
      </span>
    </div>
  );
}
