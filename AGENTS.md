# Repository Guidelines

## Project Structure & Module Organization
- pnpm workspace with shared config at the root (`tsconfig.base.json`, `pnpm-workspace.yaml`).
- Packages: `frontend` (React Router under `app/`), `backend` (Hono API in `src/`), `crawler` (scripts writing JSON into `/data`).
- The workspace-level `data/` directory is canonical; keep crawler output versioned so backend queries and frontend loaders stay in sync.

## Build, Test, and Development Commands
- `pnpm install` – install workspace dependencies.
- `pnpm dev` – run frontend and backend watchers; use `pnpm dev:frontend` or `pnpm dev:backend` when isolating one side.
- `pnpm crawl` – regenerate `data/country.json` and `data/unlocode.json` via `packages/crawler/src`.
- `pnpm build` / `pnpm start` – produce and serve compiled assets (`dist/server.js`).
- `pnpm typecheck` – run React Router typegen then `tsc`; add equivalent scripts for new packages.

## Coding Style & Naming Conventions
- TypeScript + ESM, two-space indentation, and double-quoted imports; group imports by external vs internal paths.
- Routes, loaders, and components live together under `packages/frontend/app/routes/*`; mirror existing naming such as `countries.$code.tsx` for nested segments.
- Reuse UI primitives in `app/components/ui/*` and Tailwind utilities before adding bespoke styling.
- Backend modules prefer small, pure helpers in `src/*.ts`; surface logs through `console` only when they provide actionable context.

## Testing Expectations
- No automated suite yet; always run `pnpm typecheck`, hit `/api/search` and key routes locally, and sanity-check DuckDB responses with fresh crawler data.
- New tests should sit next to their code (`__tests__` folders or `.test.ts` files) and ship with a `test` script so they can be executed with `pnpm --filter <package> test`.

## Commit & Pull Request Guidelines
- Follow Conventional Commit prefixes (`feat`, `fix`, `docs`, `refactor`, `chore`) using imperative, ≤72-character subjects.
- Separate behavioural code, generated data, and formatting into distinct commits when feasible.
- PRs must state motivation, list validation (`pnpm crawl`, `pnpm dev`, `pnpm typecheck`, screenshots for UI), and reference issues or spec docs when available.

## Data & Configuration Notes
- Backend defaults to `PORT=3000`; set `BACKEND_URL` in the frontend dev shell when proxying to a remote API.
- Approve DuckDB native builds (`pnpm approve-builds duckdb`) if prompted during setup.
- Re-run `pnpm crawl` before releases or whenever UNECE updates land, and keep the resulting JSON files committed with related changes.
