"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems: { href: string; label: string; icon?: string; iconImg?: string }[] = [
  { href: "/dashboard", label: "Dashboard", iconImg: "/icons/thunder.png" },
  { href: "/games", label: "Jogos", iconImg: "/icons/match.png" },
  { href: "/predictions", label: "Palpites", iconImg: "/icons/goal.png" },
  { href: "/ranking", label: "Ranking", iconImg: "/icons/ranking.png" },
  { href: "/champion", label: "Campeão", iconImg: "/icons/crown.png" },
  { href: "/rules", label: "Regras", iconImg: "/icons/rules.png" },
  { href: "/desafio-do-dia", label: "Desafio!", iconImg: "/icons/control.png" },
];

const adminItems: { href: string; label: string; icon?: string; iconImg?: string }[] = [
  { href: "/admin", label: "Painel Admin", icon: "⚙️" },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!session) return null;

  const isAdmin  = session.user.role === "ADMIN";
  const isViewer = session.user.role === "VIEWER";
  const allItems = isAdmin ? [...navItems, ...adminItems] : navItems;

  return (
    <nav
      style={{
        background: "linear-gradient(135deg, #007a2f 0%, #009C3B 50%, #00b845 100%)",
        borderBottom: "4px solid #F9C200",
        boxShadow: "0 4px 20px rgba(0,156,59,0.45)",
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
            <img src="/icons/trophy.png" alt="" style={{ width: 32, height: 32, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #F9C200, #d4a000)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  lineHeight: 1.1,
                }}
              >
                BOLÃO
              </div>
              <div style={{
                fontSize: 11,
                letterSpacing: 2,
                lineHeight: 1,
                fontWeight: 800,
                color: "#FFE500",
                textShadow: "0 1px 4px rgba(0,0,0,0.4)",
              }}>
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
              justifyContent: "space-between",
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
                    gap: 4,
                    padding: "5px 8px",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontSize: 12,
                    fontWeight: 500,
                    color: active ? "#ffffff" : "rgba(255,255,255,0.75)",
                    background: active ? "rgba(255,255,255,0.2)" : "transparent",
                    border: active ? "1px solid rgba(255,255,255,0.35)" : "1px solid transparent",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.iconImg
                    ? <img src={item.iconImg} alt="" style={{ width: 16, height: 16, objectFit: "contain", filter: "brightness(0) invert(1)", opacity: active ? 1 : 0.75 }} />
                    : <span>{item.icon}</span>
                  }
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User info */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
            <Link
              href={isViewer ? "#" : "/settings"}
              onClick={isViewer ? (e) => e.preventDefault() : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                background: isViewer ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.15)",
                border: `1px solid ${isViewer ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.25)"}`,
                borderRadius: 8,
                textDecoration: "none",
                cursor: isViewer ? "default" : "pointer",
              }}
              className="hide-on-mobile"
            >
              <div
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: isViewer
                    ? "linear-gradient(135deg, #94a3b8, #64748b)"
                    : "linear-gradient(135deg, #F9C200, #d4a000)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: isViewer ? "white" : "#002776",
                }}
              >
                {session.user.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "white" }}>
                  {session.user.name}
                </div>
                {isAdmin
                  ? <div style={{ fontSize: 10, color: "#fcd34d", fontWeight: 700 }}>ADMIN</div>
                  : isViewer
                  ? <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>👁️ VISUALIZADOR</div>
                  : <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>⚙️ configurações</div>
                }
              </div>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "rgba(255,255,255,0.9)",
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
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
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
                    {item.iconImg
                      ? <img src={item.iconImg} alt="" style={{ width: 18, height: 18, objectFit: "contain", filter: "brightness(0) invert(0.6)" }} />
                      : <span>{item.icon}</span>
                    }
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
                  color: "rgba(255,255,255,0.9)",
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
