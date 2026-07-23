// Imports the pre-bundled Express app (see artifacts/api-server/build.mjs)
// rather than the raw TS source, so Vercel's function builder doesn't have
// to type-check/resolve modules across the workspace on its own.
// @ts-ignore -- dist/app.mjs is plain JS output with no declaration file
export { default } from "../artifacts/api-server/dist/app.mjs";
