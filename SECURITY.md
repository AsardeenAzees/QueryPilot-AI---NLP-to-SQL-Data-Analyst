# Security model

## Trust boundaries

The visitor's question and Gemini's generated JSON/SQL are untrusted. Dataset JSON is version-controlled application configuration. Neon, Gemini, and Upstash secrets exist only in server runtime variables.

## Layered controls

1. Zod limits the question to a trimmed 3–500 character string and rejects obvious prompt-injection/database-command payloads.
2. Upstash limits each forwarded client IP to 10 AI requests per 24 hours.
3. Gemini receives the complete allowlisted semantic model and immutable SQL-generation rules through the system instruction.
4. Zod validates the model's structured output.
5. `pgsql-ast-parser` must parse exactly one SELECT AST. WITH is allowed only because its parsed final statement is SELECT.
6. Independent checks reject comments, write/DDL/transaction commands, system schemas/functions, non-public schemas, and tables outside the semantic model. CTE names are scoped exceptions to the table allowlist.
7. A wrapper enforces at most 200 returned rows even if model SQL asks for more.
8. The Neon runtime credential belongs to a dedicated role with SELECT only, default read-only transactions, and a five-second statement timeout.
9. A failed database query may be repaired once, after which every validation layer runs again. Validation failures are never repaired or executed.
10. CSV exports neutralize spreadsheet-formula prefixes.

## Operational guidance

- Rotate any credential that reaches source control, logs, screenshots, or a browser bundle.
- Trust `x-forwarded-for` only behind Vercel or another configured reverse proxy.
- Review semantic and dataset configuration changes like code.
- Monitor Gemini, Upstash, Vercel, and Neon usage/error dashboards.
- Apply PostgreSQL security updates and dependency updates promptly.
- Avoid logging complete database errors in user responses; the route returns generic messages.

## Limitations

Static SQL validation reduces risk but is not a substitute for database least privilege. IP rate limiting can group visitors behind shared NAT and can be evaded through distributed sources. Public aggregate results must contain only data licensed and appropriate for public disclosure.
