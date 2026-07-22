import { describe, expect, it } from "vitest";
import semanticModelJson from "@/config/semantic/ipl.json";
import type { SemanticModel } from "@/lib/data/types";
import { enforceRowLimit, validateSql } from "@/lib/query/sql-validator";

const model = semanticModelJson as SemanticModel;

describe("SQL AST security validation", () => {
  it("accepts a SELECT query", () => {
    expect(validateSql("SELECT batter, COUNT(*) FROM ball_by_ball GROUP BY batter", model)).toContain("SELECT");
  });

  it("accepts a WITH/SELECT query", () => {
    expect(validateSql("WITH totals AS (SELECT batter, COUNT(*) n FROM ball_by_ball GROUP BY batter) SELECT * FROM totals", model)).toContain("WITH");
  });

  it("rejects multiple statements", () => {
    expect(() => validateSql("SELECT * FROM teams; SELECT * FROM ipl_match", model)).toThrow("Exactly one");
  });

  it.each([
    ["DELETE", "DELETE FROM teams"],
    ["DROP", "DROP TABLE teams"],
  ])("rejects %s", (_, sql) => expect(() => validateSql(sql, model)).toThrow());

  it("rejects unknown tables and system schemas", () => {
    expect(() => validateSql("SELECT * FROM payments", model)).toThrow("Unknown table");
    expect(() => validateSql("SELECT * FROM pg_catalog.pg_tables", model)).toThrow();
  });

  it("enforces no more than 200 rows", () => {
    expect(enforceRowLimit("SELECT * FROM teams")).toContain("LIMIT 200");
    expect(enforceRowLimit("SELECT * FROM teams LIMIT 10")).toBe("SELECT * FROM teams LIMIT 10");
    expect(enforceRowLimit("SELECT * FROM teams LIMIT 500")).toBe("SELECT * FROM (SELECT * FROM teams LIMIT 500) AS querypilot_result LIMIT 200");
  });
});
