"use client";

import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

// Simple markdown renderer (heading, bold, table)
function renderMarkdown(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactElement[] = [];
  let i = 0;
  let tableRows: string[][] = [];
  let inTable = false;

  function flushTable() {
    if (!tableRows.length) return;
    const [header, ...body] = tableRows;
    if (!header) return;
    elements.push(
      <div key={`table-${i}`} style={{ overflowX: "auto", marginBottom: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {header.map((h, j) => (
                <th key={j} style={{ padding: "8px 16px", background: "var(--bg-secondary)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, textAlign: "left", borderBottom: "1px solid var(--border-color)" }}>
                  {h.trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: "8px 16px", borderBottom: "1px solid var(--border-color)", fontSize: 14, color: "var(--text-primary)" }}>
                    {cell.trim()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
  }

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("|")) {
      inTable = true;
      const rawCells = line.split("|");
      const cells = rawCells.slice(line.startsWith("|") ? 1 : 0, line.endsWith("|") ? rawCells.length - 1 : undefined).map(c => c.trim());
      if (!line.match(/^[|\s-]+$/)) tableRows.push(cells);
      i++;
      continue;
    }

    if (inTable) flushTable();

    if (line.startsWith("# ")) {
      elements.push(<h1 key={i} style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", margin: "24px 0 12px", borderBottom: "2px solid var(--border-color)", paddingBottom: 8 }}>{line.slice(2)}</h1>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} style={{ fontSize: 17, fontWeight: 700, color: "#f5a623", margin: "20px 0 8px" }}>{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={i} style={{ fontSize: 15, fontWeight: 700, color: "#60a5fa", margin: "16px 0 6px" }}>{line.slice(4)}</h3>);
    } else if (line.startsWith("- ")) {
      const text = line.slice(2).replace(/\*\*(.+?)\*\*/g, (_, m) => `<strong>${m}</strong>`);
      elements.push(<li key={i} style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 4, paddingLeft: 4, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: text }} />);
    } else if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: 8 }} />);
    } else {
      const text = line.replace(/\*\*(.+?)\*\*/g, (_, m) => `<strong style="color:var(--text-primary)">${m}</strong>`);
      elements.push(<p key={i} style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 8px", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: text }} />);
    }
    i++;
  }
  if (inTable) flushTable();
  return elements;
}

export function RulesClient({ content, isAdmin }: { content: string; isAdmin: boolean }) {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <PageHeader
        title="Regras do Bolão"
        subtitle="Como funciona o Bolão Copa do Mundo 2026"
        icon="📋"
        action={
          isAdmin ? (
            <Link
              href="/admin/rules"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "white",
                padding: "8px 16px",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ✏️ Editar Regras
            </Link>
          ) : undefined
        }
      />

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: 16,
          padding: "24px 28px",
        }}
      >
        {renderMarkdown(content)}
      </div>
    </div>
  );
}
