import { createServer, preview } from "vite";

/**
 * Starts the real servers and makes real HTTP requests against them.
 *
 * The other suites call the handler and the components directly. This one is deliberately lower
 * tech: it asks Vite to boot the dev server exactly as `npm run dev` does, and to serve `dist`
 * exactly as a static host would, then checks what comes back over HTTP. That is the only way to
 * catch a broken config, a wrong `base`, a `public/` file that never got copied, or a preview
 * server that 404s on a route the router knows about.
 */

const failures: string[] = [];
let passed = 0;

const DEV_PORT = 5199;
const PREVIEW_PORT = 5198;

interface Expectation {
  path: string;
  status: number;
  /** Substring the `Content-Type` must contain. Omitted for extensionless files. */
  type?: string;
  body?: (text: string) => boolean | string;
}

function report(path: string, detail: string): void {
  process.stdout.write(`  ${path.padEnd(28)} ${detail}\n`);
}

async function check(base: string, expectations: Expectation[]): Promise<void> {
  for (const expectation of expectations) {
    const url = `${base}${expectation.path}`;
    try {
      const response = await fetch(url, { redirect: "manual" });
      const contentType = response.headers.get("content-type") ?? "";
      const text = await response.text();

      if (response.status !== expectation.status) {
        throw new Error(`status ${response.status}, expected ${expectation.status}`);
      }
      if (expectation.type && !contentType.includes(expectation.type)) {
        throw new Error(`content-type ${JSON.stringify(contentType)}, expected ${expectation.type}`);
      }
      if (expectation.body) {
        const outcome = expectation.body(text);
        if (outcome !== true) throw new Error(typeof outcome === "string" ? outcome : "body check failed");
      }

      passed += 1;
      report(expectation.path, `${response.status} ${contentType.split(";")[0]}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${base}${expectation.path}: ${message}`);
      report(expectation.path, `FAIL ${message}`);
    }
  }
}

const contains = (needle: string) => (text: string) =>
  text.includes(needle) ? true : `missing ${JSON.stringify(needle)}`;

async function testDevServer(): Promise<void> {
  process.stdout.write("\ndev server (npm run dev)\n");
  const server = await createServer({
    configFile: "vite.config.ts",
    server: { port: DEV_PORT, strictPort: true, host: "127.0.0.1" },
    logLevel: "silent",
  });

  try {
    await server.listen();
    const base = `http://127.0.0.1:${DEV_PORT}`;

    await check(base, [
      { path: "/", status: 200, type: "text/html", body: contains('id="root"') },
      { path: "/docs", status: 200, type: "text/html", body: contains('id="root"') },
      { path: "/docs/getting-started", status: 200, type: "text/html" },
      { path: "/tool/fancy-text", status: 200, type: "text/html" },
      // The API middleware runs the handler for real, so even a parameterised request returns
      // JSON from the dev server instead of the HTML shell.
      { path: "/api/v1/tools", status: 200, type: "json", body: contains("tools") },
      { path: "/api/v1/health", status: 200, type: "json", body: contains("ok") },
      {
        path: "/api/v1/text/fancy?text=hello&style=bold",
        status: 200,
        type: "json",
        body: contains("output"),
      },
      { path: "/llms.txt", status: 200, type: "text/plain", body: contains("/api/v1") },
      { path: "/llms-full.txt", status: 200, type: "text/plain", body: contains("/text/fancy") },
      // The main entry module has to be transformable; this catches a broken import graph.
      { path: "/src/main.tsx", status: 200, type: "javascript" },
      { path: "/openapi.json", status: 200, type: "json", body: contains("openapi") },
    ]);
  } finally {
    await server.close();
  }
}

async function testPreviewServer(): Promise<void> {
  process.stdout.write("\npreview server (built dist/)\n");
  const server = await preview({
    configFile: "vite.config.ts",
    preview: { port: PREVIEW_PORT, strictPort: true, host: "127.0.0.1" },
    logLevel: "silent",
  });

  try {
    const base = `http://127.0.0.1:${PREVIEW_PORT}`;

    await check(base, [
      { path: "/", status: 200, type: "text/html", body: contains('id="root"') },
      // SPA fallback: a route with no file behind it still returns the shell.
      { path: "/docs", status: 200, type: "text/html", body: contains('id="root"') },
      { path: "/tool/fancy-text", status: 200, type: "text/html" },
      // Discovery documents are real files here, unlike in dev.
      { path: "/api/v1/index.json", status: 200, type: "json", body: contains("groups") },
      { path: "/api/v1/openapi.json", status: 200, type: "json", body: contains("openapi") },
      { path: "/api/v1/health.json", status: 200, type: "json", body: contains("ok") },
      { path: "/api/v1/client.js", status: 200, type: "javascript", body: contains("export") },
      // The preview server runs the same middleware, so dynamic calls work there too.
      {
        path: "/api/v1/text/fancy?text=hi&style=bold",
        status: 200,
        type: "json",
        body: contains("output"),
      },
      { path: "/openapi.json", status: 200, type: "json" },
      { path: "/llms.txt", status: 200, type: "text/plain" },
      { path: "/llms-full.txt", status: 200, type: "text/plain" },
      { path: "/CNAME", status: 200, body: contains("distools.itzdanti.dev") },
    ]);
  } finally {
    await server.close();
  }
}

try {
  await testDevServer();
  await testPreviewServer();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  failures.push(`server startup: ${message}`);
  report("startup", `FAIL ${message}`);
}

process.stdout.write(`\nservers: ${passed}/${passed + failures.length} responses correct\n`);
if (failures.length > 0) {
  process.stdout.write(`\n${failures.length} failure(s)\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("all server checks passed\n");
}
