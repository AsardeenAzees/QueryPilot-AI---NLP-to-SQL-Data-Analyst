import { afterEach, describe, expect, it } from "vitest";
import { getQueryRateLimit } from "@/lib/rate-limit/upstash";

const originalLimit = process.env.QUERY_RATE_LIMIT;

afterEach(() => {
  if (originalLimit === undefined) delete process.env.QUERY_RATE_LIMIT;
  else process.env.QUERY_RATE_LIMIT = originalLimit;
});

describe("query rate-limit configuration", () => {
  it("uses the configured positive integer", () => {
    process.env.QUERY_RATE_LIMIT = "20";
    expect(getQueryRateLimit()).toBe(20);
  });

  it.each([undefined, "", "0", "-2", "not-a-number", "4.5"])("defaults to 10 for %s", (value) => {
    if (value === undefined) delete process.env.QUERY_RATE_LIMIT;
    else process.env.QUERY_RATE_LIMIT = value;
    expect(getQueryRateLimit()).toBe(10);
  });
});
