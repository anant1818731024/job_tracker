// Imports the pre-bundled Express app (see artifacts/api-server/build.mjs)
// rather than the raw TS source, so Vercel's function builder doesn't have
// to type-check/resolve modules across the workspace on its own.
//
// Vercel compiles this file to CommonJS, but dist/app.mjs is an ES module, so
// a static import/export-from gets transpiled to a require() that can't load
// it (ERR_REQUIRE_ESM). A dynamic import() is valid from CJS and avoids that.
//
// Vercel type-checks this file in isolation, without @types/node or a
// declaration file for dist/app.mjs available, so req/res and the import
// stay untyped here.
let appPromise: Promise<any> | null = null;

export default async function handler(req: any, res: any) {
  // @ts-ignore -- dist/app.mjs is plain JS output with no declaration file
  appPromise ??= import("../artifacts/api-server/dist/app.mjs").then((m) => m.default);
  const app = await appPromise;
  return app(req, res);
}
