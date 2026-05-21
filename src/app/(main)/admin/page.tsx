import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const [users, matches, predictions, logs] = await Promise.all([
    prisma.user.count(),
    prisma.match.count(),
    prisma.prediction.count(),
    prisma.actionLog.count(),
  ]);

  const recentLogs = await prisma.actionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const pendingResults = await prisma.match.count({ where: { status: "LOCKED" } });
  const finishedMatches = await prisma.match.count({ where: { status: "FINISHED" } });

  return (
    <div>
      <PageHeader title="Painel Administrativo" subtitle="Gerencie o bolão" icon="⚙️" />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 28 }}>
        <AdminStat icon="👥" value={users} label="Usuários" href="/admin/users" color="#3b82f6" />
        <AdminStat icon="⚽" value={matches} label="Jogos" href="/admin/matches" color="#8b5cf6" />
        <AdminStat icon="🎯" value={predictions} label="Palpites" color="#00d4aa" />
        <AdminStat icon="⏳" value={pendingResults} label="Aguardando resultado" href="/admin/results" color="#f5a623" />
        <AdminStat icon="✅" value={finishedMatches} label="Jogos finalizados" color="#6ee7b7" />
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 28 }}>
        <AdminAction href="/admin/matches/new" icon="➕" title="Novo Jogo" desc="Cadastrar um jogo manualmente" color="#8b5cf6" />
        <AdminAction href="/admin/results" icon="📝" title="Inserir Resultados" desc="Atualizar placares finais" color="#f5a623" />
        <AdminAction href="/admin/users/new" icon="👤" title="Novo Usuário" desc="Convidar participante" color="#3b82f6" />
        <AdminAction href="/admin/rules" icon="📋" title="Editar Regras" desc="Alterar texto das regras" color="#00d4aa" />
        <AdminAction href="/admin/logs" icon="📊" title="Action Log" desc="Ver log de ações" color="#60a5fa" />
        <AdminAction href="/admin/desafio-do-dia" icon="🎯" title="Desafios do Dia" desc="Gerenciar desafios diários" color="#8b5cf6" />
      </div>

      {/* Recent logs */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>📊 Atividade Recente</h3>
          <Link href="/admin/logs" style={{ fontSize: 12, color: "#60a5fa", textDecoration: "none" }}>Ver tudo →</Link>
        </div>
        {recentLogs.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>Nenhuma atividade ainda.</div>
        ) : (
          recentLogs.map((log) => (
            <div key={log.id} style={{ display: "flex", gap: 12, padding: "10px 20px", borderBottom: "1px solid var(--border-color)", alignItems: "center" }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0,
                }}
              >
                {log.userName[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
                  <span style={{ fontWeight: 600, color: "#60a5fa" }}>{log.userName}</span>{" "}
                  {log.action}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  {new Date(log.createdAt).toLocaleString("pt-BR")}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AdminStat({ icon, value, label, href, color }: { icon: string; value: number; label: string; href?: string; color: string }) {
  const content = (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: 12,
        padding: "16px",
        textAlign: "center",
        cursor: href ? "pointer" : "default",
        transition: "all 0.2s",
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{label}</div>
    </div>
  );
  if (href) return <Link href={href} style={{ textDecoration: "none" }}>{content}</Link>;
  return content;
}

function AdminAction({ href, icon, title, desc, color }: { href: string; icon: string; title: string; desc: string; color: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px",
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: 12,
        textDecoration: "none",
        transition: "all 0.2s",
      }}
    >
      <div
        style={{
          width: 44, height: 44, borderRadius: 10,
          background: `${color}20`,
          border: `1px solid ${color}40`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{desc}</div>
      </div>
    </Link>
  );
}
