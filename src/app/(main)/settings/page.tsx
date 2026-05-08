"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/ui/PageHeader";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [current, setCurrent]   = useState("");
  const [newPass, setNewPass]   = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPass !== confirm) {
      setFeedback({ type: "error", msg: "As senhas não coincidem." });
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFeedback({ type: "success", msg: "Senha alterada com sucesso!" });
      setCurrent(""); setNewPass(""); setConfirm("");
    } catch (e: any) {
      setFeedback({ type: "error", msg: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <PageHeader title="Configurações" subtitle="Altere sua senha de acesso" icon="⚙️" />

      {/* User info card */}
      <div style={{
        background: "var(--bg-card)",
        border: "1.5px solid var(--border-color)",
        borderRadius: 14,
        padding: "20px 24px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--verde), var(--azul))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 800, color: "white", flexShrink: 0,
        }}>
          {session?.user.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
            {session?.user.name}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            @{session?.user.username}
          </div>
          {session?.user.role === "ADMIN" && (
            <span style={{ fontSize: 11, fontWeight: 700, background: "var(--verde-bg)", color: "var(--verde-escuro)", padding: "2px 8px", borderRadius: 999 }}>
              ADMIN
            </span>
          )}
        </div>
      </div>

      {/* Password form */}
      <div style={{
        background: "var(--bg-card)",
        border: "1.5px solid var(--border-color)",
        borderRadius: 14,
        padding: 24,
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 20px" }}>
          🔒 Alterar Senha
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Senha Atual
            </label>
            <input
              className="input-field"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Nova Senha
            </label>
            <input
              className="input-field"
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Confirmar Nova Senha
            </label>
            <input
              className="input-field"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repita a nova senha"
              required
            />
          </div>

          {feedback && (
            <div className={feedback.type === "success" ? "alert-success" : "alert-error"} style={{ textAlign: "center" }}>
              {feedback.msg}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ justifyContent: "center", padding: 12, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Salvando..." : "💾 Salvar Nova Senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
