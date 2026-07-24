// Imports the pre-bundled Express app (see artifacts/api-server/build.mjs)
// rather than the raw TS source, so Vercel's function builder doesn't have
// to type-check/resolve modules across the workspace on its own.
//
// Vercel compiles this file to CommonJS, but dist/app.mjs is an ES module, so
// a static import/export-from gets transpiled to a require() that can't load
// it (ERR_REQUIRE_ESM). A dynamic import() is valid from CJS and avoids that.
import type { IncomingMessage, ServerResponse } from "node:http";

let appPromise: Promise<(req: IncomingMessage, res: ServerResponse) => void> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  appPromise ??= import("../artifacts/api-server/dist/app.mjs").then((m) => m.default);
  const app = await appPromise;
  return app(req, res);
}
