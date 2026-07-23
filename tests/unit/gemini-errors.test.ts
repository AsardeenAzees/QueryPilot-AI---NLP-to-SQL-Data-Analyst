import { describe, expect, it } from "vitest";
import { classifyGeminiFailure } from "@/lib/ai/errors";

describe("Gemini failure classification", () => {
  it.each([
    ["API key is invalid", "configuration"],
    ["404 model gemini-example not found", "configuration"],
    ["429 RESOURCE_EXHAUSTED", "busy"],
    ["JSON parse failed", "invalid_response"],
    ["fetch failed", "unavailable"],
  ] as const)("classifies %s as %s", (message, expected) => {
    expect(classifyGeminiFailure(new Error(message))).toBe(expected);
  });
});
