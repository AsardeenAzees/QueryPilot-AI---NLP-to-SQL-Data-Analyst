"use client";

import { Check, Circle, LoaderCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { cn } from "@/lib/utils";

export const QUERY_STEPS = [
  ["Understanding your question", "Identifying the people, teams, and metrics you asked about."],
  ["Reading the IPL semantic model", "Matching your wording to trusted cricket definitions."],
  ["Generating PostgreSQL", "Creating one focused query for the approved dataset."],
  ["Validating query safety", "Checking read-only rules, tables, and row limits."],
  ["Querying Neon PostgreSQL", "Running the validated query against the IPL database."],
  ["Preparing the answer and chart", "Formatting the result into a clear analysis."],
] as const;

export function QueryProgress({ currentStep, complete, slow }: { currentStep: number; complete: boolean; slow: boolean }) {
  return (
    <Card className="mt-5 overflow-hidden" role="status" aria-live="polite" aria-label="Query progress">
      <div className="border-b border-[var(--border)] bg-[var(--accent-soft)] px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--accent-strong)]">
          {complete ? <Check className="size-4" aria-hidden="true" /> : <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          {complete ? "Analysis complete" : slow ? "Still working — complex questions can take a little longer" : "Analysing your question"}
        </div>
      </div>
      <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
        {QUERY_STEPS.map(([title, description], index) => {
          const active = !complete && index === currentStep;
          return (
            <div key={title} className={cn("flex gap-3", !active && !complete && "opacity-60")} aria-current={active ? "step" : undefined}>
              <span className={cn(
                "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold",
                complete && "border-emerald-500 bg-emerald-500 text-white",
                active && "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]",
                !complete && !active && "border-[var(--border-strong)] text-[var(--text-subtle)]",
              )}>
                {complete ? <Check className="size-3.5" aria-hidden="true" /> : active ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> : <Circle className="size-2.5" aria-hidden="true" />}
              </span>
              <div>
                <p className="text-sm font-bold text-[var(--text)]">{title}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{description}</p>
              </div>
            </div>
          );
        })}
      </div>
      {!complete && <div className="border-t border-[var(--border)] p-4 sm:p-5"><LoadingSkeleton /></div>}
      <p className="border-t border-[var(--border)] px-4 py-3 text-xs leading-5 text-[var(--text-subtle)] sm:px-5">Progress labels describe the active request. Safety and execution are confirmed only when the server returns the answer.</p>
    </Card>
  );
}
