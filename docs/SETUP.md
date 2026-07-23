# Setup and deployment guide

## 1. Neon PostgreSQL

1. Create a Neon project and database (the default database is usually `neondb`).
2. Copy the owner connection string to `DATABASE_ADMIN_URL` in `.env.local`.
3. Run the numbered files in `db/migrations/` in order in the Neon SQL Editor or with `psql`.
4. Edit `db/migrations/002_readonly_role.sql`: replace the placeholder password and, if necessary, the database name. Run it as the owner.
5. Create a connection string for `querypilot_reader` and save it as `DATABASE_URL`.
6. Confirm the role cannot write:

   ```sql
   SET ROLE querypilot_reader;
   SELECT COUNT(*) FROM ipl_match;
   -- This must fail:
   DELETE FROM ipl_match;
   ```

Use pooled Neon connection strings for the deployed serverless application. Keep the owner connection string only in a trusted local import environment; it is not needed by the running website.

## 2. Gemini API

1. Create an API key in Google AI Studio.
2. Set `GEMINI_API_KEY` in `.env.local`.
3. Set `GEMINI_MODEL=gemini-3.5-flash`. Changing models requires no code update.
4. Never create a `NEXT_PUBLIC_GEMINI_API_KEY`; that would expose the key to browsers.

The route requests JSON structured output at temperature `0.1`. It uses one optional repair attempt only after a database execution error; unsafe generated SQL is rejected without repair.

## 3. Upstash Redis

Create a Redis database and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. The default policy is 10 requests per IP in a fixed 24-hour window. Successful normalized public IPL answers are cached for one hour. In local development, missing Upstash variables disable the cache and rate limiter.

## 4. CSV import

Put all four CSVs in `data/source/`. Keep the supplied YAML there for provenance. The generic dataset manifest defines filename, encoding, destination table, conflict key, and header aliases.

Run:

```bash
npm run data:import
```

`PLAYER_INFO.csv` is decoded as Windows-1252 and normalized to Unicode NFC before insertion. Common null markers become SQL `NULL`; supported Boolean/date/numeric columns are parsed; records are inserted in safe batches. A rerun skips existing primary keys. Imported row counts report only newly inserted rows.

To add a future dataset, create `config/datasets/<id>.json`, `config/semantic/<id>.json`, migrations for its canonical schema, and run `npm run data:import -- <id>`. Public file upload is intentionally unsupported.

## 5. Local development and QA

```bash
npm install
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Playwright starts the app with deterministic mock query results; it does not spend Gemini quota or require production credentials. Live API behavior should also be smoke-tested with a configured `.env.local`.

## 6. Vercel deployment

1. Push the repository to GitHub and import it in Vercel as a Next.js project.
2. Add `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` to Production and Preview environments.
3. Do **not** add `DATABASE_ADMIN_URL` to Vercel.
4. In Vercel, confirm each variable is enabled for **Production** (not only Development or Preview), has no surrounding quotes or trailing spaces, and then redeploy. Environment changes do not modify an already-running deployment.
5. Test `/api/overview` first, then submit a new, uncached question. If overview works but questions fail, inspect **Project > Deployments > Functions > `/api/query`**; the API returns separate safe codes for Gemini configuration, Gemini availability, Upstash rate limiting, SQL validation, and Neon availability.
6. Keep the default build command `npm run build`. CSV import is deliberately not connected to the build.
7. Deploy, then test an example question and verify that the SQL panel contains a SELECT-only bounded query.
8. Add the production domain to portfolio links and capture the screenshot placeholders in the README.

GitHub Actions runs type checking, lint, unit tests, the production build, and Chromium tests on pushes and pull requests.
