"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { normalizeText } from "@/lib/odds";
import { getLockTime } from "@/lib/lockTime";

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
}: Props) {
  const router = useRouter();
  const [champion, setChampion] = useState(championPred?.value ?? "");
  const [scorer, setScorer] = useState(scorerPred?.value ?? "");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const lockDate = lockTime ? getLockTime(new Date(lockTime)) : null;

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
          points={15}
          locked={locked}
          value={champion}
          onChange={setChampion}
          savedValue={championPred?.value}
          officialValue={officialChampion}
          predPoints={championPred?.points}
        />

        {/* Top scorer */}
        <SpecialCard
          icon="⚽"
          title="Artilheiro da Copa"
          description="Quem vai ser o artilheiro da Copa do Mundo 2026?"
          points={15}
          locked={locked}
          value={scorer}
          onChange={setScorer}
          savedValue={scorerPred?.value}
          officialValue={officialScorer}
          predPoints={scorerPred?.points}
        />
      </div>

      {!locked && (
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
  icon, title, description, points, locked, value, onChange, savedValue, officialValue, predPoints,
}: {
  icon: string; title: string; description: string; points: number;
  locked: boolean; value: string; onChange: (v: string) => void;
  savedValue?: string; officialValue?: string | null; predPoints?: number | null;
}) {
  const isCorrect = officialValue && savedValue &&
    normalizeText(savedValue) === normalizeText(officialValue);

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

      <div
        style={{
          background: "rgba(245,166,35,0.1)",
          border: "1px solid rgba(245,166,35,0.2)",
          borderRadius: 8,
          padding: "6px 12px",
          fontSize: 12,
          color: "#f5a623",
          fontWeight: 600,
        }}
      >
        Vale até {points} pontos (mínimo {points / 2} pts com odds)
      </div>

      {!locked ? (
        <input
          className="input-field"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={icon === "👑" ? "Ex: Brasil, Argentina, França..." : "Ex: Lionel Messi, Kylian Mbappé..."}
        />
      ) : (
        <div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
            Seu Palpite
          </div>
          <div
            style={{
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
