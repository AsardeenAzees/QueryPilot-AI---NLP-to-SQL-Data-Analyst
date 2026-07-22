import { access, readFile } from "node:fs/promises";
import path from "node:path";
import iconv from "iconv-lite";
import { parse } from "csv-parse";
import { neon } from "@neondatabase/serverless";
import { loadEnvConfig } from "@next/env";
import type { DatasetConfig, DatasetFileConfig } from "../../lib/data/types";

type CsvRow = Record<string, string | undefined>;
type ImportValue = string | number | boolean | null;

const NULL_VALUES = new Set(["", "null", "n/a", "na", "none", "undefined", "\\n"]);
const BOOLEAN_COLUMNS = new Set(["is_umpire", "is_wicket"]);
const DATE_COLUMNS = new Set(["date_of_birth", "match_date"]);
const NUMBER_COLUMNS = new Set([
  "team_id", "player_id", "match_id", "season_id", "innings_no", "over_no", "ball_no", "result_margin",
  "batter_runs", "extra_runs", "total_runs", "wides", "no_balls", "byes", "leg_byes", "penalty_runs",
]);
const REQUIRED_BY_TABLE: Record<string, string[]> = {
  teams: ["team_id", "team_name"],
  player_info: ["player_id", "player_name"],
  ipl_match: ["match_id", "season_id", "team1", "team2"],
  ball_by_ball: ["match_id", "season_id", "innings_no", "over_no", "ball_no", "batter", "bowler", "team_batting", "team_bowling"],
};

function identifier(value: string): string {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) throw new Error(`Unsafe SQL identifier in dataset config: ${value}`);
  return `"${value}"`;
}

function parseDate(value: string): string | null {
  const dayFirst = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dayFirst) {
    const [, day, month, year] = dayFirst;
    const candidate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const parsed = new Date(`${candidate}T00:00:00Z`);
    return Number.isNaN(parsed.valueOf()) ? null : candidate;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return null;
  return parsed.toISOString().slice(0, 10);
}

function convert(column: string, raw: string | undefined): ImportValue {
  if (raw === undefined) return null;
  const value = raw.trim();
  if (NULL_VALUES.has(value.toLowerCase())) return null;
  if (BOOLEAN_COLUMNS.has(column)) {
    if (/^(?:true|t|yes|y|1)$/i.test(value)) return true;
    if (/^(?:false|f|no|n|0)$/i.test(value)) return false;
    return null;
  }
  if (DATE_COLUMNS.has(column)) return parseDate(value);
  if (NUMBER_COLUMNS.has(column)) {
    const number = Number(value.replaceAll(",", ""));
    return Number.isFinite(number) ? number : null;
  }
  return value.normalize("NFC");
}

function resolveHeaders(headers: string[], config: DatasetFileConfig): Record<string, string> {
  const lookup = new Map(headers.map((header) => [header.trim().toLowerCase(), header]));
  const resolved: Record<string, string> = {};
  for (const [target, aliases] of Object.entries(config.columns)) {
    const source = aliases.map((alias) => lookup.get(alias.toLowerCase())).find(Boolean);
    if (source) resolved[target] = source;
  }
  const missing = (REQUIRED_BY_TABLE[config.table] ?? []).filter((column) => !resolved[column]);
  if (missing.length > 0) {
    throw new Error(`${config.path} is missing required columns: ${missing.join(", ")}. Found headers: ${headers.join(", ")}`);
  }
  return resolved;
}

async function csvText(config: DatasetFileConfig): Promise<string> {
  const absolute = path.resolve(process.cwd(), config.path);
  if (config.encoding === "win1252") return iconv.decode(await readFile(absolute), "win1252");
  return readFile(absolute, "utf8");
}

async function importFile(config: DatasetFileConfig, databaseUrl: string): Promise<number> {
  const text = await csvText(config);
  const parser = parse(text, { columns: true, bom: true, skip_empty_lines: true, relax_column_count: false, trim: false });
  const sql = neon(databaseUrl);
  let mapping: Record<string, string> | null = null;
  let columns: string[] = [];
  let batch: ImportValue[][] = [];
  let batchSize = 500;
  let imported = 0;

  async function flush(): Promise<void> {
    if (batch.length === 0) return;
    const values = batch.flat();
    const tuples = batch.map((_, rowIndex) =>
      `(${columns.map((__, columnIndex) => `$${rowIndex * columns.length + columnIndex + 1}`).join(", ")})`,
    );
    const conflict = config.conflictColumns.map(identifier).join(", ");
    const statement = `INSERT INTO ${identifier(config.table)} (${columns.map(identifier).join(", ")}) VALUES ${tuples.join(", ")} ON CONFLICT (${conflict}) DO NOTHING RETURNING 1`;
    const result = await sql.query(statement, values);
    imported += result.length;
    batch = [];
  }

  for await (const record of parser as AsyncIterable<CsvRow>) {
    if (!mapping) {
      mapping = resolveHeaders(Object.keys(record), config);
      columns = Object.keys(mapping);
      batchSize = Math.max(1, Math.min(1_000, Math.floor(30_000 / columns.length)));
    }
    const converted = columns.map((column) => convert(column, record[mapping?.[column] ?? ""]));
    const valueFor = (column: string) => converted[columns.indexOf(column)];
    if (config.table === "ball_by_ball" && valueFor("total_runs") === null) {
      const index = columns.indexOf("total_runs");
      if (index >= 0) converted[index] = Number(valueFor("batter_runs") ?? 0) + Number(valueFor("extra_runs") ?? 0);
    }
    batch.push(converted);
    if (batch.length >= batchSize) await flush();
  }
  await flush();
  return imported;
}

async function main(): Promise<void> {
  loadEnvConfig(process.cwd());
  const databaseUrl = process.env.DATABASE_ADMIN_URL;
  if (!databaseUrl) throw new Error("DATABASE_ADMIN_URL is required for data import.");
  const datasetId = process.argv[2] ?? "ipl";
  const configPath = path.resolve(process.cwd(), `config/datasets/${datasetId}.json`);
  const config = JSON.parse(await readFile(configPath, "utf8")) as DatasetConfig;

  const missing: string[] = [];
  for (const file of config.files) {
    try { await access(path.resolve(process.cwd(), file.path)); } catch { missing.push(file.path); }
  }
  if (missing.length > 0) throw new Error(`Missing dataset files:\n- ${missing.join("\n- ")}`);

  console.log(`Importing ${config.name}...`);
  for (const file of config.files) {
    const imported = await importFile(file, databaseUrl);
    console.log(`${file.table}: ${imported.toLocaleString()} new rows imported`);
  }
  console.log("Import complete. Existing primary-key records were left unchanged.");
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
