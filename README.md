# ModelRouterX

ModelRouterX is a source-attributed AI model catalog and intelligence dashboard. It keeps upstream facts separate: OpenRouter catalog and Design Arena values are displayed as reported, Hugging Face downloads and likes are popularity signals, and unsupported benchmark, speed, and latency values remain unavailable rather than being synthesized.

## Stack

- Next.js App Router, React, and JavaScript
- Supabase Postgres for catalog, source status, and append-only history
- OpenRouter and Hugging Face public APIs
- Recharts for visualizations, GSAP for motion, and SWR for periodic client refresh

## Data and environment

The Supabase schema is in `supabase/migrations/`. Server-side reads and ingestion use the project-provided Supabase environment variables. Never expose `SUPABASE_SERVICE_ROLE_KEY` to a browser bundle. The Vercel Cron endpoint also requires a `CRON_SECRET` value configured in the Vercel project environment; the scheduled route is `/api/cron/ingest` and is configured in `vercel.json`.

`.env.example` lists the expected variable names without credentials. Vercel supplies the connected Supabase variables; do not copy production secrets into source control.

## Data sources and interpretation

- OpenRouter's public catalog supplies model IDs, provider namespaces, descriptions, pricing, context limits, modalities, Design Arena ELO/category records, and Artificial Analysis indices when present.
- Hugging Face's public model API supplies model IDs, download/like counts, tags, tasks, and modification timestamps.
- Catalog and popularity records are periodically cached and snapshotted. The user interface labels periodic data and stale fallbacks; it does not present them as real-time telemetry.
- Arena ELO is track-specific and should not be compared across categories. Artificial Analysis values remain external scores. Missing data is shown as `N/A` and is not assigned a zero or used to manufacture an aggregate score.
- The first scheduled ingestion starts historical series; prior history is not fabricated.

## Main routes

`/` overview · `/leaderboard` source-ranked Arena tracks · `/models` searchable catalog · `/models/[id]` model profile · `/compare` side-by-side model comparison · `/pricing` token-cost explorer · `/router` data-backed filters · `/trends` Hugging Face popularity trends · `/history` stored price and ranking captures · `/benchmarks` source availability · `/intelligence` verified catalog changes · `/providers` provider directory · `/about/data` methodology.

## API routes

- `GET /api/models` — OpenRouter catalog with source status and bounded pagination.
- `GET /api/trending` — Hugging Face popularity records.
- `GET /api/history` — stored snapshot records; supports `source=huggingface`, `model`, and `limit` parameters.
- `GET /api/cron/ingest` — authenticated scheduled ingestion; requires the configured cron secret.

## Running and checks

Use the repository's package manager and the `dev`, `test`, and `build` scripts in `package.json`. The test suite covers model normalization, cost calculations, and source-record handling. A production deployment also needs the connected Supabase project and `CRON_SECRET` configured in Vercel. Verify the custom domain's availability and ownership separately before assigning it; no domain is hardcoded into the app.
