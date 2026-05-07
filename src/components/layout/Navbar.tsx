"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⚡" },
  { href: "/games", label: "Jogos", icon: "⚽" },
  { href: "/predictions", label: "Palpites", icon: "🎯" },
  { href: "/ranking", label: "Ranking", icon: "🏆" },
  { href: "/champion", label: "Campeão", icon: "👑" },
  { href: "/rules", label: "Regras", icon: "📋" },
];

const adminItems = [
  { href: "/admin", label: "Painel Admin", icon: "⚙️" },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!session) return null;

  const isAdmin = session.user.role === "ADMIN";
  const allItems = isAdmin ? [...navItems, ...adminItems] : navItems;

  return (
    <nav
      style={{
        background: "rgba(15,22,41,0.95)",
        borderBottom: "1px solid var(--border-color)",
        backdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", height: 60, gap: 8 }}>
          {/* Logo */}
          <Link
            href="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              marginRight: 16,
            }}
          >
            <span style={{ fontSize: 24 }}>🏆</span>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #f5a623, #ffd700)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  lineHeight: 1.1,
                }}
              >
                BOLÃO
              </div>
              <div style={{ fontSize: 10, color: "var(--text-secondary)", letterSpacing: 2, lineHeight: 1 }}>
                COPA 2026
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div
            style={{
              display: "flex",
              gap: 2,
              flex: 1,
              overflowX: "auto",
            }}
            className="hide-on-mobile"
          >
            {allItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 500,
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    background: active ? "var(--bg-card)" : "transparent",
                    border: active ? "1px solid var(--border-highlight)" : "1px solid transparent",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User info */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: 8,
              }}
              className="hide-on-mobile"
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "white",
                }}
              >
                {session.user.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                  {session.user.name}
                </div>
                {isAdmin && (
                  <div style={{ fontSize: 10, color: "#f5a623", fontWeight: 600 }}>ADMIN</div>
                )}
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#f87171",
                borderRadius: 8,
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
              className="hide-on-mobile"
            >
              Sair
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                borderRadius: 8,
                padding: "8px",
                cursor: "pointer",
                fontSize: 18,
                display: "none",
              }}
              className="show-on-mobile"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            style={{
              borderTop: "1px solid var(--border-color)",
              paddingBottom: 16,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: "12px 0" }}>
              {allItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 12px",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: 500,
                      color: active ? "var(--text-primary)" : "var(--text-secondary)",
                      background: active ? "var(--bg-card)" : "transparent",
                    }}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 4px",
                borderTop: "1px solid var(--border-color)",
                marginTop: 4,
              }}
            >
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                {session.user.name} {isAdmin && <span style={{ color: "#f5a623" }}>(Admin)</span>}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171",
                  borderRadius: 8,
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hide-on-mobile { display: none !important; }
          .show-on-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-on-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
