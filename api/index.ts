// Imports the pre-bundled Express app (see artifacts/api-server/build.mjs)
// rather than the raw TS source, so Vercel's function builder doesn't have
// to type-check/resolve modules across the workspace on its own.
//
// dist/app.mjs is an ES module. The sibling package.json in this directory
// marks this function as "type": "module" so Vercel compiles/runs it as ESM
// instead of CommonJS -- otherwise a require() of app.mjs fails with
// ERR_REQUIRE_ESM no matter how the import is written.
// @ts-ignore -- dist/app.mjs is plain JS output with no declaration file
export { default } from "../artifacts/api-server/dist/app.mjs";
