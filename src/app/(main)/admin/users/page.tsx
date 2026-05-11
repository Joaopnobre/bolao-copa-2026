import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { PaymentToggle } from "@/components/ui/PaymentToggle";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  const paidCount = users.filter(
    (u) => u.isActive && u.role === "PARTICIPANT" && u.hasPaid
  ).length;
  const totalParticipants = users.filter(
    (u) => u.isActive && u.role === "PARTICIPANT"
  ).length;

  return (
    <div>
      <PageHeader
        title="Usuários"
        subtitle="Gerenciar participantes do bolão"
        icon="👥"
        action={
          <Link href="/admin/users/new" style={{ background: "linear-gradient(135deg, #009C3B, #007a2f)", color: "white", padding: "8px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 13 }}>
            ➕ Novo Usuário
          </Link>
        }
      />

      {/* Resumo de pagamentos */}
      <div style={{
        background: "var(--bg-card)",
        border: "1.5px solid var(--border-color)",
        borderRadius: 12,
        padding: "14px 20px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Pagos: </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#009C3B" }}>{paidCount}</span>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}> / {totalParticipants}</span>
          </div>
          <div>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Pote atual: </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#F9C200" }}>
              {(paidCount * 50).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          💡 Clique em "Pendente" para marcar como pago
        </div>
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 150px 80px 90px 80px 80px", padding: "10px 16px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, gap: 8 }}>
          <span>Nome / Username</span>
          <span>Tipo</span>
          <span>E-mail</span>
          <span>Status</span>
          <span>Pagamento</span>
          <span>Cadastro</span>
          <span style={{ textAlign: "right" }}>Ação</span>
        </div>

        {users.map((user) => (
          <div
            key={user.id}
            style={{ display: "grid", gridTemplateColumns: "1fr 100px 150px 80px 90px 80px 80px", padding: "12px 16px", borderBottom: "1px solid var(--border-color)", gap: 8, alignItems: "center" }}
          >
            {/* Nome */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: user.role === "ADMIN"
                  ? "linear-gradient(135deg, #F9C200, #d4a000)"
                  : user.role === "VIEWER"
                  ? "linear-gradient(135deg, #94a3b8, #64748b)"
                  : "linear-gradient(135deg, #009C3B, #007a2f)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: "white", flexShrink: 0,
              }}>
                {user.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{user.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>@{user.username}</div>
              </div>
            </div>

            {/* Tipo */}
            <div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                background: user.role === "ADMIN" ? "rgba(249,194,0,0.15)"
                  : user.role === "VIEWER" ? "rgba(148,163,184,0.15)"
                  : "rgba(0,156,59,0.15)",
                color: user.role === "ADMIN" ? "#d4a000"
                  : user.role === "VIEWER" ? "#64748b"
                  : "#009C3B",
              }}>
                {user.role}
              </span>
            </div>

            {/* E-mail */}
            <div style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.email}
            </div>

            {/* Ativo */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: user.isActive ? "rgba(0,156,59,0.12)" : "rgba(239,68,68,0.12)", color: user.isActive ? "#009C3B" : "#ef4444" }}>
                {user.isActive ? "Ativo" : "Inativo"}
              </span>
            </div>

            {/* Pagamento — só para PARTICIPANT */}
            <div>
              {user.role === "PARTICIPANT" ? (
                <PaymentToggle userId={user.id} hasPaid={user.hasPaid} />
              ) : (
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>—</span>
              )}
            </div>

            {/* Cadastro */}
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
              {new Date(user.createdAt).toLocaleDateString("pt-BR")}
            </div>

            {/* Ação */}
            <div style={{ textAlign: "right" }}>
              <Link href={`/admin/users/${user.id}`} style={{ fontSize: 12, color: "#60a5fa", textDecoration: "none", padding: "4px 10px", background: "rgba(59,130,246,0.1)", borderRadius: 6 }}>
                ✏️
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
