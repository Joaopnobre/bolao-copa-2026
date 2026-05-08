"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MatchCard } from "@/components/ui/MatchCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { isMatchLocked } from "@/lib/lockTime";
import { calculateOdd, ODDS_CONFIG } from "@/lib/odds";

interface Props {
  matches: any[];
  userPredictions: any[];
}

export function PredictionsClient({ matches, userPredictions }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [bulkOdds, setBulkOdds] = useState<Record<string, { counts: Record<string, number>; total: number }>>({});

  const predMap = new Map(userPredictions.map((p) => [p.matchId, p]));

  // IDs dos jogos abertos com palpite do usuário — são os que precisam de odds
  const openMatchIds = matches
    .filter((m) => !isMatchLocked(new Date(m.matchDate)) && m.status !== "FINISHED")
    .map((m) => m.id);

  useEffect(() => {
    if (!openMatchIds.length) return;
    const fetchOdds = () => {
      fetch(`/api/predictions/odds/bulk?matchIds=${openMatchIds.join(",")}`)
        .then((r) => r.json())
        .then((d) => setBulkOdds(d))
        .catch(() => {});
    };
    fetchOdds();
    const interval = setInterval(fetchOdds, 10000); // atualiza a cada 10s
    return () => clearInterval(interval);
  }, [openMatchIds.join(",")]);

  // Calcula pontuação esperada para o palpite do usuário em um jogo
  function getExpectedPts(matchId: string, pred: { homeScore: number; awayScore: number } | undefined) {
    if (!pred) return null;
    const oddData = bulkOdds[matchId];
    if (!oddData) return null;
    const N = Math.max(oddData.total, 1);

    // Placar exato
    const key = `${pred.homeScore}-${pred.awayScore}`;
    const kExact = Math.max(oddData.counts[key] ?? 1, 1);
    const exact = ODDS_CONFIG.POINTS.EXACT_SCORE * calculateOdd(kExact, N);

    // Vencedor/empate
    const predW = pred.homeScore > pred.awayScore ? "home" : pred.awayScore > pred.homeScore ? "away" : "draw";
    let kWinner = 0;
    for (const [sc, cnt] of Object.entries(oddData.counts)) {
      const [sh, sa] = sc.split("-").map(Number);
      const w = sh > sa ? "home" : sa > sh ? "away" : "draw";
      if (w === predW) kWinner += cnt;
    }
    const winner = ODDS_CONFIG.POINTS.WINNER * calculateOdd(Math.max(kWinner, 1), N);

    return { exact, winner };
  }

  const openMatches = matches.filter((m) => !isMatchLocked(new Date(m.matchDate)) && m.status !== "FINISHED");
  const pendingMatches = openMatches.filter((m) => !predMap.has(m.id));
  const doneMatches = openMatches.filter((m) => predMap.has(m.id));
  const finishedWithPred = matches.filter((m) => m.status === "FINISHED" && predMap.has(m.id));

  const displayed =
    filter === "all" ? openMatches : filter === "pending" ? pendingMatches : doneMatches;

  return (
    <div>
      <PageHeader
        title="Meus Palpites"
        subtitle="Gerencie seus palpites para os jogos"
        icon="🎯"
      />

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
        <SummaryCard color="#3b82f6" value={openMatches.length} label="Jogos abertos" />
        <SummaryCard color="#f5a623" value={pendingMatches.length} label="Sem palpite" />
        <SummaryCard color="#00d4aa" value={doneMatches.length} label="Palpitados" />
        <SummaryCard color="#8b5cf6" value={finishedWithPred.length} label="Finalizados" />
      </div>

      {/* Progress bar */}
      {openMatches.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>
            <span>Progresso dos palpites</span>
            <span>{doneMatches.length}/{openMatches.length}</span>
          </div>
          <div style={{ background: "var(--bg-secondary)", borderRadius: 999, height: 8, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                borderRadius: 999,
                background: "linear-gradient(90deg, #3b82f6, #00d4aa)",
                width: openMatches.length > 0 ? `${(doneMatches.length / openMatches.length) * 100}%` : "0%",
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--bg-card)", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {[
          { key: "all", label: `Todos (${openMatches.length})` },
          { key: "pending", label: `Pendentes (${pendingMatches.length})` },
          { key: "done", label: `Feitos (${doneMatches.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              background: filter === tab.key ? "#3b82f6" : "transparent",
              color: filter === tab.key ? "white" : "var(--text-secondary)",
              border: "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            {filter === "pending" ? "Todos os palpites feitos!" : "Nenhum jogo disponível"}
          </div>
          <div style={{ fontSize: 13 }}>
            {filter === "pending" ? "Você palpitou em todos os jogos abertos." : "Aguarde novos jogos."}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
          {displayed.map((match) => {
            const pred = predMap.get(match.id);
            return (
              <MatchCard
                key={match.id}
                match={match}
                prediction={pred ?? null}
                expectedPts={getExpectedPts(match.id, pred)}
                showPrediction
                onClick={() => router.push(`/predictions/${match.id}`)}
              />
            );
          })}
        </div>
      )}

      {/* Finished matches */}
      {finishedWithPred.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
            ✅ Resultados dos seus palpites
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
            {finishedWithPred.map((match) => {
              const pred = predMap.get(match.id);
              return (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={pred}
                  points={pred?.points}
                  showPrediction
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: 10,
        padding: "12px 16px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>{label}</div>
    </div>
  );
}
