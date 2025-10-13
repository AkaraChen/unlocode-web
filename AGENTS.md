# Repository Guidelines

## Project Structure & Module Organization
- pnpm workspace rooted here; shared config lives in `tsconfig.base.json` and `pnpm-workspace.yaml`.
- Packages: `packages/frontend` (React Router app under `app/`), `packages/backend` (Hono API in `src/`), `packages/crawler` (data scripts in `src/`).
- Canonical JSON lives in workspace `data/`; crawler writes `country.json` and `unlocode.json` that backend queries and frontend loaders consume.
- Co-locate routes, loaders, and components under `packages/frontend/app/routes/*`; UI primitives in `app/components/ui/*`.

## Build, Test, and Development Commands
- `pnpm install` — installs workspace dependencies and prepares DuckDB builds when prompted.
- `pnpm dev` — runs frontend and backend watchers together; use `pnpm dev:frontend` or `pnpm dev:backend` to isolate.
- `pnpm crawl` — regenerates `data/country.json` and `data/unlocode.json` via the crawler scripts.
- `pnpm build` then `pnpm start` — compiles to `dist/` and serves `dist/server.js` for production checks.
- `pnpm typecheck` — runs React Router typegen followed by `tsc` against the workspace.

## Coding Style & Naming Conventions
- TypeScript + ESM, two-space indentation, and double-quoted import specifiers.
- Group imports: external packages first, then internal paths.
- Frontend route files follow patterns like `countries.$code.tsx`; keep loaders and components alongside the route.
- Reuse Tailwind utilities and `app/components/ui/*` primitives before adding bespoke styling.
- Backend favors small pure helpers in `src/*.ts`; log only when it adds actionable context.

## Testing Guidelines
- No automated suite yet; always run `pnpm typecheck`, hit `/api/search`, and exercise key frontend routes manually.
- When adding tests, place them next to the source (`__tests__/` or `.test.ts`) and add a `test` script scoped with `pnpm --filter <package> test`.
- Validate DuckDB queries after running `pnpm crawl` to ensure data and API remain in sync.

## Commit & Pull Request Guidelines
- Use Conventional Commit prefixes (`feat`, `fix`, `docs`, `refactor`, `chore`) with imperative subjects ≤72 chars.
- Separate behavioural changes, generated data, and formatting into distinct commits where possible.
- PRs should state motivation, list validation steps (`pnpm crawl`, `pnpm dev`, `pnpm typecheck`, screenshots for UI), and reference issues or specs when available.

## Data & Configuration Tips
- Backend binds to `PORT=3000`; set `BACKEND_URL` when proxying the frontend to a remote API.
- Accept DuckDB native build prompts via `pnpm approve-builds duckdb` during setup.
- Re-run `pnpm crawl` whenever UNECE releases updates and commit the refreshed JSON alongside related code.
