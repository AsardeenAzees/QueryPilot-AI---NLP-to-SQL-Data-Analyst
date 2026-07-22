"use client";

import dynamic from "next/dynamic";
import { CheckCircle2, Clock3, Download, Layers3, Sparkles, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import type { QueryResponse, QueryValue } from "@/lib/query/schemas";
import { ResultTable } from "./result-table";
import { SqlViewer } from "./sql-viewer";

const ResultChart = dynamic(() => import("./result-chart"), { ssr: false, loading: () => <Card className="p-6"><LoadingSkeleton /></Card> });

function csvCell(value: QueryValue): string {
  let text = value === null ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function ResultPanel({ result }: { result: QueryResponse }) {
  function downloadCsv() {
    const content = [result.columns.map(csvCell).join(","), ...result.rows.map((row) => result.columns.map((column) => csvCell(row[column])).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "querypilot-result.csv"; anchor.click(); URL.revokeObjectURL(url);
  }
  return (
    <section className="space-y-5" aria-live="polite" data-testid="results">
      <Card className="overflow-hidden">
        <div className="border-b border-[var(--border)] bg-gradient-to-r from-sky-50/80 to-indigo-50/50 p-5 dark:from-sky-950/45 dark:to-indigo-950/25 sm:p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[var(--accent-strong)]"><Sparkles className="size-3.5" />Data-backed answer</p>
              <h2 className="text-xl font-extrabold tracking-tight text-[var(--text)] sm:text-2xl">{result.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)] sm:text-base">{result.summary}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={downloadCsv} aria-label="Download result as CSV" className="w-full shrink-0 sm:w-auto"><Download className="size-4" />Download CSV</Button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <StatusBadge icon={Clock3}>{result.executionTimeMs} ms</StatusBadge>
            <StatusBadge icon={Table2}>{result.rowCount} {result.rowCount === 1 ? "row" : "rows"}</StatusBadge>
            <StatusBadge tone={result.cached ? "info" : "neutral"} icon={Layers3}>{result.cached ? "Cached result" : "Live result"}</StatusBadge>
            <StatusBadge tone="success" icon={CheckCircle2}>Validated query</StatusBadge>
          </div>
        </div>
        <ResultTable result={result} />
      </Card>
      <ResultChart result={result} />
      <SqlViewer key={result.sql} sql={result.sql} />
    </section>
  );
}
