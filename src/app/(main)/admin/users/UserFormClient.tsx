"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props { user?: any }

export function UserFormClient({ user }: Props) {
  const router = useRouter();
  const isEdit = !!user;

  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user?.role ?? "PARTICIPANT");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function handleSave() {
    if (!name.trim() || !username.trim() || !email.trim()) {
      setFeedback({ type: "error", msg: "Preencha nome, username e email." });
      return;
    }
    if (!isEdit && !password.trim()) {
      setFeedback({ type: "error", msg: "Senha obrigatória para novo usuário." });
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const body: any = { name: name.trim(), username: username.trim(), email: email.trim(), role, isActive };
      if (password.trim()) body.password = password.trim();

      const res = await fetch(isEdit ? `/api/users/${user.id}` : "/api/users", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setFeedback({ type: "success", msg: isEdit ? "Usuário atualizado!" : "Usuário criado!" });
      setTimeout(() => router.push("/admin/users"), 1000);
    } catch (e: any) {
      setFeedback({ type: "error", msg: e.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!user || !confirm(`Excluir usuário ${user.name}? Todos os dados serão perdidos.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      router.push("/admin/users");
    } catch (e: any) {
      setFeedback({ type: "error", msg: e.message });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <button onClick={() => router.back()} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer", marginBottom: 20, padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
        ← Voltar
      </button>

      <PageHeader title={isEdit ? "Editar Usuário" : "Novo Usuário"} icon="👤" />

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, padding: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Nome Completo *</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do participante" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Username *</label>
              <input className="input-field" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, "_"))} placeholder="fulano" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>E-mail *</label>
              <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {isEdit ? "Nova Senha (deixe vazio para manter)" : "Senha *"}
            </label>
            <input className="input-field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isEdit ? "••••••• (opcional)" : "•••••••"} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Tipo</label>
              <select className="input-field" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="PARTICIPANT">Participante</option>
                <option value="VIEWER">Visualizador (só leitura)</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</label>
              <select className="input-field" value={isActive ? "true" : "false"} onChange={(e) => setIsActive(e.target.value === "true")}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>

          {feedback && (
            <div className={feedback.type === "success" ? "alert-success" : "alert-error"} style={{ textAlign: "center" }}>
              {feedback.msg}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleSave} disabled={loading} className="btn-primary" style={{ flex: 1, justifyContent: "center", padding: 12, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Salvando..." : isEdit ? "💾 Salvar Alterações" : "➕ Criar Usuário"}
            </button>
            {isEdit && (
              <button onClick={handleDelete} disabled={deleting} className="btn-primary btn-danger" style={{ padding: "12px 16px", opacity: deleting ? 0.7 : 1 }}>
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
