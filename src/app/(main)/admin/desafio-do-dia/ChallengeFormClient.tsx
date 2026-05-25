"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Hint } from "@/lib/daily-challenge";

const CATEGORIES = [
  { value: "PLAYER", label: "Jogador" },
  { value: "TEAM", label: "Seleção" },
  { value: "STADIUM", label: "Estádio" },
  { value: "HISTORIC_MATCH", label: "Partida Histórica" },
  { value: "YEAR", label: "Ano" },
];

const EMPTY_HINTS: Hint[] = Array(10).fill(null).map(() => ({ text: "", type: "NORMAL" as const }));

interface Props { challenge?: any }

export function ChallengeFormClient({ challenge }: Props) {
  const router = useRouter();
  const isEdit = !!challenge;

  const parseOrDefault = (json: string, fallback: any) => {
    try { return JSON.parse(json); } catch { return fallback; }
  };

  const [category, setCategory] = useState(challenge?.category ?? "PLAYER");
  const [answer, setAnswer] = useState(challenge?.answer ?? "");
  const [aliases, setAliases] = useState<string[]>(parseOrDefault(challenge?.aliases ?? "[]", []));
  const [hints, setHints] = useState<Hint[]>(
    challenge ? parseOrDefault(challenge.hints, EMPTY_HINTS) : EMPTY_HINTS
  );
  const [publishDate, setPublishDate] = useState(
    challenge ? new Date(challenge.publishDate).toISOString().split("T")[0] : ""
  );
  const [status, setStatus] = useState(challenge?.status ?? "DRAFT");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function updateHint(i: number, field: "text" | "type", value: string) {
    setHints((prev) => prev.map((h, idx) => idx === i ? { ...h, [field]: value } : h));
  }

  function addAlias() { setAliases((prev) => [...prev, ""]); }
  function updateAlias(i: number, val: string) {
    setAliases((prev) => prev.map((a, idx) => idx === i ? val : a));
  }
  function removeAlias(i: number) {
    setAliases((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (!answer.trim() || !publishDate) {
      setFeedback({ type: "error", msg: "Preencha resposta e data." });
      return;
    }
    const emptyHints = hints.filter((h) => !h.text.trim());
    if (emptyHints.length > 0) {
      setFeedback({ type: "error", msg: "Todas as 10 dicas devem ser preenchidas." });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const body = {
        category,
        answer: answer.trim(),
        aliases: JSON.stringify(aliases.filter((a) => a.trim())),
        hints: JSON.stringify(hints),
        publishDate,
        status,
      };
      const res = await fetch(
        isEdit ? `/api/admin/daily-challenge/${challenge.id}` : "/api/admin/daily-challenge",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setFeedback({ type: "success", msg: isEdit ? "Desafio atualizado!" : "Desafio criado!" });
      setTimeout(() => router.push("/admin/desafio-do-dia"), 1000);
    } catch (e: any) {
      setFeedback({ type: "error", msg: e.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!challenge || !confirm("Excluir este desafio?")) return;
    try {
      await fetch(`/api/admin/daily-challenge/${challenge.id}`, { method: "DELETE" });
      router.push("/admin/desafio-do-dia");
    } catch {
      setFeedback({ type: "error", msg: "Erro ao excluir." });
    }
  }

  const loseTurnCount = hints.filter((h) => h.type === "LOSE_TURN").length;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <button onClick={() => router.back()} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer", marginBottom: 20, padding: 0 }}>
        ← Voltar
      </button>
      <PageHeader title={isEdit ? "Editar Desafio" : "Novo Desafio"} icon="🎯" />

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Basic info */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>Informações Básicas</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>Categoria</label>
              <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>Data de Publicação</label>
              <input className="input-field" type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>Resposta Correta *</label>
              <input className="input-field" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Ex: Ronaldo Nazário" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>Status</label>
              <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="DRAFT">Rascunho</option>
                <option value="PUBLISHED">Publicado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Aliases */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Respostas Alternativas (Aliases)</div>
            <button onClick={addAlias} className="btn-primary" style={{ padding: "6px 14px", fontSize: 12 }}>+ Adicionar</button>
          </div>
          {aliases.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Nenhum alias. Clique em "+ Adicionar" para incluir formas alternativas de resposta.</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {aliases.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 8 }}>
                <input className="input-field" value={a} onChange={(e) => updateAlias(i, e.target.value)} placeholder={`Ex: Ronaldo, R9...`} style={{ flex: 1 }} />
                <button onClick={() => removeAlias(i)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: 8, padding: "0 14px", cursor: "pointer" }}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* Hints */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Dicas (exatamente 10)</div>
            <span style={{ fontSize: 12, color: loseTurnCount > 0 ? "#f87171" : "var(--text-secondary)" }}>
              {loseTurnCount > 0 ? `⚠️ ${loseTurnCount} "Gaste um palpite"` : "Nenhum especial"}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>
            Dica 1 = mais difícil → Dica 10 = mais fácil. Começa com poucas reveladase vai facilitando.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {hints.map((hint, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: hint.type === "LOSE_TURN" ? "rgba(239,68,68,0.2)" : "rgba(249,194,0,0.15)",
                  color: hint.type === "LOSE_TURN" ? "#f87171" : "#F9C200",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800,
                }}>
                  {i + 1}
                </span>
                <input
                  className="input-field"
                  value={hint.text}
                  onChange={(e) => updateHint(i, "text", e.target.value)}
                  placeholder={`Dica ${i + 1}...`}
                  style={{ flex: 1 }}
                />
                <select
                  className="input-field"
                  value={hint.type}
                  onChange={(e) => updateHint(i, "type", e.target.value)}
                  style={{ width: 150 }}
                >
                  <option value="NORMAL">Normal</option>
                  <option value="LOSE_TURN">⚠️ Gaste um palpite</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {feedback && (
          <div className={feedback.type === "success" ? "alert-success" : "alert-error"} style={{ textAlign: "center" }}>
            {feedback.msg}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSave} disabled={loading} className="btn-primary" style={{ flex: 1, justifyContent: "center", padding: 14, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Salvando..." : isEdit ? "💾 Salvar Alterações" : "✅ Criar Desafio"}
          </button>
          {isEdit && (
            <button onClick={handleDelete} className="btn-primary btn-danger" style={{ padding: "14px 18px" }}>
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
