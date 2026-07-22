import { z } from "zod";

const maliciousPattern = /(?:\b(?:drop|delete|insert|update|alter|truncate|create|copy|grant|revoke|call)\b\s+(?:table|from|into|database|schema|role)?|ignore\s+(?:all\s+)?(?:previous|system)|reveal\s+(?:the\s+)?(?:prompt|secret)|(?:pg_catalog|information_schema)|--|\/\*)/i;

export const questionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(3, "Please enter a question with at least 3 characters.")
    .max(500, "Questions must be 500 characters or fewer.")
    .refine((value) => !maliciousPattern.test(value), "That request cannot be processed safely."),
});

export const chartConfigSchema = z
  .object({
    type: z.enum(["bar", "line", "pie", "scatter", "none"]),
    xKey: z.string().min(1).nullable(),
    yKey: z.string().min(1).nullable(),
  })
  .superRefine((chart, context) => {
    if (chart.type !== "none" && (!chart.xKey || !chart.yKey)) {
      context.addIssue({ code: "custom", message: "Chart axes are required for charted results." });
    }
  });

export const generatedQuerySchema = z.object({
  sql: z.string().trim().min(1),
  title: z.string().trim().min(1).max(120),
  shortAnswerInstruction: z.string().trim().min(1).max(300),
  chart: chartConfigSchema,
});

export type ChartConfig = z.infer<typeof chartConfigSchema>;
export type GeneratedQuery = z.infer<typeof generatedQuerySchema>;

export type QueryValue = string | number | boolean | null;
export type QueryRow = Record<string, QueryValue>;

export interface QueryResponse {
  title: string;
  shortAnswerInstruction: string;
  summary: string;
  sql: string;
  chart: ChartConfig;
  columns: string[];
  rows: QueryRow[];
  rowCount: number;
  executionTimeMs: number;
  cached: boolean;
}
