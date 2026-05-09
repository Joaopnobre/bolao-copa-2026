"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { normalizeText, calculateOdd, ODDS_CONFIG } from "@/lib/odds";
import { getLockTime } from "@/lib/lockTime";

// Lista completa das 48 seleções da Copa do Mundo 2026
const COPA_COUNTRIES = [
  "África do Sul","Alemanha","Argélia","Argentina","Arábia Saudita",
  "Austrália","Áustria","Bélgica","Bósnia","Brasil",
  "Cabo Verde","Canadá","Catar","Colômbia","Congo",
  "Coreia do Sul","Costa do Marfim","Croácia","Curaçao","Egito",
  "Equador","Escócia","Espanha","Estados Unidos","França",
  "Gana","Haiti","Holanda","Inglaterra","Iraque",
  "Irã","Japão","Jordânia","Marrocos","México",
  "Nova Zelândia","Noruega","Panamá","Paraguai","Portugal",
  "República Tcheca","Senegal","Suécia","Suíça","Turquia",
  "Tunísia","Uruguai","Uzbequistão",
];

interface Props {
  championPred: any;
  scorerPred: any;
  allChampion: any[];
  allScorer: any[];
  locked: boolean;
  userId: string;
  officialChampion: string | null;
  officialScorer: string | null;
  lockTime: string | null;
  isViewer?: boolean;
}

