import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { QueryResponse } from "@/lib/query/schemas";

let redis: Redis | null | undefined;
let limiter: Ratelimit | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;
  const store = getRedis();
  if (!store) return (limiter = null);
  const requests = Number(process.env.QUERY_RATE_LIMIT ?? "10");
  const window = (process.env.QUERY_RATE_WINDOW ?? "24 h") as Parameters<typeof Ratelimit.fixedWindow>[1];
  limiter = new Ratelimit({
    redis: store,
    limiter: Ratelimit.fixedWindow(Number.isFinite(requests) ? requests : 10, window),
    prefix: "querypilot:rate",
    analytics: true,
  });
  return limiter;
}

export async function checkRateLimit(identifier: string): Promise<{ success: boolean; remaining: number; reset: number }> {
  const rateLimit = getLimiter();
  if (!rateLimit) return { success: true, remaining: 10, reset: Date.now() + 86_400_000 };
  const result = await rateLimit.limit(identifier);
  return { success: result.success, remaining: result.remaining, reset: result.reset };
}

export function normalizeQuestion(question: string): string {
  return question.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
}

export async function getCachedResult(question: string): Promise<QueryResponse | null> {
  const store = getRedis();
  if (!store) return null;
  return store.get<QueryResponse>(`querypilot:cache:ipl:${normalizeQuestion(question)}`);
}

export async function cacheResult(question: string, result: QueryResponse): Promise<void> {
  const store = getRedis();
  if (store) await store.set(`querypilot:cache:ipl:${normalizeQuestion(question)}`, result, { ex: 3600 });
}
