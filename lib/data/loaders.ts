import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import type { DatasetConfig, SemanticModel } from "./types";

function safeConfigPath(relativePath: string): string {
  const root = process.cwd();
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(root)) throw new Error("Configuration path escapes the project root.");
  return resolved;
}

async function readJson<T>(relativePath: string): Promise<T> {
  return JSON.parse(await readFile(safeConfigPath(relativePath), "utf8")) as T;
}

export const loadDatasetConfig = cache(async (datasetId = "ipl"): Promise<DatasetConfig> =>
  readJson<DatasetConfig>(`config/datasets/${datasetId}.json`),
);

export const loadSemanticModel = cache(async (datasetId = "ipl"): Promise<SemanticModel> => {
  const dataset = await loadDatasetConfig(datasetId);
  return readJson<SemanticModel>(dataset.semanticModel);
});

export function allowedTables(model: SemanticModel): Map<string, Set<string>> {
  return new Map(
    Object.entries(model.tables).map(([table, definition]) => [table, new Set(Object.keys(definition.columns))]),
  );
}
