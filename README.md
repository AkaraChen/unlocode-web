# UN/LOCODE Monorepo

A pnpm workspace with three packages that together crawl, serve, and surface UN/LOCODE data.

- `@unlocode/crawler` — scripts to scrape UNECE pages and output JSON under `data/`
- `@unlocode/backend` — Hono server exposing `/api/search` backed by DuckDB over the generated JSON
- `@unlocode/frontend` — React Router app whose home loader calls the backend `/api/search` and renders a command dialog UI

## Prerequisites

- Node.js 18+
- pnpm 10+

## Install

```bash
pnpm install
```

## Crawl Data

Generates `data/country.json` and `data/unlocode.json` via the crawler package.

```bash
pnpm crawl
```

Notes:

- Country labels are cleaned to drop trailing bracketed segments.
- Port names use `nameWoDiacritics` for better ASCII searchability.
- Coordinates are parsed from `DDMMN DDDMME` and converted to decimal `[lng, lat]` with two decimals.

## Run Dev Servers

```bash
# Start frontend and backend together
pnpm dev

# Or run individually
pnpm dev:backend
pnpm dev:frontend
```

The backend listens on `http://localhost:3000` by default. The frontend expects the backend to be reachable at `/api/search`; override the origin via `BACKEND_URL` when running the frontend (e.g. `BACKEND_URL=http://api:3000 pnpm dev:frontend`).

## Build & Start

```bash
pnpm build           # runs package builds where defined
pnpm start           # runs the backend (expects prior build if using compiled output)
```

## Packages Overview

### `@unlocode/crawler`

- `pnpm --filter @unlocode/crawler crawl`
- Outputs JSON to the workspace `data/` directory
- Source under `packages/crawler/src/*`

### `@unlocode/backend`

- Hono server (`packages/backend/src/server.ts`)
- Uses DuckDB via `@duckdb/node-api` to query `data/unlocode.json`
- Provides `/healthz`, `/api/search`, `/api/countries/:code`
- `pnpm --filter @unlocode/backend dev`

### `@unlocode/frontend`

- React Router app under `packages/frontend`
- Home route (`app/routes/home.tsx`) 提供搜索入口与产品信息，负责跳转到结果页
- Results route (`app/routes/results.tsx`) 调用后端 `/api/search` 并呈现国家与港口匹配详情
- Country route (`app/routes/countries.$code.tsx`) 调用 `/api/countries/:code` 展示指定国家的港口列表并支持前端筛选
- `pnpm --filter @unlocode/frontend dev`

## Data Location

Crawler output remains at the workspace root `data/` so both backend and frontend can read the JSON files. Set `WORKSPACE_ROOT` if you run scripts from a different working directory.

## Troubleshooting

- Backend returns 500/502:
  - Ensure the crawler has generated `data/unlocode.json`
  - Verify `BACKEND_URL` points to the backend when running the frontend
- DuckDB native build prompts:
  - Run `pnpm approve-builds duckdb` if prompted, then retry.

---

Built with Hono, React Router, DuckDB, and TypeScript in a pnpm monorepo.
