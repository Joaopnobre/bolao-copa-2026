"use client";

import { useState } from "react";

interface UserPred {
  userId: string;
  name: string;
  username: string;
  topScorer: string | null;
}

interface Props {
  users: UserPred[];
}

export function SpecialPredictionsClient({ users }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(users.map((u) => [u.userId, u.topScorer ?? ""]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; msg: string }>>({});

  async function save(userId: string) {
    const val = values[userId]?.trim();
    if (!val) return;
    setSaving(userId);
    try {
      const res = await fetch("/api/admin/special-predictions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type: "TOP_SCORER", value: val }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setFeedback((f) => ({ ...f, [userId]: { ok: true, msg: "✅ Salvo!" } }));
      setEditing(null);
      setTimeout(() => setFeedback((f) => { const n = { ...f }; delete n[userId]; return n; }), 2500);
    } catch (e: any) {
      setFeedback((f) => ({ ...f, [userId]: { ok: false, msg: `❌ ${e.message}` } }));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {users.map((u) => {
        const isEditing = editing === u.userId;
        const fb = feedback[u.userId];
        return (
          <div
            key={u.userId}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: 12,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: "white",
            }}>
              {u.name[0]?.toUpperCase()}
            </div>

            {/* User info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{u.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>@{u.username}</div>
            </div>

            {/* Value / edit */}
            {isEditing ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 2 }}>
                <input
                  autoFocus
                  className="input-field"
                  value={values[u.userId]}
                  onChange={(e) => setValues((v) => ({ ...v, [u.userId]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") save(u.userId); if (e.key === "Escape") setEditing(null); }}
                  placeholder="Nome do artilheiro..."
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => save(u.userId)}
                  disabled={saving === u.userId || !values[u.userId]?.trim()}
                  className="btn-primary"
                  style={{ padding: "6px 14px", fontSize: 12, opacity: saving === u.userId ? 0.7 : 1 }}
                >
                  {saving === u.userId ? "..." : "Salvar"}
                </button>
                <button
                  onClick={() => { setEditing(null); setValues((v) => ({ ...v, [u.userId]: u.topScorer ?? "" })); }}
                  style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {fb && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: fb.ok ? "#00d4aa" : "#f87171" }}>
                    {fb.msg}
                  </span>
                )}
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: values[u.userId] ? "var(--text-primary)" : "var(--text-secondary)",
                  fontStyle: values[u.userId] ? "normal" : "italic",
                }}>
                  {values[u.userId] || "Sem palpite"}
                </span>
                <button
                  onClick={() => setEditing(u.userId)}
                  style={{
                    background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)",
                    color: "#60a5fa", borderRadius: 8, padding: "4px 12px",
                    cursor: "pointer", fontSize: 12, fontWeight: 600,
                  }}
                >
                  ✏️ Editar
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
