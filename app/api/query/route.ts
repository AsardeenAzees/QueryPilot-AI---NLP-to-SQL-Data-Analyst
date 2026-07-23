import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { generateQuery, repairQuery } from "@/lib/ai/gemini";
import { GeminiQueryError } from "@/lib/ai/errors";
import { loadSemanticModel } from "@/lib/data/loaders";
import { executeReadOnlyQuery } from "@/lib/db/neon";
import { cacheResult, checkRateLimit, getCachedResult } from "@/lib/rate-limit/upstash";
import { questionSchema, type GeneratedQuery, type QueryResponse } from "@/lib/query/schemas";
import { createLocalSummary } from "@/lib/query/summary";
import { enforceRowLimit, SqlValidationError, validateSql } from "@/lib/query/sql-validator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ipAddress(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function errorResponse(message: string, status: number, code: string) {
  return NextResponse.json({ error: message, code }, { status });
}

function logServerError(stage: string, error: unknown): void {
  const details = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error";
  console.error(`[QueryPilot:${stage}] ${details}`);
  if (error instanceof Error && error.cause instanceof Error) {
    const safeCause = error.cause.message
      .replace(/(key=)[^&\s]+/gi, "$1[redacted]")
      .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[redacted database URL]");
    console.error(`[QueryPilot:${stage}:cause] ${error.cause.name}: ${safeCause}`);
  }
}

function mockResponse(question: string): QueryResponse {
  const wickets = question.toLowerCase().includes("wicket");
  const columns = wickets ? ["bowler", "wickets"] : ["batter", "sixes"];
  const rows = wickets
    ? [{ bowler: "YS Chahal", wickets: 221 }, { bowler: "DJ Bravo", wickets: 183 }]
    : [{ batter: "CH Gayle", sixes: 359 }, { batter: "RG Sharma", sixes: 281 }];
  return {
    title: wickets ? "IPL wicket leaders" : "IPL six-hitting leaders",
    shortAnswerInstruction: "State the leading player and total.",
    summary: wickets ? "YS Chahal leads with 221 wickets." : "CH Gayle leads with 359 sixes.",
    sql: wickets ? "SELECT bowler, COUNT(*) AS wickets FROM ball_by_ball GROUP BY bowler ORDER BY wickets DESC LIMIT 10" : "SELECT batter, COUNT(*) AS sixes FROM ball_by_ball WHERE batter_runs = 6 GROUP BY batter ORDER BY sixes DESC LIMIT 10",
    chart: { type: "bar", xKey: columns[0], yKey: columns[1] },
    columns,
    rows,
    rowCount: rows.length,
    executionTimeMs: 42.1,
    cached: false,
  };
}

async function executePlan(plan: GeneratedQuery, model: Awaited<ReturnType<typeof loadSemanticModel>>) {
  const safeSql = enforceRowLimit(validateSql(plan.sql, model));
  const result = await executeReadOnlyQuery(safeSql);
  return { plan, safeSql, result };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("The request body must be valid JSON.", 400, "INVALID_JSON");
  }

  const parsedQuestion = questionSchema.safeParse(body);
  if (!parsedQuestion.success) {
    return errorResponse(parsedQuestion.error.issues[0]?.message ?? "Invalid question.", 400, "INVALID_QUESTION");
  }

  const { question } = parsedQuestion.data;
  try {
    let rate;
    try {
      rate = await checkRateLimit(ipAddress(request));
    } catch (error) {
      logServerError("rate-limit", error);
      return errorResponse("Request protection is temporarily unavailable. Please try again shortly.", 503, "RATE_LIMIT_UNAVAILABLE");
    }

    if (!rate.success) {
      return NextResponse.json(
        { error: `You’ve reached today’s ${rate.limit}-question limit. Please try again after the limit resets.`, code: "RATE_LIMITED", reset: rate.reset, limit: rate.limit },
        { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000))) } },
      );
    }

    if (process.env.E2E_MOCK_API === "true") return NextResponse.json(mockResponse(question));
    let cached: QueryResponse | null = null;
    try {
      cached = await getCachedResult(question);
    } catch (error) {
      logServerError("cache-read", error);
    }
    if (cached) return NextResponse.json({ ...cached, cached: true });

    const model = await loadSemanticModel("ipl");
    let plan = await generateQuery(question, model);
    let executed;
    try {
      executed = await executePlan(plan, model);
    } catch (error) {
      if (error instanceof SqlValidationError || process.env.ENABLE_QUERY_REPAIR === "false") throw error;
      const databaseMessage = error instanceof Error ? error.message : "Unknown PostgreSQL error";
      plan = await repairQuery(question, plan.sql, databaseMessage, model);
      executed = await executePlan(plan, model);
    }

    const response: QueryResponse = {
      title: executed.plan.title,
      shortAnswerInstruction: executed.plan.shortAnswerInstruction,
      summary: createLocalSummary(executed.result.rows, executed.result.columns, executed.plan.shortAnswerInstruction),
      sql: executed.safeSql,
      chart: executed.plan.chart,
      columns: executed.result.columns,
      rows: executed.result.rows,
      rowCount: executed.result.rows.length,
      executionTimeMs: executed.result.executionTimeMs,
      cached: false,
    };
    try {
      await cacheResult(question, response);
    } catch (error) {
      logServerError("cache-write", error);
    }
    return NextResponse.json(response, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof GeminiQueryError) {
      logServerError(`gemini-${error.reason}`, error);
      if (error.reason === "configuration") return errorResponse("Gemini is not configured correctly for this deployment. Check the Vercel Production environment variables and redeploy.", 503, "AI_CONFIGURATION");
      if (error.reason === "busy") return errorResponse("The AI service has reached a quota or traffic limit. Please try again later.", 503, "AI_BUSY");
      if (error.reason === "invalid_response") return errorResponse("Gemini returned an answer that could not be validated. Please retry the question.", 502, "AI_INVALID_RESPONSE");
      if (error.reason === "not_answerable") return errorResponse("That question cannot be answered objectively from the IPL dataset. Try asking for a measurable statistic such as runs, wickets, strike rate, or matches won.", 422, "QUESTION_NOT_ANSWERABLE");
      return errorResponse("Gemini is temporarily unavailable. QueryPilot retried once, but the service did not recover. Please try again shortly.", 503, "AI_UNAVAILABLE");
    }
    if (error instanceof ZodError) return errorResponse("Gemini returned an answer that could not be validated. Please retry the question.", 502, "AI_INVALID_RESPONSE");
    if (error instanceof SqlValidationError) return errorResponse("The generated query did not pass security validation.", 422, "UNSAFE_SQL");
    const message = error instanceof Error ? error.message : "Unknown error";
    if (/429|quota|rate.?limit/i.test(message)) return errorResponse("The AI service is busy right now. Please try again shortly.", 503, "AI_BUSY");
    if (/timeout|fetch failed|connection/i.test(message)) return errorResponse("The data service is warming up. Please retry in a moment.", 503, "DATA_UNAVAILABLE");
    logServerError("unexpected", error);
    return errorResponse("An unexpected server error occurred while preparing the answer. Please retry; if it continues, check the Vercel function logs using code QUERY_FAILED.", 500, "QUERY_FAILED");
  }
}
