import { parse } from "pgsql-ast-parser";
import type { SemanticModel } from "@/lib/data/types";

const FORBIDDEN = /\b(?:insert|update|delete|merge|drop|alter|create|truncate|copy|grant|revoke|call|do|execute|prepare|deallocate|begin|commit|rollback|savepoint|vacuum|analyze|refresh|listen|notify|load|security|dblink|lo_import|lo_export|pg_read_file|pg_ls_dir|pg_sleep)\b/i;
const SYSTEM_ACCESS = /\b(?:information_schema|pg_catalog|pg_toast|pg_temp|pg_[a-z0-9_]+)\b/i;
const TABLE_REFERENCE = /\b(?:from|join)\s+(?:only\s+)?(?:("?[a-z_][\w$]*"?)\.)?("?[a-z_][\w$]*"?)/gi;
const CTE_REFERENCE = /(?:\bwith|,)\s*("?[a-z_][\w$]*"?)\s+as\s*\(/gi;

export class SqlValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SqlValidationError";
  }
}

function unquote(identifier: string): string {
  return identifier.replaceAll('"', "").toLowerCase();
}

export function validateSql(sql: string, model: SemanticModel): string {
  const normalized = sql.trim().replace(/;+\s*$/, "");
  if (!normalized) throw new SqlValidationError("SQL is empty.");
  if (/--|\/\*|\*\//.test(normalized)) throw new SqlValidationError("SQL comments are not allowed.");
  if (FORBIDDEN.test(normalized)) throw new SqlValidationError("SQL contains a forbidden operation.");
  if (SYSTEM_ACCESS.test(normalized)) throw new SqlValidationError("System schemas and functions are not allowed.");

  let statements: ReturnType<typeof parse>;
  try {
    statements = parse(normalized);
  } catch {
    throw new SqlValidationError("SQL could not be parsed as PostgreSQL.");
  }
  if (statements.length !== 1) throw new SqlValidationError("Exactly one SQL statement is required.");
  const statement = statements[0];
  const withSelect = statement?.type === "with" && typeof statement.in === "object" && statement.in !== null && "type" in statement.in && statement.in.type === "select";
  if (statement?.type !== "select" && !withSelect) {
    throw new SqlValidationError("Only SELECT or WITH/SELECT queries are allowed.");
  }

  const allowed = new Set(Object.keys(model.tables));
  const ctes = new Set<string>();
  for (const match of normalized.matchAll(CTE_REFERENCE)) ctes.add(unquote(match[1]));

  let tableCount = 0;
  for (const match of normalized.matchAll(TABLE_REFERENCE)) {
    tableCount += 1;
    const schema = match[1] ? unquote(match[1]) : null;
    const table = unquote(match[2]);
    if (schema && schema !== "public") throw new SqlValidationError(`Schema '${schema}' is not allowed.`);
    if (!allowed.has(table) && !ctes.has(table)) throw new SqlValidationError(`Unknown table '${table}'.`);
  }
  if (tableCount === 0) throw new SqlValidationError("The query must read from an allowed dataset table.");
  return normalized;
}

export function enforceRowLimit(sql: string, maximum = 200): string {
  const normalized = sql.trim().replace(/;+\s*$/, "");
  const finalLimit = normalized.match(/\blimit\s+(\d+)\s*(?:offset\s+\d+)?\s*$/i);
  if (finalLimit && Number(finalLimit[1]) <= maximum) return normalized;
  return `SELECT * FROM (${normalized}) AS querypilot_result LIMIT ${maximum}`;
}
