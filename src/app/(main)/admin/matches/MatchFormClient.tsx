"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";

const PHASES = [
  { value: "GROUP", label: "Fase de Grupos" },
  { value: "ROUND_OF_16", label: "16 Avos" },
  { value: "QUARTER_FINAL", label: "Quartas de Final" },
  { value: "SEMI_FINAL", label: "Semifinal" },
  { value: "THIRD_PLACE", label: "3º Lugar" },
  { value: "FINAL", label: "Final" },
];

interface Props { match?: any }

export function MatchFormClient({ match }: Props) {
  const router = useRouter();
  const isEdit = !!match;

  const [homeTeam, setHomeTeam] = useState(match?.homeTeam ?? "");
  const [awayTeam, setAwayTeam] = useState(match?.awayTeam ?? "");
  const [matchDate, setMatchDate] = useState(
    match?.matchDate ? new Date(match.matchDate).toISOString().slice(0, 16) : ""
  );
  const [phase, setPhase] = useState(match?.phase ?? "GROUP");
  const [groupName, setGroupName] = useState(match?.groupName ?? "");
  const [round, setRound] = useState(match?.round?.toString() ?? "");
  const [sortOrder, setSortOrder] = useState(match?.sortOrder?.toString() ?? "0");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function handleSave() {
    if (!homeTeam.trim() || !awayTeam.trim() || !matchDate) {
      setFeedback({ type: "error", msg: "Preencha todos os campos obrigatórios." });
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const body = {
        homeTeam: homeTeam.trim(),
        awayTeam: awayTeam.trim(),
        matchDate: new Date(matchDate).toISOString(),
        phase,
        groupName: phase === "GROUP" ? groupName.trim() : null,
        round: round ? parseInt(round) : null,
        sortOrder: parseInt(sortOrder) || 0,
      };
      const res = await fetch(isEdit ? `/api/matches/${match.id}` : "/api/matches", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setFeedback({ type: "success", msg: isEdit ? "Jogo atualizado!" : "Jogo criado!" });
      setTimeout(() => router.push("/admin/matches"), 1000);
    } catch (e: any) {
      setFeedback({ type: "error", msg: e.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!match || !confirm("Excluir este jogo? Todos os palpites serão perdidos.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/matches/${match.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      router.push("/admin/matches");
    } catch (e: any) {
      setFeedback({ type: "error", msg: e.message });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <button onClick={() => router.back()} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer", marginBottom: 20, padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
        ← Voltar
      </button>

      <PageHeader title={isEdit ? "Editar Jogo" : "Novo Jogo"} icon="⚽" />

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, padding: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Time Mandante *
              </label>
              <input className="input-field" value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} placeholder="Ex: Brasil" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Time Visitante *
              </label>
              <input className="input-field" value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} placeholder="Ex: Argentina" />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Data e Hora *
            </label>
            <input className="input-field" type="datetime-local" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Fase
              </label>
              <select className="input-field" value={phase} onChange={(e) => setPhase(e.target.value)}>
                {PHASES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            {phase === "GROUP" && (
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Grupo
                </label>
                <input className="input-field" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="A, B, C..." maxLength={2} />
              </div>
            )}
          </div>

          {phase === "GROUP" && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Rodada
              </label>
              <input className="input-field" type="number" value={round} onChange={(e) => setRound(e.target.value)} placeholder="1, 2 ou 3" min={1} max={3} style={{ width: 120 }} />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Ordem de exibição
            </label>
            <input className="input-field" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ width: 120 }} />
          </div>

          {feedback && (
            <div className={feedback.type === "success" ? "alert-success" : "alert-error"} style={{ textAlign: "center" }}>
              {feedback.msg}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleSave} disabled={loading} className="btn-primary" style={{ flex: 1, justifyContent: "center", padding: 12, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Salvando..." : isEdit ? "💾 Salvar Alterações" : "➕ Criar Jogo"}
            </button>
            {isEdit && (
              <button onClick={handleDelete} disabled={deleting} className="btn-primary btn-danger" style={{ padding: "12px 16px", opacity: deleting ? 0.7 : 1 }}>
                🗑️ Excluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
