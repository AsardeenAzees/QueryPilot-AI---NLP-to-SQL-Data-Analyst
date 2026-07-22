import { AlignRight, DatabaseZap } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { QueryResponse, QueryValue } from "@/lib/query/schemas";
import { cn } from "@/lib/utils";

function formatValue(value: QueryValue): string {
  if (value === null) return "—";
  if (typeof value === "number") return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);
  return String(value);
}

export function ResultTable({ result }: { result: QueryResponse }) {
  if (result.rows.length === 0) return <EmptyState icon={DatabaseZap} title="No matching data" description="The query ran successfully, but no IPL records matched this question. Try broadening the wording or removing a filter." />;
  const numericColumns = new Set(result.columns.filter((column) => result.rows.some((row) => typeof row[column] === "number")));
  return (
    <div className="max-h-[34rem] overflow-auto overscroll-contain" role="region" aria-label="Query result table" tabIndex={0}>
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-[var(--border-strong)] bg-[var(--surface-muted)]">
            {result.columns.map((column) => <th key={column} scope="col" className={cn("whitespace-nowrap px-4 py-3.5 font-bold capitalize text-[var(--text-muted)] sm:px-5", numericColumns.has(column) && "text-right")}>
              {numericColumns.has(column) && <AlignRight className="mr-1.5 inline size-3 text-[var(--text-subtle)]" aria-hidden="true" />}{column.replaceAll("_", " ")}
            </th>)}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, index) => <tr key={index} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent-soft)]">
            {result.columns.map((column) => <td key={column} className={cn("whitespace-nowrap px-4 py-3.5 text-[var(--text-muted)] sm:px-5", numericColumns.has(column) && "[font-variant-numeric:tabular-nums] text-right font-medium text-[var(--text)]")}>{formatValue(row[column])}</td>)}
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}
