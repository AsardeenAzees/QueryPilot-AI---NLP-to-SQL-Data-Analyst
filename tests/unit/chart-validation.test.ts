import { describe, expect, it } from "vitest";
import { chartConfigSchema } from "@/lib/query/schemas";

describe("chart configuration", () => {
  it("accepts a complete bar chart and a chart-free answer", () => {
    expect(chartConfigSchema.parse({ type: "bar", xKey: "player", yKey: "sixes" }).type).toBe("bar");
    expect(chartConfigSchema.parse({ type: "none", xKey: null, yKey: null }).type).toBe("none");
  });

  it("rejects missing chart keys and unknown chart types", () => {
    expect(() => chartConfigSchema.parse({ type: "line", xKey: "season", yKey: null })).toThrow();
    expect(() => chartConfigSchema.parse({ type: "radar", xKey: "x", yKey: "y" })).toThrow();
  });
});
