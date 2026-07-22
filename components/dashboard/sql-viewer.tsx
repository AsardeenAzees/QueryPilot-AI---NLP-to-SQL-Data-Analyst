"use client";

import { useRef, useState } from "react";
import { Check, CheckCircle2, ChevronDown, Clipboard, Code2, Info } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

const SQL_TOKENS = /('(?:''|[^'])*'|"(?:""|[^"])*"|\b(?:SELECT|FROM|WHERE|WITH|AS|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|IN|IS|NULL|TRUE|FALSE|GROUP|BY|ORDER|ASC|DESC|LIMIT|OFFSET|COUNT|SUM|AVG|MIN|MAX|DISTINCT|CASE|WHEN|THEN|ELSE|END|HAVING|OVER|PARTITION|UNION|ALL)\b|\b\d+(?:\.\d+)?\b|--.*$)/gim;
const KEYWORD = /^(?:SELECT|FROM|WHERE|WITH|AS|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|IN|IS|NULL|TRUE|FALSE|GROUP|BY|ORDER|ASC|DESC|LIMIT|OFFSET|COUNT|SUM|AVG|MIN|MAX|DISTINCT|CASE|WHEN|THEN|ELSE|END|HAVING|OVER|PARTITION|UNION|ALL)$/i;

function highlightedSql(sql: string) {
  return sql.split(SQL_TOKENS).filter(Boolean).map((token, index) => {
    const className = KEYWORD.test(token)
      ? "text-sky-300 font-semibold"
      : token.startsWith("'")
        ? "text-emerald-300"
        : /^\d/.test(token)
          ? "text-amber-300"
          : token.startsWith("--")
            ? "text-slate-500 italic"
            : token.startsWith('"')
              ? "text-violet-300"
              : "text-slate-200";
    return <span className={className} key={`${index}-${token.slice(0, 8)}`}>{token}</span>;
  });
}

export function SqlViewer({ sql }: { sql: string }) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);

  async function copySql() {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-700 bg-[#07111f] text-slate-100 shadow-xl shadow-slate-950/10" aria-labelledby="sql-title">
      <div className="flex flex-col gap-3 border-b border-slate-700/80 bg-[#0c1828] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Code2 className="size-4 text-sky-400" aria-hidden="true" />
            <h3 id="sql-title" className="text-sm font-bold text-white">Generated PostgreSQL</h3>
            <StatusBadge tone="success" icon={CheckCircle2} className="min-h-7 border-emerald-800 bg-emerald-950/70 text-emerald-300">Validated read-only query</StatusBadge>
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-slate-400"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />Parsed and checked against approved tables before execution.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={copySql} className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-600 bg-slate-900 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-800" aria-label="Copy generated SQL">
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Clipboard className="size-3.5" />}{copied ? "Copied" : "Copy SQL"}
          </button>
          <button type="button" onClick={() => setExpanded((value) => !value)} className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-600 bg-slate-900 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-800" aria-expanded={expanded} aria-controls="generated-sql-code">
            {expanded ? "Collapse" : "Expand"}<ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
          </button>
        </div>
      </div>
      {expanded && (
        <div id="generated-sql-code" className="sql-panel-enter max-h-[28rem] overflow-auto overscroll-contain" tabIndex={0} aria-label="Generated PostgreSQL code">
          <pre className="min-w-max p-4 font-mono text-[13px] leading-7 sm:p-5"><code>{highlightedSql(sql)}</code></pre>
        </div>
      )}
    </section>
  );
}
