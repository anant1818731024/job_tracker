---
name: JobTracker migration notes
description: Gotchas from porting this Next.js app to the Replit pnpm_workspace stack
---

# JobTracker migration gotchas

**Why:** These tripped up during the Vercel→Replit migration and are non-obvious from the code.

## bcryptjs + esbuild

`bcryptjs` must be added to the `external` list in `artifacts/api-server/build.mjs`. Without it, esbuild fails with "Could not resolve bcryptjs" even when the package is installed.

**How to apply:** Any time a new native-ish npm package is added to the API server, check if it needs to be externalized in `build.mjs`.

## React hook error after adding deps

If you see "Cannot read properties of null (reading 'useState')" after adding a new frontend dependency, clear the vite cache: `rm -rf artifacts/job-tracker/node_modules/.vite` then restart the workflow.

## Session auth pattern

Auth uses `express-session` with `req.session.userId`. Session middleware must be registered BEFORE routes in `app.ts`. The `SESSION_SECRET` env var should be set in production — dev uses a default fallback.

## Drizzle updatedAt

Drizzle does NOT auto-update `updatedAt` on PATCH. Must manually `.set({ updatedAt: new Date() })` in update queries.
