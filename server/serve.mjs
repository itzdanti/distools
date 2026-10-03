/**
 * Production server for the API.
 *
 * GitHub Pages is a file host and cannot run a request handler, so `/api/v1/...` there falls back
 * to the app shell and a `curl` gets HTML. This server does what GitHub Pages cannot: it serves
 * `dist/` as static files and answers `/api/v1/...` by running the handler from the built
 * `dist/api/v1/client.js`.
 *
 * Run `npm run build` first, then `npm run serve` (or `PORT=8080 npm run serve`).
 *
 *   curl "http://localhost:8080/api/v1/text/fancy?text=hello&style=bold"
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(fileURLToPath(import.meta.url), "..", "..");
const dist = join(root, "dist");
const clientBundle = join(dist, "api/v1/client.js");
const port = Number(process.env.PORT ?? 8080);

if (!existsSync(clientBundle)) {
  process.stderr.write("dist/api/v1/client.js is missing. Run `npm run build` first.\n");
  process.exit(1);
}

const { createApi, DEFAULT_ORIGIN } = await import(pathToFileURL(clientBundle).href);

const API_MOUNT = "/api/v1";
const STATIC_ARTIFACTS = new Set([
  "/api/v1/index.json",
  "/api/v1/health.json",
  "/api/v1/tools.json",
  "/api/v1/openapi.json",
  "/api/v1/client.js",
]);

const discord = {
  async get(path, signal) {
    const response = await fetch(`https://discord.com/api/v10${path}`, {
      ...(signal ? { signal } : {}),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Discord answered ${response.status} for ${path}.`);
    return response.json();
  },
};

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".map": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
};

function readBody(request) {
  if (request.method === "GET" || request.method === "HEAD") return Promise.resolve(undefined);
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolveBody(chunks.length === 0 ? undefined : Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function headersFor(request) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value === undefined) continue;
    headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  return headers;
}

async function toRequest(request, origin) {
  const method = request.method ?? "GET";
  const body = await readBody(request);
  return new Request(new URL(request.url ?? "/", origin), {
    method,
    headers: headersFor(request),
    ...(body ? { body } : {}),
  });
}

/** Resolves a URL path to a file inside `dist`, or null if it escapes or is missing. */
async function staticFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const target = normalize(join(dist, decoded));
  if (target !== dist && !target.startsWith(dist + sep)) return null;
  try {
    const info = await stat(target);
    if (info.isDirectory()) {
      const index = join(target, "index.html");
      return (await stat(index)).isFile() ? index : null;
    }
    return target;
  } catch {
    return null;
  }
}

async function sendFile(response, file, status = 200) {
  const body = await readFile(file);
  response.writeHead(status, { "Content-Type": TYPES[extname(file).toLowerCase()] ?? "application/octet-stream" });
  response.end(body);
}

async function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(body);
}

const server = createServer(async (request, response) => {
  const origin = `http://${request.headers.host ?? `localhost:${port}`}`;
  const url = new URL(request.url ?? "/", origin);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  const wantsApi =
    !STATIC_ARTIFACTS.has(url.pathname) &&
    (url.pathname === API_MOUNT || url.pathname.startsWith(`${API_MOUNT}/`));

  if (wantsApi) {
    try {
      const api = createApi({ origin, discord });
      const result = await api.handle(await toRequest(request, origin));
      const body = Buffer.from(await result.arrayBuffer());
      response.writeHead(result.status, Object.fromEntries(result.headers));
      response.end(body);
    } catch (error) {
      await sendJson(response, 500, {
        error: { message: error instanceof Error ? error.message : "Something went wrong.", status: 500 },
      });
    }
    return;
  }

  const file = await staticFile(url.pathname);
  if (file) {
    await sendFile(response, file);
    return;
  }

  // SPA fallback for deep links the router owns; everything else is a genuine 404.
  if (request.method === "GET" || request.method === "HEAD") {
    const shell = await staticFile("/index.html");
    if (shell) {
      await sendFile(response, shell);
      return;
    }
  }

  await sendJson(response, 404, {
    error: { message: `No file at ${path}.`, status: 404 },
  });
});

server.listen(port, () => {
  process.stdout.write(`distools api listening on http://localhost:${port} (origin ${DEFAULT_ORIGIN})\n`);
});
