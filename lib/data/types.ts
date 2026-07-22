export interface DatasetFileConfig {
  path: string;
  table: string;
  encoding: "utf8" | "win1252";
  conflictColumns: string[];
  columns: Record<string, string[]>;
}

export interface DatasetConfig {
  id: string;
  name: string;
  description: string;
  public: boolean;
  semanticModel: string;
  files: DatasetFileConfig[];
}

export interface SemanticModel {
  dataset: { id: string; name: string; description: string };
  tables: Record<string, { description: string; columns: Record<string, string> }>;
  relationships: Array<Record<string, string>>;
  synonyms: Record<string, string[]>;
  businessCalculations: Record<string, string>;
  verifiedExamples: Array<Record<string, unknown>>;
  sqlRules: string[];
}
