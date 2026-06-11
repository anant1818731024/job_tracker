# JobTracker

A job application tracker to manage your job search — track applications, view a Kanban board, and get follow-up reminders.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/job-tracker run dev` — run the frontend (port 24486)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: Vite + React + Tailwind CSS v4 + wouter (routing)
- API: Express 5 + express-session (cookie-based auth)
- DB: PostgreSQL + Drizzle ORM
- Auth: Custom credentials (bcryptjs password hashing, express-session)
- Drag & drop: @hello-pangea/dnd (Kanban board)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/job-tracker/` — React + Vite frontend
- `artifacts/api-server/` — Express backend
- `lib/db/src/schema/` — Drizzle schema (users, applications, status_history)
- `lib/api-spec/openapi.yaml` — OpenAPI source of truth
- `lib/api-client-react/` — generated React Query hooks
- `lib/api-zod/` — generated Zod schemas

## Architecture decisions

- Session-based auth (express-session + bcryptjs) — straightforward credentials auth without JWT complexity
- `@hello-pangea/dnd` for Kanban drag-and-drop (maintained fork of react-beautiful-dnd)
- `bcryptjs` must be in `external` list in `artifacts/api-server/build.mjs` — esbuild can't bundle it
- Dashboard stats endpoint (`GET /api/applications/dashboard`) returns pre-computed stats to avoid N+1 queries
- Wouter used for client-side routing (already in scaffold, lighter than react-router)

## Product

- **Login / Register** — credential-based auth with session cookies
- **Dashboard** — stats overview, recent applications, status breakdown chart, follow-up reminders
- **Applications list** — sortable, filterable table with CSV export
- **Application detail** — full info + status history timeline
- **New / Edit application** — form with company, role, location, salary, URL, notes
- **Kanban board** — drag-and-drop between APPLIED → SCREENING → INTERVIEW → OFFER → REJECTED columns

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `bcryptjs` must be in the `external` list in `artifacts/api-server/build.mjs` or esbuild fails to bundle it
- Clear `artifacts/job-tracker/node_modules/.vite` if you hit React hook errors after adding new deps
- API routes use `req.session.userId` for auth — session middleware must be registered before routes in `app.ts`
- Drizzle `updatedAt` fields require manual `.set({ updatedAt: new Date() })` on PATCH — no auto-update trigger

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
