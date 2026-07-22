import { describe, expect, it } from "vitest";
import semanticModel from "@/config/semantic/ipl.json";
import { loadSemanticModel } from "@/lib/data/loaders";

describe("IPL semantic model", () => {
  it("loads the configured model", async () => {
    const model = await loadSemanticModel("ipl");
    expect(model.dataset.id).toBe("ipl");
    expect(Object.keys(model.tables)).toEqual(expect.arrayContaining(["ball_by_ball", "ipl_match"]));
  });

  it("contains the verified leaders and cricket definitions", () => {
    const serialized = JSON.stringify(semanticModel);
    expect(serialized).toContain('"batter":"CH Gayle","sixes":359');
    expect(serialized).toContain('"bowler":"YS Chahal","wickets":221');
    expect(semanticModel.businessCalculations.six).toContain("batter_runs = 6");
    expect(semanticModel.businessCalculations.dot_ball).toContain("total_runs = 0");
  });
});
