export type GeminiFailureReason = "configuration" | "busy" | "invalid_response" | "unavailable";

export class GeminiQueryError extends Error {
  constructor(
    public readonly reason: GeminiFailureReason,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "GeminiQueryError";
  }
}

export function classifyGeminiFailure(error: unknown): GeminiFailureReason {
  const message = error instanceof Error ? error.message : String(error);

  if (/401|403|api.?key|permission.?denied|unauthenticated/i.test(message)) return "configuration";
  if (/404|model.+not found|not found.+model|unsupported model/i.test(message)) return "configuration";
  if (/429|quota|rate.?limit|resource.?exhausted/i.test(message)) return "busy";
  if (/json|schema|parse|empty response|invalid response/i.test(message)) return "invalid_response";
  return "unavailable";
}
