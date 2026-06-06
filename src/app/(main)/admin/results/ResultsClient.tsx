"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  matches: any[];
  officialChampion: string;
  officialScorer: string;
}

export function ResultsClient({ matches, officialChampion, officialScorer }: Props) {
  const router = useRouter();
  const [results, setResults] = useState<Record<string, { home: string; away: string }>>({});
  const [champion, setChampion] = useState(officialChampion);
  const [scorer, setScorer] = useState(officialScorer);
  const [saving, setSaving] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [groupFilter, setGroupFilter] = useState<string>("ALL");
  const [dateSort, setDateSort] = useState<"asc" | "desc">("asc");

  async function saveResult(matchId: string) {
    const r = results[matchId];
    if (!r || r.home === "" || r.away === "") {
      setFeedback((f) => ({ ...f, [matchId]: "Preencha o placar." }));
      return;
    }
    setSaving(matchId);
    try {
      const res = await fetch(`/api/admin/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          homeScore: parseInt(r.home),
          awayScore: parseInt(r.away),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setFeedback((f) => ({ ...f, [matchId]: "✅ Resultado salvo!" }));
      setTimeout(() => router.refresh(), 800);
    } catch (e: any) {
      setFeedback((f) => ({ ...f, [matchId]: `❌ ${e.message}` }));
    } finally {
      setSaving(null);
    }
  }

  async function saveSpecial() {
    setSaving("special");
    try {
      await fetch("/api/admin/results", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ champion: champion.trim(), topScorer: scorer.trim() }),
      });
      setFeedback((f) => ({ ...f, special: "✅ Salvo!" }));
      setTimeout(() => router.refresh(), 800);
    } catch {
      setFeedback((f) => ({ ...f, special: "❌ Erro ao salvar" }));
    } finally {
      setSaving(null);
    }
  }

  const groups = [...new Set(matches.filter((m) => m.groupName).map((m) => m.groupName as string))].sort();

  const applyFilters = (list: any[]) => {
    const f = groupFilter === "ALL" ? list : list.filter((m) => m.groupName === groupFilter);
    return [...f].sort((a, b) => {
      const d = new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
      return dateSort === "asc" ? d : -d;
    });
  };

  const lockedMatches = applyFilters(matches.filter((m) => m.status === "LOCKED"));
  const upcomingMatches = applyFilters(matches.filter((m) => m.status === "UPCOMING"));

  return (
    <div>
      <PageHeader title="Inserir Resultados" subtitle="Atualizar placares e resultados especiais" icon="📝" />

      {/* Special results */}
      <div style={{ background: "var(--bg-card)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#f5a623", margin: "0 0 16px" }}>👑 Resultados Especiais</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Campeão da Copa
            </label>
            <input className="input-field" value={champion} onChange={(e) => setChampion(e.target.value)} placeholder="Ex: Brasil" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Artilheiro da Copa
            </label>
            <input className="input-field" value={scorer} onChange={(e) => setScorer(e.target.value)} placeholder="Ex: Lionel Messi" />
          </div>
        </div>
        {feedback["special"] && (
          <div style={{ fontSize: 13, color: feedback["special"].startsWith("✅") ? "#00d4aa" : "#ef4444", marginBottom: 8 }}>
            {feedback["special"]}
          </div>
        )}
        <button onClick={saveSpecial} disabled={saving === "special"} className="btn-primary btn-gold" style={{ padding: "10px 20px", opacity: saving === "special" ? 0.7 : 1 }}>
          {saving === "special" ? "Salvando..." : "💾 Salvar Especiais"}
        </button>
      </div>

      {/* Group + date filters */}
      {groups.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
          <AdminPillBtn active={groupFilter === "ALL"} onClick={() => setGroupFilter("ALL")}>Todos Grupos</AdminPillBtn>
          {groups.map((g) => (
            <AdminPillBtn key={g} active={groupFilter === g} onClick={() => setGroupFilter(g)}>Grupo {g}</AdminPillBtn>
          ))}
          <div style={{ width: 1, background: "var(--border-color)", height: 20, margin: "0 4px" }} />
          <AdminPillBtn active={dateSort === "asc"} onClick={() => setDateSort(dateSort === "asc" ? "desc" : "asc")}>
            {dateSort === "asc" ? "Data ↑" : "Data ↓"}
          </AdminPillBtn>
        </div>
      )}

      {/* Locked matches */}
      {lockedMatches.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#f5a623", marginBottom: 12 }}>⏳ Jogos Bloqueados ({lockedMatches.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lockedMatches.map((match) => (
              <MatchResultRow
                key={match.id}
                match={match}
                value={results[match.id] ?? { home: "", away: "" }}
                onChange={(v) => setResults((r) => ({ ...r, [match.id]: v }))}
                onSave={() => saveResult(match.id)}
                saving={saving === match.id}
                feedback={feedback[match.id] ?? ""}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming matches */}
      {upcomingMatches.length > 0 && (
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>
            ℹ️ Próximos Jogos (ainda não bloqueados)
          </h2>
          <div style={{ opacity: 0.6, display: "flex", flexDirection: "column", gap: 8 }}>
            {upcomingMatches.slice(0, 5).map((match) => (
              <div key={match.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "10px 16px", display: "flex", gap: 12, alignItems: "center", fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{match.homeTeam}</span>
                <span style={{ color: "var(--text-secondary)" }}>×</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{match.awayTeam}</span>
                <span style={{ marginLeft: "auto", color: "var(--text-secondary)", fontSize: 11 }}>
                  {new Date(match.matchDate).toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {lockedMatches.length === 0 && upcomingMatches.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Todos os resultados já foram inseridos!</div>
        </div>
      )}
    </div>
  );
}

function AdminPillBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600,
        cursor: "pointer", transition: "all 0.2s",
        background: active ? "#f5a623" : "var(--bg-card)",
        color: active ? "#000" : "var(--text-secondary)",
        border: active ? "1px solid #f5a623" : "1px solid var(--border-color)",
      }}
    >
      {children}
    </button>
  );
}

function MatchResultRow({
  match, value, onChange, onSave, saving, feedback,
}: {
  match: any;
  value: { home: string; away: string };
  onChange: (v: { home: string; away: string }) => void;
  onSave: () => void;
  saving: boolean;
  feedback: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid rgba(245,166,35,0.3)",
        borderRadius: 12,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
          {match.homeTeam} × {match.awayTeam}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
          {match.groupName ? `Grupo ${match.groupName}` : match.phase} •{" "}
          {new Date(match.matchDate).toLocaleString("pt-BR")}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="number"
          className="score-input"
          value={value.home}
          onChange={(e) => onChange({ ...value, home: e.target.value })}
          placeholder="0"
          min={0}
          style={{ width: 52, height: 44 }}
        />
        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-secondary)" }}>–</span>
        <input
          type="number"
          className="score-input"
          value={value.away}
          onChange={(e) => onChange({ ...value, away: e.target.value })}
          placeholder="0"
          min={0}
          style={{ width: 52, height: 44 }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
        <button
          onClick={onSave}
          disabled={saving}
          className="btn-primary"
          style={{ padding: "8px 16px", fontSize: 13, opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "..." : "✅ Salvar"}
        </button>
        {feedback && (
          <span style={{ fontSize: 12, color: feedback.startsWith("✅") ? "#00d4aa" : "#ef4444" }}>
            {feedback}
          </span>
        )}
      </div>
    </div>
  );
}
