import { afterEach, describe, expect, it } from "vitest";
import { getQueryRateLimit, isQueryRateLimitEnabled } from "@/lib/rate-limit/upstash";

const originalLimit = process.env.QUERY_RATE_LIMIT;
const originalEnabled = process.env.QUERY_RATE_LIMIT_ENABLED;

afterEach(() => {
  if (originalLimit === undefined) delete process.env.QUERY_RATE_LIMIT;
  else process.env.QUERY_RATE_LIMIT = originalLimit;
  if (originalEnabled === undefined) delete process.env.QUERY_RATE_LIMIT_ENABLED;
  else process.env.QUERY_RATE_LIMIT_ENABLED = originalEnabled;
});

describe("query rate-limit configuration", () => {
  it("is enabled by default and disabled only by an explicit false value", () => {
    delete process.env.QUERY_RATE_LIMIT_ENABLED;
    expect(isQueryRateLimitEnabled()).toBe(true);
    process.env.QUERY_RATE_LIMIT_ENABLED = "true";
    expect(isQueryRateLimitEnabled()).toBe(true);
    process.env.QUERY_RATE_LIMIT_ENABLED = "false";
    expect(isQueryRateLimitEnabled()).toBe(false);
    process.env.QUERY_RATE_LIMIT_ENABLED = " FALSE ";
    expect(isQueryRateLimitEnabled()).toBe(false);
  });

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
