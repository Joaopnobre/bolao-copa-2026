"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PaymentToggle({ userId, hasPaid }: { userId: string; hasPaid: boolean }) {
  const router = useRouter();
  const [paid, setPaid]       = useState(hasPaid);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/payment`, { method: "PATCH" });
      const data = await res.json();
      if (res.ok) {
        setPaid(data.hasPaid);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={paid ? "Marcar como não pago" : "Marcar como pago"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px",
        borderRadius: 999,
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        fontWeight: 700,
        fontSize: 12,
        transition: "all 0.2s",
        opacity: loading ? 0.6 : 1,
        background: paid
          ? "linear-gradient(135deg, #009C3B, #007a2f)"
          : "rgba(148,163,184,0.15)",
        color: paid ? "white" : "#64748b",
        boxShadow: paid ? "0 2px 8px rgba(0,156,59,0.3)" : "none",
      }}
    >
      {loading ? "..." : paid ? "✅ Pago" : "○ Pendente"}
    </button>
  );
}
