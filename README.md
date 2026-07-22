# QueryPilot AI — Natural Language Data Analyst

QueryPilot AI is a public, login-free NLP-to-SQL portfolio application for exploring IPL cricket data. A visitor asks a question in ordinary English; Gemini proposes one PostgreSQL query, the server parses and validates it, a read-only Neon role executes it, and the dashboard presents a local factual summary, table, chart, SQL, and CSV download.

## Architecture

```mermaid
flowchart LR
  U["User question"] --> A["POST /api/query"]
  A --> R["Upstash IP rate limit"]
  R --> C{"1-hour cache hit?"}
  C -- Yes --> UI["Dashboard result"]
  C -- No --> S["IPL semantic model"]
  S --> G["Gemini structured output"]
  G --> V["PostgreSQL AST + allowlist validation"]
  V --> N["Read-only Neon query\n5s timeout · 200 rows"]
  N -->|success| L["Local summary + chart contract"]
  N -->|database error, once| P["Gemini repair"]
  P --> V
  L --> C
  C --> UI
```

The browser never receives database, Gemini, or Upstash credentials. There is no separate API service: all server behavior lives in Next.js App Router Route Handlers.

## Features

- Strict structured Gemini output with `GEMINI_MODEL` configuration and temperature `0.1`
- Dataset-driven CSV configuration and semantic modelling
- UTF-8 ball data plus CP1252 player-name normalization to UTF-8
- PostgreSQL AST validation, table allowlisting, forbidden-operation checks, single-statement enforcement, and a hard 200-row result cap
- Neon read-only database role and five-second statement timeout
- Upstash fixed-window rate limiting (10 questions/IP/24 hours) and one-hour public IPL cache
- Responsive accessible dashboard, Recharts visualisation, SQL disclosure, CSV export, and localStorage history
- Vitest, Playwright, verified IPL facts, GitHub Actions, and Vercel-ready configuration

## Quick start

Requirements: Node.js 22+, npm, a Neon PostgreSQL project, a Gemini API key, and optionally Upstash Redis.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Configure the database and import data before asking live questions. See [docs/SETUP.md](docs/SETUP.md).

## Dataset inputs

Place these files in `data/source/` (they are ignored by Git):

- `BALL_BY_BALL.csv` — UTF-8
- `IPL_MATCH.csv`
- `PLAYER_INFO.csv` — Windows-1252/CP1252
- `TEAMS.csv`
- the original IPL semantic YAML, retained as source documentation

The runnable semantic contract is `config/semantic/ipl.json`. Header aliases live in `config/datasets/ipl.json`; update those aliases if the supplied CSV headers differ. The importer reports missing required headers rather than silently creating bad rows.

```bash
npm run data:import
```

Import is explicit and is never part of `npm run build` or a Vercel build. It inserts in transport-safe batches of up to 1,000 rows and uses `ON CONFLICT DO NOTHING`, so reruns are idempotent.

The supplied source has one known cross-file identifier mismatch: delivery match ID `1473495` has no identical parent ID in `IPL_MATCH.csv`. Migration `003_drop_unreliable_ball_match_fk.sql` therefore removes that unreliable foreign key while preserving the delivery primary key, source value, and join indexes.

## Example questions

- Who hit the most sixes?
- Who took the most wickets?
- Which team won the most matches?
- Compare Virat Kohli and MS Dhoni.
- Which venues hosted the most matches?

Verified expectations for the supplied dataset:

- Most sixes: **CH Gayle — 359**
- Most bowler wickets, excluding run out, retired hurt, retired out, and obstructing the field: **YS Chahal — 221**

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start local Next.js development |
| `npm run data:import` | Import the configured IPL CSV files |
| `npm run typecheck` | Run strict TypeScript checks |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest unit and contract tests |
| `npm run test:e2e` | Run Playwright browser tests |
| `npm run build` | Create the production build |

## Security boundary

Model output is untrusted. QueryPilot rejects comments, multiple statements, non-SELECT AST nodes, unknown tables, non-public schemas, system catalogs, file/network helpers, extensions, transactions, and write/DDL commands. Accepted SQL is capped externally at 200 rows before execution. The application connection should use only `CONNECT`, `USAGE`, and `SELECT`, with `default_transaction_read_only=on` and `statement_timeout=5s`. See [SECURITY.md](SECURITY.md).

## Screenshots

> Add final deployed screenshots here:
>
> - Desktop question and result dashboard
> - Mobile dashboard
> - Generated SQL panel

## Portfolio copy

### CV

**QueryPilot AI — Natural Language Data Analyst:** Built a secure, public NLP-to-SQL analytics dashboard using Next.js, TypeScript, Gemini, Neon PostgreSQL, and Upstash. Designed a reusable semantic modelling and CSV ingestion pipeline, AST-based SQL safety controls, read-only execution, caching/rate limiting, Recharts visualisations, and automated Vitest/Playwright CI.

### LinkedIn

I built QueryPilot AI, a production-minded natural-language data analyst for IPL cricket. Users ask ordinary questions and receive evidence-backed tables and charts, while a semantic layer grounds Gemini in the real schema. Every generated PostgreSQL statement is treated as untrusted: it must pass AST validation and table allowlisting before a read-only Neon role can execute it with strict time and row limits. The project also includes encoding-aware, idempotent CSV ingestion; Upstash caching and abuse controls; accessible responsive UI; and full unit, browser, build, and CI coverage.

## License

Portfolio and educational use. Confirm the license of the IPL source dataset before republishing its raw files.
