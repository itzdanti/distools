import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { deployOrigin, parseDistoolsConfig } from "../../src/lib/core/config";

/**
 * Checks the files a deploy would actually publish.
 *
 * The build succeeds or it does not; what this adds is the layer above that. A typo in
 * `public/CNAME`, a discovery document that quietly serialised to `{}`, a Shiki grammar set that
 * crept back to hundreds of files, or a `404.html` that no longer mirrors `index.html` are all
 * things a green `vite build` will happily ship. These are the guards for that.
 *
 * Requires `dist/` to exist, which `npm run tests` arranges by building first.
 */
const ROOT = process.cwd();
const DIST = resolve(ROOT, "dist");

function read(relative: string): string {
  return readFileSync(resolve(DIST, relative), "utf8");
}

function readJson<T = unknown>(relative: string): T {
  return JSON.parse(read(relative)) as T;
}

function exists(relative: string): boolean {
  try {
    return statSync(resolve(DIST, relative)).isFile();
  } catch {
    return false;
  }
}

const failures: string[] = [];
let passed = 0;

function check(label: string, run: () => void): void {
  try {
    run();
    passed += 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${label}: ${message}`);
    process.stdout.write(`FAIL ${label}\n      ${message}\n`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

check("dist exists", () => {
  assert(exists("index.html"), "dist/index.html is missing; run the build first");
});

if (!exists("index.html")) {
  process.stdout.write("nothing to check without a build\n");
  process.exitCode = 1;
} else {
  const spec = readJson<{ openapi: string; paths: Record<string, unknown> }>("api/v1/openapi.json");
  const rootSpec = readJson<{ openapi: string; paths: Record<string, unknown> }>("openapi.json");
  const index = readJson<{ groups?: unknown[] }>("api/v1/index.json");
  const tools = readJson<{ tools?: Record<string, unknown> }>("api/v1/tools.json");
  const health = readJson<{ status?: string }>("api/v1/health.json");

  check("openapi version", () => assert(spec.openapi === "3.1.0", `got ${spec.openapi}`));
  check("openapi covers all 53 endpoints", () => {
    const count = Object.keys(spec.paths).length;
    assert(count === 53, `expected 53 paths, found ${count}`);
  });
  check("root openapi matches the api copy", () => {
    assert(
      JSON.stringify(spec) === JSON.stringify(rootSpec),
      "dist/openapi.json and dist/api/v1/openapi.json differ",
    );
  });
  check("index.json lists groups", () => {
    assert(Array.isArray(index.groups) && index.groups.length > 0, "no groups in index.json");
  });
  check("tools.json lists tools", () => {
    const count = Object.keys(tools.tools ?? {}).length;
    assert(count > 0, "no tools in tools.json");
  });
  check("health.json reports ok", () => {
    assert(health.status === "ok", `health status is ${JSON.stringify(health.status)}`);
  });

  check("llms.txt", () => {
    const text = read("llms.txt");
    assert(text.length > 500, `llms.txt is only ${text.length} bytes`);
    assert(text.includes("/api/v1"), "llms.txt does not mention the API");
  });
  check("llms-full.txt", () => {
    const text = read("llms-full.txt");
    assert(text.length > 10_000, `llms-full.txt is only ${text.length} bytes`);
    assert(text.includes("/text/fancy"), "llms-full.txt does not list endpoints");
  });

  check("CNAME points at the custom domain", () => {
    assert(read("CNAME").trim() === "distools.itzdanti.dev", `CNAME is ${JSON.stringify(read("CNAME"))}`);
  });

  check("index.html references built assets", () => {
    assert(/\/assets\//.test(read("index.html")), "no /assets/ reference in index.html");
  });
  check("404.html mirrors index.html", () => {
    assert(read("404.html") === read("index.html"), "404.html and index.html differ");
  });
  check(".nojekyll is present", () => {
    assert(exists(".nojekyll"), ".nojekyll is missing; Pages would run Jekyll over the output");
  });

  // The point of DISTOOLS_CONFIG is that it reaches the output. Check the two most visible places
  // rather than trusting the build to have substituted the tokens.
  const config = parseDistoolsConfig(readFileSync(resolve(ROOT, "DISTOOLS_CONFIG"), "utf8"));
  check("openapi.json reflects DISTOOLS_CONFIG", () => {
    const info = (spec as unknown as { info?: { title?: string; license?: { name?: string } } }).info;
    assert(info?.title === `${config.service_name} API`, `title is ${JSON.stringify(info?.title)}`);
    assert(info?.license?.name === config.license, `license is ${JSON.stringify(info?.license?.name)}`);
  });
  check("index.html reflects DISTOOLS_CONFIG", () => {
    const html = read("index.html");
    assert(html.includes(config.service_name), "index.html does not contain the service name");
    assert(
      html.includes(deployOrigin(config.service_deploy_domain)),
      "index.html does not contain the deploy domain",
    );
  });

  check("client.js is an importable ES module", () => {
    const source = read("api/v1/client.js");
    assert(/\bexport\s*\{/.test(source) || /\bexport\s+(const|function|class|default)\b/.test(source), "no export found");
  });
  check("client.js exposes the api object", () => {
    assert(/api/.test(read("api/v1/client.js")), "client.js does not mention api");
  });

  // The Shiki substitution keeps the asset list small. A regression here would not break the
  // build, it would just quietly re-ship every grammar Shiki knows.
  const assetFiles = readdirSync(resolve(DIST, "assets"), { withFileTypes: true }).filter((entry) =>
    entry.isFile(),
  );
  check("asset count stays small", () => {
    assert(assetFiles.length <= 60, `${assetFiles.length} asset files; expected at most 60`);
  });
  check("no oversized lazy chunks", () => {
    const biggest = assetFiles
      .map((entry) => ({ name: entry.name, size: statSync(resolve(DIST, "assets", entry.name)).size }))
      .sort((a, b) => b.size - a.size)[0];
    assert(biggest === undefined || biggest.size < 1_500_000, `${biggest?.name} is ${biggest?.size} bytes`);
  });

  process.stdout.write(`\ndist: ${passed}/${passed + failures.length} checks passed\n`);
  if (failures.length > 0) {
    process.stdout.write(`\n${failures.length} failure(s)\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write("all build artifact checks passed\n");
  }
}
