/**
 * Serves the JSON API from the dev and preview servers.
 *
 * The handler in `src/lib/core/api.ts` is a real request handler, but the dev server and
 * `vite preview` are file servers: without this plugin, `/api/v1/...` falls through to
 * `index.html` and a `curl` with parameters gets the HTML shell. `curl` does not run
 * JavaScript, so the browser-only `ApiResponsePage` never gets a chance to answer.
 *
 * This middleware reads the request, runs the same handler the client bundle uses, and writes
 * the response back as JSON. It is what makes `curl "http://localhost:5173/api/v1/text/fancy?text=hi"`
 * return a result instead of the shell.
 *
 * The handler is loaded lazily rather than imported, because a static `import "../src/lib/core/api.ts"`
 * would drag that module (and its extensionless relative imports) into `tsconfig.node.json`, which
 * uses `nodenext` and rejects them. In dev it goes through Vite's own `ssrLoadModule`; in preview it
 * imports the built `dist/api/v1/client.js`.
 *
 * GitHub Pages itself still cannot run this, because it only serves files. A deployment that wants
 * a live API needs a process in front of it; see `server/serve.ts`.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { IncomingMessage } from "node:http";
import type { Connect, Plugin } from "vite";
import { loadDistoolsConfig } from "./distools-config.ts";

const API_MOUNT = "/api/v1";

/**
 * Discovery files the build writes into `dist/api/v1`. The preview server must serve these from
 * disk rather than through the handler, or `index.json`/`tools.json` would 404.
 */
const STATIC_ARTIFACTS = new Set([
  "/api/v1/index.json",
  "/api/v1/health.json",
  "/api/v1/tools.json",
  "/api/v1/openapi.json",
  "/api/v1/client.js",
]);

interface DiscordGateway {
  get(path: string, signal?: AbortSignal): Promise<unknown>;
}

interface ApiModule {
  createApi(options: {
    origin?: string;
    config?: ReturnType<typeof loadDistoolsConfig>;
    discord?: DiscordGateway;
  }): { handle(request: Request): Promise<Response> };
}

/** Discord lookups, straight to Discord, matching the browser client's gateway. */
const discord: DiscordGateway = {
  async get(path: string, signal?: AbortSignal): Promise<unknown> {
    const response = await fetch(`https://discord.com/api/v10${path}`, {
      ...(signal ? { signal } : {}),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Discord answered ${response.status} for ${path}.`);
    }
    return response.json();
  },
};

function readBody(request: IncomingMessage): Promise<Buffer | undefined> {
  if (request.method === "GET" || request.method === "HEAD") return Promise.resolve(undefined);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => resolve(chunks.length === 0 ? undefined : Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function headersFor(request: IncomingMessage): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value === undefined) continue;
    headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  return headers;
}

async function toRequest(request: IncomingMessage, origin: string): Promise<Request> {
  const method = request.method ?? "GET";
  const body = await readBody(request);
  return new Request(new URL(request.url ?? "/", origin), {
    method,
    headers: headersFor(request),
    ...(body ? { body } : {}),
  });
}

/** Builds the Connect middleware. `load` fetches the API module lazily, once per request. */
function middleware(load: () => Promise<ApiModule>): Connect.NextHandleFunction {
  return (request, response, next) => {
    const url = request.url ?? "/";
    const path = url.split("?")[0];
    if (
      STATIC_ARTIFACTS.has(path) ||
      (url !== API_MOUNT && !url.startsWith(`${API_MOUNT}/`) && !url.startsWith(`${API_MOUNT}?`))
    ) {
      next();
      return;
    }

    void (async () => {
      const origin = `http://${request.headers.host ?? "localhost"}`;
      const { createApi } = await load();
      const api = createApi({ origin, config: loadDistoolsConfig(), discord });
      const result = await api.handle(await toRequest(request, origin));
      const payload = Buffer.from(await result.arrayBuffer());

      response.statusCode = result.status;
      result.headers.forEach((value, key) => response.setHeader(key, value));
      response.end(payload);
    })().catch((error: unknown) => {
      response.statusCode = 500;
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(
        JSON.stringify({
          error: {
            message: error instanceof Error ? error.message : "Something went wrong handling that.",
            status: 500,
          },
        }),
      );
    });
  };
}

export function distoolsApi(): Plugin {
  return {
    name: "distools-api",
    configureServer(server) {
      server.middlewares.use(
        middleware(async () => (await server.ssrLoadModule("/src/lib/core/api.ts")) as unknown as ApiModule),
      );
    },
    configurePreviewServer(server) {
      const clientBundle = resolve(server.config.root, "dist/api/v1/client.js");
      server.middlewares.use(
        middleware(async () => {
          if (!existsSync(clientBundle)) {
            throw new Error("dist/api/v1/client.js is missing. Run `npm run build` before `npm run preview`.");
          }
          // `client.js` exports `createApi`; calling it here reuses the exact handler the
          // browser client ships. The computed specifier keeps `tsc` from resolving into it.
          return (await import(/* @vite-ignore */ pathToFileURL(clientBundle).href)) as ApiModule;
        }),
      );
    },
  };
}
