"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, BarChart3, ChevronDown, Clock3, Code2, Database, Download, History,
  LoaderCircle, MessageSquareText, Search, ShieldCheck, Sparkles, Table2, WandSparkles, XCircle,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { QueryResponse, QueryValue } from "@/lib/query/schemas";

const EXAMPLES = [
  "Who hit the most sixes?",
  "Who took the most wickets?",
  "Which team won the most matches?",
  "Compare Virat Kohli and MS Dhoni.",
  "Which venues hosted the most matches?",
];
const PROGRESS = ["Understanding your question…", "Building a safe PostgreSQL query…", "Checking tables and permissions…", "Analysing the IPL data…"];
const COLORS = ["#0ea5e9", "#6366f1", "#14b8a6", "#f59e0b", "#f43f5e", "#8b5cf6"];

interface Overview { seasons: QueryValue; matches: QueryValue; deliveries: QueryValue; players: QueryValue }
interface HistoryItem { question: string; askedAt: string }

function formatValue(value: QueryValue): string {
  if (value === null) return "—";
  if (typeof value === "number") return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);
  return String(value);
}

function csvCell(value: QueryValue): string {
  let text = value === null ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function ResultChart({ result }: { result: QueryResponse }) {
  const { chart, rows } = result;
  if (chart.type === "none" || !chart.xKey || !chart.yKey || rows.length === 0) return null;
  const chartRows = rows.slice(0, 20);
  const yIsNumeric = chartRows.some((row) => typeof row[chart.yKey as string] === "number");
  if (!yIsNumeric) return null;
  const common = { data: chartRows, margin: { top: 8, right: 12, bottom: 12, left: 0 } };
  return (
    <Card className="p-4 sm:p-6" aria-label="Result chart">
      <div className="mb-5 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-sky-600" aria-hidden="true" />
        <h3 className="text-sm font-bold text-slate-900">Visual breakdown</h3>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === "bar" ? (
            <BarChart {...common}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={chart.xKey} tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={75} />
              <YAxis tick={{ fontSize: 11 }} width={50} />
              <Tooltip cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey={chart.yKey} fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          ) : chart.type === "line" ? (
            <LineChart {...common}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={chart.xKey} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={50} />
              <Tooltip />
              <Line type="monotone" dataKey={chart.yKey} stroke="#0ea5e9" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          ) : chart.type === "pie" ? (
            <PieChart>
              <Pie data={chartRows} dataKey={chart.yKey} nameKey={chart.xKey} innerRadius="45%" outerRadius="75%" paddingAngle={2}>
                {chartRows.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          ) : (
            <ScatterChart {...common}>
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis dataKey={chart.xKey} name={chart.xKey} tick={{ fontSize: 11 }} />
              <YAxis dataKey={chart.yKey} name={chart.yKey} tick={{ fontSize: 11 }} width={50} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={chartRows} fill="#0ea5e9" />
            </ScatterChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function Results({ result }: { result: QueryResponse }) {
  const download = () => {
    const content = [result.columns.map(csvCell).join(","), ...result.rows.map((row) => result.columns.map((column) => csvCell(row[column])).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "querypilot-result.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="space-y-5" aria-live="polite" data-testid="results">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-sky-50/70 to-indigo-50/50 p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-sky-700">
                <Sparkles className="h-3.5 w-3.5" /> Answer
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">{result.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{result.summary}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={download} aria-label="Download result as CSV">
              <Download className="h-4 w-4" /> CSV
            </Button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
            <span className="rounded-full bg-white px-3 py-1.5 shadow-sm"><Clock3 className="mr-1.5 inline h-3.5 w-3.5 text-sky-600" />{result.executionTimeMs} ms</span>
            <span className="rounded-full bg-white px-3 py-1.5 shadow-sm"><Table2 className="mr-1.5 inline h-3.5 w-3.5 text-sky-600" />{result.rowCount} rows</span>
            {result.cached && <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">Cached result</span>}
          </div>
        </div>
        <div className="overflow-x-auto">
          {result.rows.length ? (
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead><tr className="border-b border-slate-200 bg-slate-50/70">{result.columns.map((column) => <th key={column} className="px-5 py-3.5 font-bold capitalize text-slate-700">{column.replaceAll("_", " ")}</th>)}</tr></thead>
              <tbody>{result.rows.map((row, index) => <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-sky-50/30">{result.columns.map((column) => <td key={column} className="px-5 py-3.5 text-slate-650">{formatValue(row[column])}</td>)}</tr>)}</tbody>
            </table>
          ) : <div className="p-10 text-center text-sm text-slate-500">No matching rows were found.</div>}
        </div>
      </Card>
      <ResultChart result={result} />
      <details className="group rounded-2xl border border-slate-200 bg-slate-950 text-slate-200">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
          <span className="flex items-center gap-2"><Code2 className="h-4 w-4 text-sky-400" /> Generated PostgreSQL</span>
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <pre className="overflow-x-auto border-t border-slate-800 p-5 text-xs leading-6 text-sky-100"><code>{result.sql}</code></pre>
      </details>
    </section>
  );
}

export function QueryDashboard() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [overview, setOverview] = useState<Overview>({ seasons: null, matches: null, deliveries: null, players: null });
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/overview").then((response) => response.json()).then((data: Overview) => setOverview(data)).catch(() => undefined);
    window.requestAnimationFrame(() => {
      try { setHistory(JSON.parse(localStorage.getItem("querypilot-history") ?? "[]") as HistoryItem[]); } catch { setHistory([]); }
    });
  }, []);
  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(() => setProgress((value) => Math.min(value + 1, PROGRESS.length - 1)), 1300);
    return () => window.clearInterval(timer);
  }, [loading]);

  const stats = useMemo(() => [
    { label: "Dataset", value: "IPL", icon: Database },
    { label: "Seasons", value: overview.seasons, icon: Activity },
    { label: "Matches", value: overview.matches, icon: BarChart3 },
    { label: "Deliveries", value: overview.deliveries, icon: Sparkles },
    { label: "Players", value: overview.players, icon: MessageSquareText },
  ], [overview]);

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    const clean = question.trim();
    if (clean.length < 3) return setError("Please enter a question with at least 3 characters.");
    if (clean.length > 500) return setError("Questions must be 500 characters or fewer.");
    setError(""); setLoading(true); setProgress(0); setResult(null);
    try {
      const response = await fetch("/api/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: clean }) });
      const data = await response.json() as QueryResponse | { error?: string };
      if (!response.ok || !("rows" in data)) throw new Error("error" in data ? data.error : "The request failed.");
      setResult(data);
      const updated = [{ question: clean, askedAt: new Date().toISOString() }, ...history.filter((item) => item.question !== clean)].slice(0, 8);
      setHistory(updated); localStorage.setItem("querypilot-history", JSON.stringify(updated));
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Something went wrong."); }
    finally { setLoading(false); }
  }

  return (
    <main>
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white shadow-md shadow-slate-300"><WandSparkles className="h-5 w-5" /></span>
            <span><span className="block font-[family-name:var(--font-manrope)] text-base font-extrabold tracking-tight">QueryPilot AI</span><span className="hidden text-xs text-slate-500 sm:block">Natural Language Data Analyst</span></span>
          </a>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> Read-only data</span>
        </div>
      </header>

      <div id="top" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <section className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700"><Sparkles className="h-3.5 w-3.5" /> IPL answers, backed by live data</div>
          <h1 className="text-balance text-4xl font-extrabold tracking-[-.04em] text-slate-950 sm:text-5xl lg:text-6xl">Ask the data.<br /><span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">Skip the SQL.</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-slate-600 sm:text-lg">Ask questions about IPL cricket in everyday language. QueryPilot creates a secure query, checks it, and turns the answer into a clear table and chart.</p>
        </section>

        <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-5" aria-label="Dataset overview">
          {stats.map(({ label, value, icon: Icon }) => <Card key={label} className="p-4 sm:p-5"><Icon className="mb-4 h-4 w-4 text-sky-600" /><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 truncate text-lg font-extrabold tracking-tight text-slate-950">{formatValue(value)}</p></Card>)}
        </section>

        <section className="mx-auto mt-8 max-w-4xl">
          <Card className="p-5 ring-1 ring-sky-100 sm:p-7">
            <form onSubmit={ask}>
              <label htmlFor="question" className="mb-3 block text-sm font-bold text-slate-900">What would you like to know?</label>
              <div className="relative">
                <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" aria-hidden="true" />
                <textarea id="question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} rows={3} placeholder="e.g. Who hit the most sixes?" className="w-full resize-none rounded-2xl border border-slate-300 bg-slate-50/50 py-3.5 pl-12 pr-4 text-base text-slate-900 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" aria-describedby="question-help" />
              </div>
              <div id="question-help" className="mt-2 flex justify-between text-xs text-slate-400"><span>Plain English works best</span><span>{question.length}/500</span></div>
              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500"><ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />Every query is parsed and validated before execution.</p>
                <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
                  {loading ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Analysing</> : <><Sparkles className="h-4 w-4" /> Ask QueryPilot</>}
                </Button>
              </div>
            </form>
            {loading && <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm font-medium text-sky-800" role="status"><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />{PROGRESS[progress]}</div>}
            {error && <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700" role="alert"><XCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
          </Card>

          <div className="mt-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-[.14em] text-slate-500">Try an example</p>
            <div className="flex flex-wrap gap-2">{EXAMPLES.map((example) => <Button key={example} variant="secondary" size="sm" onClick={() => { setQuestion(example); setError(""); }}>{example}</Button>)}</div>
          </div>
        </section>

        <div ref={resultRef} className="mx-auto mt-10 max-w-5xl scroll-mt-6">{result ? <Results result={result} /> : !loading && <Card className="border-dashed p-8 text-center"><Table2 className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">Your analysis will appear here</p><p className="mt-1 text-xs text-slate-400">Ask a question or choose an example to get started.</p></Card>}</div>

        {history.length > 0 && <section className="mx-auto mt-10 max-w-5xl"><div className="mb-4 flex items-center gap-2"><History className="h-4 w-4 text-sky-600" /><h2 className="text-sm font-extrabold text-slate-900">Recent questions on this device</h2></div><div className="grid gap-2 sm:grid-cols-2">{history.slice(0, 6).map((item) => <button key={item.question} onClick={() => setQuestion(item.question)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 hover:border-sky-300 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">{item.question}</button>)}</div></section>}

        <section className="mt-20 border-t border-slate-200 pt-14" id="about">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-sky-700">About the project</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">A trustworthy path from question to answer.</h2><p className="mt-4 leading-7 text-slate-600">QueryPilot demonstrates production-minded NLP-to-SQL: Gemini reads a curated semantic model, PostgreSQL AST checks enforce a strict read-only boundary, and Neon executes bounded queries. Next.js Route Handlers keep credentials server-side, while automated tests cover the safety contract and user journey.</p></div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              [MessageSquareText, "Semantic modelling", "Business definitions, relationships, synonyms, and verified examples ground the AI in the actual IPL schema."],
              [ShieldCheck, "SQL security", "Only one validated SELECT or WITH/SELECT can run, with known tables, a 200-row cap, and a five-second database timeout."],
              [Database, "Modern data stack", "Next.js, TypeScript, Gemini, Neon PostgreSQL, Upstash, Recharts, Vitest, and Playwright work as one focused application."],
            ].map(([Icon, title, copy]) => { const FeatureIcon = Icon as typeof ShieldCheck; return <Card key={String(title)} className="p-6"><FeatureIcon className="h-5 w-5 text-sky-600" /><h3 className="mt-5 font-extrabold text-slate-950">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{String(copy)}</p></Card>; })}
          </div>
        </section>
      </div>
      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><span>QueryPilot AI — Natural Language Data Analyst</span><span>No login. No uploads. Read-only analytics.</span></div></footer>
    </main>
  );
}
