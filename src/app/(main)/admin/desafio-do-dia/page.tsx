import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { CATEGORY_LABELS } from "@/lib/daily-challenge";

export default async function AdminDesafiosPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const challenges = await prisma.challenge.findMany({
    orderBy: { publishDate: "desc" },
    include: { _count: { select: { attempts: true } } },
  });

  const categoryCounts: Record<string, number> = {};
  for (const c of challenges) {
    categoryCounts[c.category] = (categoryCounts[c.category] ?? 0) + 1;
  }

  const CATEGORY_META: { key: string; icon: string }[] = [
    { key: "PLAYER",         icon: "⚽" },
    { key: "TEAM",           icon: "🏳️" },
    { key: "STADIUM",        icon: "🏟️" },
    { key: "HISTORIC_MATCH", icon: "📅" },
    { key: "YEAR",           icon: "📆" },
    { key: "MUSIC",          icon: "🎵" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <PageHeader title="Desafios do Dia" subtitle="Gerencie os desafios diários" icon="🎯" />
        <Link href="/admin/desafio-do-dia/new" className="btn-primary btn-gold" style={{ padding: "10px 20px", textDecoration: "none" }}>
          ➕ Novo Desafio
        </Link>
      </div>

      {/* Category counters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
        {CATEGORY_META.map(({ key, icon }) => {
          const count = categoryCounts[key] ?? 0;
          return (
            <div key={key} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: 10, padding: "8px 16px",
            }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {CATEGORY_LABELS[key] ?? key}
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: count > 0 ? "var(--text-primary)" : "var(--text-secondary)", lineHeight: 1.1 }}>
                  {count}
                </div>
              </div>
            </div>
          );
        })}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(249,194,0,0.08)",
          border: "1px solid rgba(249,194,0,0.2)",
          borderRadius: 10, padding: "8px 16px",
        }}>
          <span style={{ fontSize: 16 }}>🎯</span>
          <div>
            <div style={{ fontSize: 11, color: "#F9C200", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Total</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#F9C200", lineHeight: 1.1 }}>{challenges.length}</div>
          </div>
        </div>
      </div>

      {challenges.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-secondary)" }}>
          Nenhum desafio cadastrado ainda.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {challenges.map((c) => (
            <Link key={c.id} href={`/admin/desafio-do-dia/${c.id}`} style={{ textDecoration: "none" }}>
              <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                cursor: "pointer",
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: c.status === "PUBLISHED" ? "rgba(0,212,170,0.15)" : "rgba(249,194,0,0.1)",
                  border: `1px solid ${c.status === "PUBLISHED" ? "rgba(0,212,170,0.3)" : "rgba(249,194,0,0.2)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>
                  🎯
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{c.answer}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {CATEGORY_LABELS[c.category] ?? c.category} · {new Date(c.publishDate).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                    background: c.status === "PUBLISHED" ? "rgba(0,212,170,0.15)" : "rgba(249,194,0,0.1)",
                    color: c.status === "PUBLISHED" ? "#00d4aa" : "#F9C200",
                    border: `1px solid ${c.status === "PUBLISHED" ? "rgba(0,212,170,0.3)" : "rgba(249,194,0,0.2)"}`,
                  }}>
                    {c.status === "PUBLISHED" ? "PUBLICADO" : "RASCUNHO"}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {(c as any)._count?.attempts ?? 0} jogadores
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
