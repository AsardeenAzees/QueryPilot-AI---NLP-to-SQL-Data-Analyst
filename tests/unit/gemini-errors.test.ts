import { describe, expect, it } from "vitest";
import { classifyGeminiFailure, isRetryableGeminiFailure } from "@/lib/ai/errors";

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

  it("retries transient unavailability but not quota exhaustion", () => {
    expect(isRetryableGeminiFailure(new Error("503 service unavailable"))).toBe(true);
    expect(isRetryableGeminiFailure(new Error("fetch failed"))).toBe(true);
    expect(isRetryableGeminiFailure(new Error("429 quota exhausted"))).toBe(false);
  });
});
