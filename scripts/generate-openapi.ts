/**
 * Writes the OpenAPI document to `openapi.json` at the repository root.
 *
 * The spec is generated rather than written by hand so that it cannot drift from the endpoint
 * registry in `src/lib/core/api.ts`. The docs site imports the result at build time, which
 * keeps the reference pages in step with the code on every build.
 *
 * Run through `npm run docs:openapi`, which compiles this file and then runs it.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { DEFAULT_ORIGIN, createApi } from "../src/lib/core/api";

const api = createApi({ origin: DEFAULT_ORIGIN });
const response = await api.handle(new Request(`${DEFAULT_ORIGIN}/api/v1/openapi.json`));

if (!response.ok) {
  throw new Error(`Could not build the OpenAPI document: ${response.status}`);
}

const body = `${(await response.text()).trim()}\n`;
// Resolved from the working directory rather than from this file: the compiled copy lives under
// node_modules/.cache, so `import.meta.dirname` would put the output in the wrong place.
const target = resolve(process.cwd(), "openapi.json");
writeFileSync(target, body, "utf8");

const document_ = JSON.parse(body) as { paths: Record<string, unknown> };
const operations = Object.values(document_.paths).reduce(
  (total, item) => total + Object.keys(item as Record<string, unknown>).length,
  0,
);

process.stdout.write(`openapi.json: ${Object.keys(document_.paths).length} paths, ${operations} operations\n`);
