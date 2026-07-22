"use client";

import { Clock3, History, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface HistoryItem { question: string; askedAt: string }

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Recently";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function QueryHistory({ items, loading, onRerun, onClear }: { items: HistoryItem[]; loading: boolean; onRerun: (question: string) => void; onClear: () => void }) {
  return (
    <section className="mx-auto mt-10 max-w-5xl" aria-labelledby="history-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><History className="size-4 text-[var(--accent)]" aria-hidden="true" /><h2 id="history-heading" className="text-sm font-extrabold text-[var(--text)]">Recent questions</h2></div>
        {items.length > 0 && <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={loading}><Trash2 className="size-3.5" />Clear history</Button>}
      </div>
      {items.length === 0 ? (
        <Card className="border-dashed p-5 text-center text-sm text-[var(--text-muted)]">Questions asked on this device will appear here. No SQL or credentials are stored.</Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <button key={`${item.question}-${item.askedAt}`} type="button" disabled={loading} onClick={() => onRerun(item.question)} className="focus-ring group min-h-20 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left shadow-sm transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:opacity-60">
              <span className="flex items-start justify-between gap-3"><span className="text-sm font-semibold leading-6 text-[var(--text)]">{item.question}</span><RotateCcw className="mt-1 size-3.5 shrink-0 text-[var(--text-subtle)] group-hover:text-[var(--accent)]" aria-hidden="true" /></span>
              <span className="mt-2 flex items-center gap-1.5 text-xs text-[var(--text-subtle)]"><Clock3 className="size-3" aria-hidden="true" />{formatTime(item.askedAt)}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
