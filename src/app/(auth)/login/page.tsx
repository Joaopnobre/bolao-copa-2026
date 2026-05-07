"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      login,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Usuário ou senha inválidos.");
    } else {
      router.push("/dashboard");
    }
  }

  if (status === "loading") return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
        padding: 16,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "10%",
          width: 300,
          height: 300,
          background: "radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 420,
          animation: "slide-up 0.4s ease-out",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 900,
              background: "linear-gradient(135deg, #f5a623, #ffd700)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              margin: 0,
              letterSpacing: -0.5,
            }}
          >
            BOLÃO COPA 2026
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "8px 0 0" }}>
            Sistema Privado de Palpites
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: 16,
            padding: 32,
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: "0 0 24px",
              textAlign: "center",
            }}
          >
            Entrar no Sistema
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Usuário ou E-mail
              </label>
              <input
                className="input-field"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="seu_usuario ou email@exemplo.com"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Senha
              </label>
              <input
                className="input-field"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="alert-error" style={{ fontSize: 13, textAlign: "center" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary btn-gold"
              disabled={loading}
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "12px",
                fontSize: 15,
                opacity: loading ? 0.7 : 1,
                marginTop: 4,
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-secondary)", marginTop: 24 }}>
          Sistema privado — apenas usuários convidados
        </p>
      </div>
    </div>
  );
}
