import "server-only";

import { neon } from "@neondatabase/serverless";
import type { QueryRow, QueryValue } from "@/lib/query/schemas";

interface ExecutionResult {
  rows: QueryRow[];
  columns: string[];
  executionTimeMs: number;
}

function toJsonValue(value: unknown): QueryValue {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value);
}

export async function executeReadOnlyQuery(query: string): Promise<ExecutionResult> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
  const sql = neon(databaseUrl, { fullResults: true });
  const started = performance.now();
  const result = await sql.query(query, []);
  const executionTimeMs = Math.round((performance.now() - started) * 10) / 10;
  const sourceRows = Array.isArray(result) ? result : result.rows;
  const rows = sourceRows.slice(0, 200).map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key, toJsonValue(value)])),
  );
  const columns = rows.length > 0 ? Object.keys(rows[0]) : "fields" in result ? result.fields.map((field) => field.name) : [];
  return { rows, columns, executionTimeMs };
}
