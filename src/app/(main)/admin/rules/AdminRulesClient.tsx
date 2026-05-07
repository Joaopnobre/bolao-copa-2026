"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";

export function AdminRulesClient({ content: initial }: { content: string }) {
  const router = useRouter();
  const [content, setContent] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function handleSave() {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      setFeedback({ type: "success", msg: "Regras atualizadas!" });
      setTimeout(() => router.push("/rules"), 1000);
    } catch (e: any) {
      setFeedback({ type: "error", msg: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <button onClick={() => router.back()} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer", marginBottom: 20, padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
        ← Voltar
      </button>

      <PageHeader title="Editar Regras" subtitle="Use Markdown para formatar o conteúdo" icon="📋" />

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, padding: 20 }}>
        <div style={{ marginBottom: 12, fontSize: 12, color: "var(--text-secondary)" }}>
          Suporte básico a Markdown: # Título, ## Subtítulo, - Lista, **negrito**, | Tabela |
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: "100%",
            minHeight: 500,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            color: "var(--text-primary)",
            borderRadius: 8,
            padding: 16,
            fontSize: 13,
            fontFamily: "monospace",
            resize: "vertical",
            outline: "none",
            lineHeight: 1.6,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; }}
        />
        {feedback && (
          <div className={feedback.type === "success" ? "alert-success" : "alert-error"} style={{ marginTop: 12, textAlign: "center" }}>
            {feedback.msg}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary"
          style={{ marginTop: 12, width: "100%", justifyContent: "center", padding: 12, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Salvando..." : "💾 Salvar Regras"}
        </button>
      </div>
    </div>
  );
}
