"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, BarChart3, Database, MessageSquareText, ShieldCheck, Sparkles, Table2, WandSparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BusinessContactCta } from "@/components/layout/business-contact-cta";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { QueryResponse, QueryValue } from "@/lib/query/schemas";
import { ErrorState } from "./error-state";
import { QueryForm } from "./query-form";
import { QueryHistory, type HistoryItem } from "./query-history";
import { QueryProgress, QUERY_STEPS } from "./query-progress";
import { ResultPanel } from "./result-panel";

interface Overview { seasons: QueryValue; matches: QueryValue; deliveries: QueryValue; players: QueryValue }
interface ApiError { error?: string; code?: string }
interface DisplayError { title: string; message: string; canRetry: boolean; code: string }

function isQueryResponse(payload: unknown): payload is QueryResponse {
  return typeof payload === "object" && payload !== null && "rows" in payload && Array.isArray(payload.rows);
}

function isApiError(payload: unknown): payload is ApiError {
  return typeof payload === "object" && payload !== null
    && (!("error" in payload) || typeof payload.error === "string")
    && (!("code" in payload) || typeof payload.code === "string");
}

function formatValue(value: QueryValue): string {
  if (value === null) return "—";
  if (typeof value === "number" || /^\d+$/.test(String(value))) return new Intl.NumberFormat("en-IN").format(Number(value));
  return String(value);
}

function displayError(status: number, payload: ApiError): DisplayError {
  const message = payload.error ?? "We couldn’t complete that request. Please try again.";
  const code = payload.code ?? `HTTP_${status}`;
  switch (payload.code) {
    case "INVALID_QUESTION": return { title: "Check your question", message, canRetry: false, code };
    case "QUESTION_NOT_ANSWERABLE": return { title: "Ask for a measurable result", message, canRetry: false, code };
    case "RATE_LIMITED": return { title: "Daily question limit reached", message, canRetry: false, code };
    case "AI_BUSY": return { title: "Gemini quota or traffic limit reached", message, canRetry: true, code };
    case "AI_CONFIGURATION": return { title: "Production AI configuration needs attention", message, canRetry: false, code };
    case "AI_INVALID_RESPONSE": return { title: "Gemini response could not be validated", message, canRetry: true, code };
    case "AI_UNAVAILABLE": return { title: "Gemini is temporarily unavailable", message, canRetry: true, code };
    case "RATE_LIMIT_UNAVAILABLE": return { title: "Request protection temporarily unavailable", message, canRetry: true, code };
    case "DATA_UNAVAILABLE": return { title: "IPL database temporarily unavailable", message, canRetry: true, code };
    case "UNSAFE_SQL": return { title: "Query rejected by safety checks", message: "The generated query did not meet the read-only safety policy. Try phrasing the question more directly.", canRetry: false, code };
    case "QUERY_FAILED": return { title: "Unable to prepare an answer", message, canRetry: true, code };
    default:
      if (status === 429) return { title: "Daily question limit reached", message, canRetry: false, code };
      if (status >= 500) return { title: "Service temporarily unavailable", message, canRetry: true, code };
      return { title: "Something went wrong", message, canRetry: true, code };
  }
}

function safeHistory(): HistoryItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem("querypilot-history") ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is HistoryItem => typeof item === "object" && item !== null && "question" in item && "askedAt" in item && typeof item.question === "string" && typeof item.askedAt === "string").slice(0, 10);
  } catch { return []; }
}

