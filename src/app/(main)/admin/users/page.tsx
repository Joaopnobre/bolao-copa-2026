import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <PageHeader
        title="Usuários"
        subtitle="Gerenciar participantes do bolão"
        icon="👥"
        action={
          <Link href="/admin/users/new" style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", padding: "8px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 13 }}>
            ➕ Novo Usuário
          </Link>
        }
      />

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 180px 80px 80px 80px", padding: "10px 16px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, gap: 8 }}>
          <span>Nome / Username</span>
          <span>Tipo</span>
          <span>E-mail</span>
          <span>Status</span>
          <span>Cadastro</span>
          <span style={{ textAlign: "right" }}>Ação</span>
        </div>

        {users.map((user) => (
          <div
            key={user.id}
            style={{ display: "grid", gridTemplateColumns: "1fr 100px 180px 80px 80px 80px", padding: "12px 16px", borderBottom: "1px solid var(--border-color)", gap: 8, alignItems: "center" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: user.role === "ADMIN" ? "linear-gradient(135deg, #f5a623, #ffd700)" : "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: user.role === "ADMIN" ? "#0a0e1a" : "white", flexShrink: 0 }}>
                {user.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{user.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>@{user.username}</div>
              </div>
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: user.role === "ADMIN" ? "rgba(245,166,35,0.15)" : "rgba(59,130,246,0.15)", color: user.role === "ADMIN" ? "#f5a623" : "#60a5fa" }}>
                {user.role}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: user.isActive ? "rgba(0,212,170,0.15)" : "rgba(239,68,68,0.15)", color: user.isActive ? "#00d4aa" : "#ef4444" }}>
                {user.isActive ? "Ativo" : "Inativo"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
              {new Date(user.createdAt).toLocaleDateString("pt-BR")}
            </div>
            <div style={{ textAlign: "right" }}>
              <Link href={`/admin/users/${user.id}`} style={{ fontSize: 12, color: "#60a5fa", textDecoration: "none", padding: "4px 10px", background: "rgba(59,130,246,0.1)", borderRadius: 6 }}>
                ✏️ Editar
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
