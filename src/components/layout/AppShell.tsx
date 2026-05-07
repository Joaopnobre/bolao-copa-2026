"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "./Navbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              background: "linear-gradient(135deg, #f5a623, #ffd700)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Carregando...
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1, maxWidth: 1200, margin: "0 auto", width: "100%", padding: "24px 16px" }}>
        {children}
      </main>
      <footer
        style={{
          borderTop: "1px solid var(--border-color)",
          padding: "16px",
          textAlign: "center",
          color: "var(--text-secondary)",
          fontSize: 12,
        }}
      >
        🏆 Bolão Copa do Mundo 2026 — Sistema Privado
      </footer>
    </div>
  );
}
