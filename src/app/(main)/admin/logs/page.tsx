import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function LogsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const logs = await prisma.actionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader title="Action Log" subtitle="Histórico de ações no sistema (somente leitura)" icon="📊" />

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "40px 160px 1fr 130px 130px", padding: "10px 16px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, gap: 12 }}>
          <span>#</span>
          <span>Usuário</span>
          <span>Ação</span>
          <span>IP</span>
          <span>Data / Hora</span>
        </div>
        {logs.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-secondary)" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
            Nenhuma ação registrada ainda.
          </div>
        ) : (
          logs.map((log, idx) => (
            <div
              key={log.id}
              style={{ display: "grid", gridTemplateColumns: "40px 160px 1fr 130px 130px", padding: "10px 16px", borderBottom: "1px solid var(--border-color)", gap: 12, alignItems: "center", fontSize: 13 }}
            >
              <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>{idx + 1}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0,
                  }}
                >
                  {log.userName[0]}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#60a5fa" }}>{log.userName}</span>
              </div>
              <span style={{ color: "var(--text-secondary)" }}>{log.action}</span>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: (log as any).ip ? "var(--verde)" : "#94a3b8" }}>
                {(log as any).ip ?? "—"}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                {new Date(log.createdAt).toLocaleString("pt-BR")}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