export function QueryDashboard() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<DisplayError | null>(null);
  const [validationMessage, setValidationMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [progressComplete, setProgressComplete] = useState(false);
  const [slowRequest, setSlowRequest] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [overview, setOverview] = useState<Overview>({ seasons: null, matches: null, deliveries: null, players: null });
  const resultRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    fetch("/api/overview").then((response) => response.json()).then((data: Overview) => setOverview(data)).catch(() => undefined);
    window.requestAnimationFrame(() => setHistory(safeHistory()));
  }, []);

  useEffect(() => {
    if (!loading || progressComplete) return;
    const stepTimer = window.setInterval(() => setProgressStep((step) => Math.min(step + 1, QUERY_STEPS.length - 1)), 1550);
    const slowTimer = window.setTimeout(() => setSlowRequest(true), 8_000);
    return () => { window.clearInterval(stepTimer); window.clearTimeout(slowTimer); };
  }, [loading, progressComplete]);

  const stats = useMemo(() => [
    { label: "Dataset", value: "IPL", detail: "Ball-by-ball", icon: Database },
    { label: "Seasons", value: overview.seasons, detail: "Coverage", icon: Activity },
    { label: "Matches", value: overview.matches, detail: "Fixtures", icon: BarChart3 },
    { label: "Deliveries", value: overview.deliveries, detail: "Recorded balls", icon: Sparkles },
    { label: "Players", value: overview.players, detail: "Player records", icon: MessageSquareText },
  ], [overview]);

  const executeQuery = useCallback(async (questionOverride?: string) => {
    if (inFlight.current) return;
    const clean = (questionOverride ?? question).trim();
    if (clean.length < 3) { setValidationMessage("Enter at least 3 characters so QueryPilot can understand the question."); return; }
    if (clean.length > 500) { setValidationMessage("Questions must be 500 characters or fewer."); return; }

    inFlight.current = true;
    setQuestion(clean);
    setValidationMessage(""); setError(null); setResult(null);
    setLoading(true); setProgressStep(0); setProgressComplete(false); setSlowRequest(false);
    try {
      const response = await fetch("/api/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: clean }) });
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        setError(displayError(response.status, { error: "The server returned an unreadable response. Please retry and check the deployment logs if it continues.", code: "INVALID_SERVER_RESPONSE" }));
        return;
      }
      if (!response.ok || !isQueryResponse(payload)) {
        setError(displayError(response.status, isApiError(payload) ? payload : { error: "The server returned an unexpected response format.", code: "INVALID_SERVER_RESPONSE" }));
        return;
      }

      setProgressStep(QUERY_STEPS.length - 1);
      setProgressComplete(true);
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      setResult(payload);
      const updated = [{ question: clean, askedAt: new Date().toISOString() }, ...history.filter((item) => item.question !== clean)].slice(0, 10);
      setHistory(updated);
      localStorage.setItem("querypilot-history", JSON.stringify(updated));
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch {
      setError({ title: "Connection interrupted", message: "QueryPilot couldn’t reach the analysis service. Your question is still here, so you can retry safely.", canRetry: true, code: "CLIENT_NETWORK_ERROR" });
    } finally {
      setLoading(false);
      setProgressComplete(false);
      inFlight.current = false;
    }
  }, [history, question]);

  function changeQuestion(value: string) {
    setQuestion(value);
    if (validationMessage) setValidationMessage("");
    if (error) setError(null);
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem("querypilot-history");
  }

  return (
    <>
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <a href="#top" className="focus-ring flex min-w-0 items-center gap-3 rounded-lg">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--button-primary)] text-white shadow-md"><WandSparkles className="size-5" aria-hidden="true" /></span>
            <span className="min-w-0"><span className="block truncate font-[family-name:var(--font-manrope)] text-base font-extrabold tracking-tight text-[var(--text)]">QueryPilot AI</span><span className="hidden text-xs text-[var(--text-muted)] sm:block">Natural Language Data Analyst</span></span>
          </a>
          <div className="flex items-center gap-2">
            <StatusBadge tone="success" icon={ShieldCheck} className="hidden sm:inline-flex">Read-only data</StatusBadge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div id="top" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="mx-auto max-w-4xl text-center">
          <StatusBadge tone="info" icon={Sparkles}>Live IPL analytics</StatusBadge>
          <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-[-.04em] text-[var(--text)] sm:text-5xl lg:text-6xl">Ask the data.<br /><span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent dark:from-sky-400 dark:to-indigo-400">Skip the SQL.</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-[var(--text-muted)] sm:text-lg">Ask questions about IPL cricket in everyday language. QueryPilot securely turns each question into a checked query, table, and chart.</p>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:mt-10 lg:grid-cols-5" aria-label="Dataset overview">
          {stats.map(({ label, value, detail, icon: Icon }) => <Card key={label} className="min-w-0 p-4 sm:p-5"><span className="grid size-9 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-strong)]"><Icon className="size-4" aria-hidden="true" /></span><p className="mt-4 text-xs font-semibold text-[var(--text-muted)]">{label}</p><p className="mt-1 truncate text-xl font-extrabold tracking-tight text-[var(--text)]">{formatValue(value)}</p><p className="mt-1 text-xs text-[var(--text-subtle)]">{detail}</p></Card>)}
        </section>

        <QueryForm question={question} loading={loading} validationMessage={validationMessage} onQuestionChange={changeQuestion} onSubmit={() => void executeQuery()} />

        <div className="mx-auto max-w-4xl">
          {loading && <QueryProgress currentStep={progressStep} complete={progressComplete} slow={slowRequest} />}
          {error && <ErrorState title={error.title} message={error.message} errorCode={error.code} canRetry={error.canRetry} onRetry={() => void executeQuery()} />}
        </div>

        <div ref={resultRef} className="mx-auto mt-9 max-w-5xl scroll-mt-24">
          {result ? <ResultPanel result={result} /> : !loading && !error && <EmptyState icon={Table2} title="Your analysis will appear here" description="Ask a question or choose an example. QueryPilot will return a concise answer, data table, suitable chart, and the validated PostgreSQL." />}
        </div>

        <QueryHistory items={history} loading={loading} onRerun={(value) => void executeQuery(value)} onClear={clearHistory} />

        <section className="mt-16 border-t border-[var(--border)] pt-12 sm:mt-20 sm:pt-14" id="about">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--accent-strong)]">About the project</p><h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[var(--text)] sm:text-3xl">A trustworthy path from question to answer.</h2><p className="mt-4 leading-7 text-[var(--text-muted)]">QueryPilot demonstrates production-minded NLP-to-SQL: Gemini reads a curated semantic model, PostgreSQL AST checks enforce a strict read-only boundary, and Neon executes bounded queries. Next.js Route Handlers keep credentials server-side, while automated tests cover the safety contract and user journey.</p></div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              [MessageSquareText, "Semantic modelling", "Business definitions, relationships, synonyms, and verified examples ground the AI in the actual IPL schema."],
              [ShieldCheck, "SQL security", "Only one validated SELECT or WITH/SELECT can run, with known tables, a 200-row cap, and a five-second database timeout."],
              [Database, "Modern data stack", "Next.js, TypeScript, Gemini, Neon PostgreSQL, Upstash, Recharts, Vitest, and Playwright work as one focused application."],
            ].map(([Icon, title, copy]) => { const FeatureIcon = Icon as typeof ShieldCheck; return <Card key={String(title)} className="p-6"><span className="grid size-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)]"><FeatureIcon className="size-5" /></span><h3 className="mt-5 font-extrabold text-[var(--text)]">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{String(copy)}</p></Card>; })}
          </div>
        </section>
      </div>
      <BusinessContactCta />
    </main>
    <SiteFooter />
    </>
  );
}