export function ChampionClient({
  championPred,
  scorerPred,
  allChampion,
  allScorer,
  locked,
  userId,
  officialChampion,
  officialScorer,
  lockTime,
  isViewer = false,
}: Props) {
  const router = useRouter();
  const [champion, setChampion]   = useState(championPred?.value ?? "");
  const [scorer, setScorer]       = useState(scorerPred?.value ?? "");
  const [loading, setLoading]     = useState(false);
  const [deleting, setDeleting]   = useState<"CHAMPION" | "TOP_SCORER" | null>(null);
  const [feedback, setFeedback]   = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [oddsData, setOddsData] = useState<{
    counts: { CHAMPION: Record<string, number>; TOP_SCORER: Record<string, number> };
    total: number;
  } | null>(null);

  const lockDate = lockTime ? getLockTime(new Date(lockTime)) : null;

  // Busca odds a cada 10s — sempre, para mostrar contagens mesmo após salvar
  useEffect(() => {
    if (isViewer) return;
    const fetch10 = () =>
      fetch("/api/special-predictions/odds")
        .then((r) => r.json())
        .then((d) => setOddsData(d))
        .catch(() => {});
    fetch10();
    const id = setInterval(fetch10, 10000);
    return () => clearInterval(id);
  }, [isViewer]);

  // Calcula odds e pontos para um valor digitado
  function calcSpecialOdds(value: string, type: "CHAMPION" | "TOP_SCORER") {
    if (!oddsData || !value.trim()) return null;
    const N   = Math.max(oddsData.total, 1);
    const key = normalizeText(value);
    const alreadySaved = type === "CHAMPION"
      ? normalizeText(championPred?.value ?? "") === key
      : normalizeText(scorerPred?.value ?? "") === key;
    const k   = (oddsData.counts[type][key] ?? 0) + (alreadySaved ? 0 : 1);
    const odd = calculateOdd(Math.max(k, 1), N);
    const pts = ODDS_CONFIG.POINTS.CHAMPION * odd; // 15 pts base
    return { odd, pts, k };
  }

  const champOdds  = calcSpecialOdds(champion, "CHAMPION");
  const scorerOdds = calcSpecialOdds(scorer, "TOP_SCORER");

  function oddColor(odd: number) {
    if (odd >= 0.85) return "#009C3B";
    if (odd >= 0.65) return "#d97706";
    return "#dc2626";
  }

  async function handleSave() {
    setLoading(true);
    setFeedback(null);
    try {
      const promises = [];
      if (champion.trim()) {
        promises.push(
          fetch("/api/special-predictions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "CHAMPION", value: champion.trim() }),
          })
        );
      }
      if (scorer.trim()) {
        promises.push(
          fetch("/api/special-predictions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "TOP_SCORER", value: scorer.trim() }),
          })
        );
      }
      await Promise.all(promises);
      setFeedback({ type: "success", msg: "Palpites salvos com sucesso!" });
      router.refresh();
    } catch {
      setFeedback({ type: "error", msg: "Erro ao salvar palpites." });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(type: "CHAMPION" | "TOP_SCORER") {
    if (!confirm(`Excluir palpite de ${type === "CHAMPION" ? "campeão" : "artilheiro"}?`)) return;
    setDeleting(type);
    try {
      const res = await fetch("/api/special-predictions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error("Erro ao excluir");
      if (type === "CHAMPION") setChampion("");
      else setScorer("");
      router.refresh();
    } catch {
      setFeedback({ type: "error", msg: "Erro ao excluir palpite." });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <PageHeader
        title="Campeão & Artilheiro"
        subtitle="Palpites especiais da Copa do Mundo 2026"
        icon="👑"
      />

      {/* Lock status */}
      <div
        style={{
          background: locked
            ? "linear-gradient(135deg, rgba(245,166,35,0.1), rgba(245,166,35,0.05))"
            : "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.05))",
          border: `1px solid ${locked ? "rgba(245,166,35,0.3)" : "rgba(59,130,246,0.3)"}`,
          borderRadius: 12,
          padding: "12px 20px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 20 }}>{locked ? "🔒" : "✏️"}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: locked ? "#f5a623" : "#60a5fa" }}>
            {locked ? "Palpites bloqueados" : "Palpites abertos"}
          </div>
          {lockDate && (
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {locked ? "Bloqueados em" : "Bloqueiam em"} {lockDate.toLocaleDateString("pt-BR", {
                weekday: "long", day: "2-digit", month: "long",
              })} às {lockDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Champion */}
        <SpecialCard
          icon="👑"
          title="Campeão da Copa"
          description="Qual seleção vai vencer a Copa do Mundo 2026?"
          isViewer={isViewer}
          points={15}
          locked={locked}
          value={champion}
          onChange={setChampion}
          savedValue={championPred?.value}
          officialValue={officialChampion}
          predPoints={championPred?.points}
          currentOdds={champOdds}
          oddColor={oddColor}
          savedCount={championPred?.value && oddsData
            ? (oddsData.counts.CHAMPION[normalizeText(championPred.value)] ?? 0)
            : null}
          onDelete={championPred ? () => handleDelete("CHAMPION") : undefined}
          isDeleting={deleting === "CHAMPION"}
          suggestions={COPA_COUNTRIES}
        />

        {/* Top scorer */}
        <SpecialCard
          icon="⚽"
          title="Artilheiro da Copa"
          description="Quem vai ser o artilheiro da Copa do Mundo 2026?"
          isViewer={isViewer}
          points={15}
          locked={locked}
          value={scorer}
          onChange={setScorer}
          savedValue={scorerPred?.value}
          officialValue={officialScorer}
          predPoints={scorerPred?.points}
          currentOdds={scorerOdds}
          oddColor={oddColor}
          savedCount={scorerPred?.value && oddsData
            ? (oddsData.counts.TOP_SCORER[normalizeText(scorerPred.value)] ?? 0)
            : null}
          onDelete={scorerPred ? () => handleDelete("TOP_SCORER") : undefined}
          isDeleting={deleting === "TOP_SCORER"}
          suggestions={oddsData
            ? Object.keys(oddsData.counts.TOP_SCORER)
                .sort((a, b) => oddsData.counts.TOP_SCORER[b] - oddsData.counts.TOP_SCORER[a])
            : []}
        />
      </div>

      {!locked && !isViewer && (
        <div>
          {feedback && (
            <div
              className={feedback.type === "success" ? "alert-success" : "alert-error"}
              style={{ marginBottom: 12, textAlign: "center" }}
            >
              {feedback.msg}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={loading || (!champion.trim() && !scorer.trim())}
            className="btn-primary btn-gold"
            style={{ width: "100%", justifyContent: "center", padding: 14, fontSize: 15, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Salvando..." : "💾 Salvar Palpites Especiais"}
          </button>
        </div>
      )}

      {/* All predictions (after lock) */}
      {locked && (allChampion.length > 0 || allScorer.length > 0) && (
        <div style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
            📊 Palpites dos Participantes
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {allChampion.length > 0 && (
              <PredList
                title="👑 Campeões Palpitados"
                preds={allChampion}
                officialValue={officialChampion}
                currentUserId={userId}
              />
            )}
            {allScorer.length > 0 && (
              <PredList
                title="⚽ Artilheiros Palpitados"
                preds={allScorer}
                officialValue={officialScorer}
                currentUserId={userId}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SpecialCard({
  icon, title, description, points, locked, value, onChange,
  savedValue, officialValue, predPoints, isViewer, currentOdds, oddColor, savedCount, onDelete, isDeleting, suggestions = [],
}: {
  icon: string; title: string; description: string; points: number;
  locked: boolean; value: string; onChange: (v: string) => void;
  savedValue?: string; officialValue?: string | null; predPoints?: number | null;
  isViewer?: boolean;
  currentOdds?: { odd: number; pts: number; k: number } | null;
  oddColor?: (odd: number) => string;
  savedCount?: number | null;
  onDelete?: () => void;
  isDeleting?: boolean;
  suggestions?: string[];
}) {
  const isCorrect = officialValue && savedValue &&
    normalizeText(savedValue) === normalizeText(officialValue);

  const color = oddColor ?? (() => "#009C3B");

  // Autocomplete
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = value.trim().length >= 1
    ? suggestions
        .filter((s) => normalizeText(s).includes(normalizeText(value)))
        .sort((a, b) => {
          // Prioriza quem começa com o texto digitado
          const aNorm = normalizeText(a), bNorm = normalizeText(b), q = normalizeText(value);
          return (bNorm.startsWith(q) ? 1 : 0) - (aNorm.startsWith(q) ? 1 : 0);
        })
        .slice(0, 6)
    : [];

  const showDropdown = focused && filtered.length > 0 && normalizeText(value) !== normalizeText(filtered[0]);

  function pick(s: string) {
    onChange(s);
    setFocused(false);
    inputRef.current?.blur();
  }

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${isCorrect ? "rgba(0,212,170,0.4)" : "var(--border-color)"}`,
        borderRadius: 14,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{title}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{description}</div>
        </div>
      </div>

      <div style={{
        background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)",
        borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#f5a623", fontWeight: 600,
      }}>
        Vale até {points} pontos (mínimo {points / 2} pts com odds)
      </div>

      {!locked && !isViewer ? (
        <>
          <div style={{ position: "relative" }}>
            <input
              ref={inputRef}
              className="input-field"
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              placeholder={icon === "👑" ? "Ex: Brasil, Argentina, França..." : "Ex: Lionel Messi, Kylian Mbappé..."}
            />

            {/* Dropdown de sugestões */}
            {showDropdown && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0, right: 0,
                background: "var(--bg-card)",
                border: "1.5px solid var(--verde)",
                borderRadius: 10,
                zIndex: 50,
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              }}>
                {filtered.map((s) => {
                  const q = normalizeText(value);
                  const sn = normalizeText(s);
                  const idx = sn.indexOf(q);
                  return (
                    <button
                      key={s}
                      onMouseDown={() => pick(s)}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        padding: "10px 14px", background: "transparent",
                        border: "none", borderBottom: "1px solid var(--border-color)",
                        cursor: "pointer", fontSize: 14, color: "var(--text-primary)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--verde-bg)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      {idx >= 0 ? (
                        <>
                          {s.slice(0, idx)}
                          <strong style={{ color: "var(--verde)" }}>{s.slice(idx, idx + value.length)}</strong>
                          {s.slice(idx + value.length)}
                        </>
                      ) : s}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Odds em tempo real */}
          {currentOdds && value.trim() ? (
            <div style={{
              background: currentOdds.odd >= 0.85 ? "linear-gradient(135deg, #f0fdf4, #dcfce7)"
                : currentOdds.odd >= 0.65 ? "linear-gradient(135deg, #fffbeb, #fef3c7)"
                : "linear-gradient(135deg, #fef2f2, #fee2e2)",
              border: `2px solid ${color(currentOdds.odd)}`,
              borderRadius: 10,
              padding: "10px 14px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: color(currentOdds.odd), marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Se acertar
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: color(currentOdds.odd), lineHeight: 1 }}>
                {currentOdds.pts.toFixed(1)}
                <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 3 }}>pts</span>
              </div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                odd {(currentOdds.odd * 100).toFixed(0)}% · {currentOdds.k} pessoa{currentOdds.k !== 1 ? "s" : ""} com essa escolha
              </div>
            </div>
          ) : value.trim() ? (
            <div style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "center" }}>
              Calculando odds...
            </div>
          ) : null}
        </>
      ) : (
        <div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
            Seu Palpite
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div
              style={{
                flex: 1,
                padding: "10px 14px",
                background: "var(--bg-secondary)",
                borderRadius: 8,
                border: "1px solid var(--border-color)",
                fontSize: 16,
                fontWeight: 700,
                color: savedValue ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              {savedValue || <span style={{ fontSize: 13 }}>Sem palpite registrado</span>}
            </div>
            {!locked && !isViewer && onDelete && savedValue && (
              <button
                onClick={onDelete}
                disabled={isDeleting}
                title="Excluir palpite"
                style={{
                  background: "linear-gradient(135deg, #f87171, #dc2626)",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 12px",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  fontSize: 16,
                  color: "white",
                  opacity: isDeleting ? 0.6 : 1,
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(220,38,38,0.3)",
                }}
              >
                {isDeleting ? "..." : "🗑️"}
              </button>
            )}
          </div>
          {/* Mensagem de quantas pessoas escolheram o mesmo */}
          {savedValue && savedCount !== null && savedCount !== undefined && !isCorrect && (
            <div style={{
              marginTop: 8,
              padding: "6px 10px",
              borderRadius: 8,
              textAlign: "center",
              fontSize: 12,
              fontWeight: 600,
              background: savedCount === 1
                ? "linear-gradient(135deg, #f0fdf4, #dcfce7)"
                : savedCount <= 3
                ? "linear-gradient(135deg, #fffbeb, #fef3c7)"
                : "linear-gradient(135deg, #fef2f2, #fee2e2)",
              color: savedCount === 1 ? "#009C3B" : savedCount <= 3 ? "#d97706" : "#dc2626",
              border: `1px solid ${savedCount === 1 ? "#86efac" : savedCount <= 3 ? "#fcd34d" : "#fca5a5"}`,
            }}>
              {savedCount === 1
                ? "🎯 Só você escolheu isso!"
                : savedCount === 2
                ? "🤝 1 pessoa escolheu o mesmo que você"
                : `👥 ${savedCount - 1} pessoas escolheram o mesmo que você!`}
            </div>
          )}

          {isCorrect && (
            <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: "#ffd700", textAlign: "center" }}>
              🎯 Acertou! {predPoints !== null && predPoints !== undefined ? `+${predPoints.toFixed(1)} pts` : ""}
            </div>
          )}
          {officialValue && savedValue && !isCorrect && (
            <div style={{ marginTop: 6, fontSize: 12, color: "#ef4444", textAlign: "center" }}>
              Oficial: {officialValue}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PredList({ title, preds, officialValue, currentUserId }: {
  title: string; preds: any[]; officialValue?: string | null; currentUserId: string;
}) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)", fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
        {title}
      </div>
      {preds.map((pred: any) => {
        const isCorrect = officialValue && normalizeText(pred.value) === normalizeText(officialValue);
        const isMe = pred.userId === currentUserId;
        return (
          <div
            key={pred.id}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 16px",
              borderBottom: "1px solid var(--border-color)",
              gap: 10,
              background: isMe ? "rgba(59,130,246,0.06)" : "transparent",
            }}
          >
            <div
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: isMe ? "linear-gradient(135deg, #f5a623, #ffd700)" : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: isMe ? "#0a0e1a" : "white",
                flexShrink: 0,
              }}
            >
              {pred.user.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: isMe ? "#f5a623" : "var(--text-secondary)" }}>
                {pred.user.name}{isMe ? " (você)" : ""}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{pred.value}</div>
            </div>
            <span style={{ fontSize: 16 }}>
              {isCorrect ? "🎯" : ""}
            </span>
            {pred.points !== null && pred.points > 0 && (
              <div style={{ fontSize: 12, fontWeight: 700, color: "#ffd700" }}>+{pred.points.toFixed(1)}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
