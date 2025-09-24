# UN/LOCODE Web

A small web app to crawl and search UN/LOCODE data with a minimal UI.

- Crawler scrapes UNECE pages and produces structured JSON
- Server-side search via DuckDB over the generated JSON
- Simple centered command palette UI (shadcn/ui) with countries and ports

## Overview

This repo has two parts:

- Crawler (TypeScript/Node)
  - `crawler/country-list.ts`: scrapes country index and links
  - `crawler/country.ts`: scrapes per-country LOCODE table rows
    - Coordinates parsed to GeoJSON `[lng, lat]` in decimal degrees, rounded to 2 decimals
    - Robust table selection and cleanup
  - `crawler/index.ts`: orchestrates crawl and writes JSON to `data/`
  - Output format: `data/unlocode.json` is `Array<Country>` as defined in `crawler/types.ts`
    - Country `{ code, name, ports }`
    - Port `{ locode, name }` where `name` uses `nameWoDiacritics`

- Web app (React Router + shadcn/ui + TanStack Query)
  - Server search API `app/routes/api.search.ts` calls DuckDB to query JSON
  - Centered command dialog at `/` with a search input
  - Shows top country and port matches (no click behavior by design)

## Prerequisites

- Node.js 18+
- pnpm 10+

## Install

```bash
pnpm install

# If prompted, approve DuckDB native build
pnpm approve-builds duckdb
```

## Crawl Data

Generates `data/country.json` and `data/unlocode.json`.

```bash
pnpm crawl
```

Notes:

- Country labels are cleaned to drop trailing bracketed segments, e.g. `United States [A to E] ...` -> `United States`.
- Port names use `nameWoDiacritics` for better ASCII searchability.
- Coordinates are parsed from `DDMMN DDDMME` and converted to decimal `[lng, lat]` with two decimals.

## Run Dev Server

```bash
pnpm dev
```

Open `http://localhost:5173`. The home page displays a centered command dialog. Typing triggers a query to `/api/search?q=...`.

## Server-side Search (DuckDB)

- Located in `app/server/search.server.ts` (server-only, not bundled to client)
- Uses `@duckdb/node-api` and `read_json_auto` to query `data/unlocode.json`
- Ports are unnested with `UNNEST(ports)` and accessed via `struct_extract(..., 'field')`
- Query prioritizes:
  1) Ports whose name matches the query
  2) Ports belonging to countries that match the query

If you see binder errors about prepared statements, note that DDL cannot be prepared. Paths are inlined in the `CREATE VIEW` statement.

## UI

- shadcn/ui components: command, dialog, input, popover (the UI currently uses command dialog only)
- Centered modal shows two groups: Countries and Ports
- No click actions; this is intentionally simple

## Build & Start

```bash
pnpm build
pnpm start
```

## Project Structure

```
crawler/
  country-list.ts   # scrape index of countries + links
  country.ts        # scrape country LOCODE rows; parse coords -> [lng, lat]
  index.ts          # orchestrate crawl, write data/*.json
  types.ts          # shared data types for crawl output
app/
  routes/
    home.tsx        # centered command dialog search UI
    api.search.ts   # JSON API for search
  server/
    search.server.ts# DuckDB-backed search (server-only)
data/
  country.json      # raw country list with links (for debugging/inspection)
  unlocode.json     # Country[] used by the app
```

## Troubleshooting

- DuckDB build skipped:
  - Run `pnpm approve-builds duckdb` and re-run.
- No results after search:
  - Ensure `pnpm crawl` generated `data/unlocode.json` and it exists.
- Want to adjust search behavior:
  - Tweak ORDER BY in `app/server/search.server.ts` to reprioritize ranking.

---

Built with React Router, shadcn/ui, DuckDB, and TypeScript.
