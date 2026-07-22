import type { QueryRow } from "./schemas";

function label(value: string): string {
  return value.replaceAll("_", " ");
}

export function createLocalSummary(rows: QueryRow[], columns: string[], instruction: string): string {
  if (rows.length === 0) return "No matching records were found for this question.";
  const first = rows[0];
  if (columns.length >= 2) {
    const firstValue = first[columns[0]];
    const secondValue = first[columns[1]];
    if (firstValue !== null && secondValue !== null) {
      return `${String(firstValue)} leads with ${String(secondValue)} ${label(columns[1])}.`;
    }
  }
  if (columns.length === 1) return `${label(columns[0])}: ${String(first[columns[0]])}.`;
  return `${rows.length} result${rows.length === 1 ? "" : "s"} returned. ${instruction}`;
}
