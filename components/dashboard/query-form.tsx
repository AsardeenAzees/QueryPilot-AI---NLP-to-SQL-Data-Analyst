"use client";

import { Search, Sparkles, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const EXAMPLE_QUESTIONS = [
  "Who hit the most sixes?",
  "Who took the most wickets?",
  "Which team won the most matches?",
  "Compare Virat Kohli and MS Dhoni.",
  "Which venues hosted the most matches?",
] as const;

interface QueryFormProps {
  question: string;
  loading: boolean;
  validationMessage?: string;
  onQuestionChange: (question: string) => void;
  onSubmit: () => void;
}

export function QueryForm({ question, loading, validationMessage, onQuestionChange, onSubmit }: QueryFormProps) {
  return (
    <section className="mx-auto mt-7 max-w-4xl sm:mt-9" aria-labelledby="query-heading">
      <Card className="p-4 ring-1 ring-sky-100 dark:ring-sky-950 sm:p-7">
        <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="query-heading" className="text-base font-extrabold text-[var(--text)]">Ask the IPL dataset</h2>
              <label htmlFor="question" className="mt-1 block text-sm text-[var(--text-muted)]">Write your question in everyday language.</label>
            </div>
            {question && <button type="button" onClick={() => onQuestionChange("")} disabled={loading} className="focus-ring inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]" aria-label="Clear question"><Trash2 className="size-3.5" />Clear</button>}
          </div>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-4 top-4 size-5 text-[var(--text-subtle)]" aria-hidden="true" />
            <textarea
              id="question"
              value={question}
              onChange={(event) => onQuestionChange(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); onSubmit(); }
              }}
              disabled={loading}
              maxLength={500}
              rows={4}
              placeholder="For example: Which player hit the most sixes in IPL history?"
              className="focus-ring min-h-32 w-full resize-y rounded-xl border border-[var(--border-strong)] bg-[var(--surface-muted)] py-3.5 pl-12 pr-4 text-base leading-7 text-[var(--text)] transition placeholder:text-[var(--text-subtle)] focus:border-[var(--accent)] focus:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-70"
              aria-describedby={validationMessage ? "question-error question-help" : "question-help"}
              aria-invalid={Boolean(validationMessage)}
            />
          </div>
          <div id="question-help" className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-subtle)]">
            <span><kbd className="rounded border border-[var(--border)] bg-[var(--surface-muted)] px-1.5 py-0.5 font-mono">Ctrl/⌘ + Enter</kbd> to ask</span>
            <span>{question.length}/500</span>
          </div>
          {validationMessage && <p id="question-error" className="mt-2 text-sm font-medium text-red-600 dark:text-red-300">{validationMessage}</p>}
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-[var(--text-muted)]"><ShieldCheck className="mr-1.5 inline size-3.5 text-emerald-600 dark:text-emerald-400" />Every query is checked before it reaches the database.</p>
            <Button type="submit" size="lg" disabled={loading || !question.trim()} className="w-full sm:w-auto">
              <Sparkles className="size-4" />{loading ? "Analysis in progress" : "Ask QueryPilot"}
            </Button>
          </div>
        </form>
      </Card>
      <div className="mt-4">
        <p className="mb-2.5 text-xs font-bold uppercase tracking-[.14em] text-[var(--text-subtle)]">Try an example</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((example) => <Button key={example} type="button" variant="secondary" size="sm" disabled={loading} onClick={() => onQuestionChange(example)} className="max-w-full whitespace-normal text-left">{example}</Button>)}
        </div>
      </div>
    </section>
  );
}
