/**
 * The public client for the site's JSON API.
 *
 * This module is built to its own file at `/api/v1/client.js` and is the supported way to call
 * the API from your own code. It is a plain ES module with no dependencies and no DOM
 * assumptions, so it works in a browser, in Deno, and in Node 18+.
 *
 * The reason it exists is worth stating plainly. The API is hosted on GitHub Pages, which serves
 * static files and nothing else. There is no process behind the domain that can read a query
 * string and compute an answer, so a bare `fetch("https://<your-domain>/api/v1/...?...")`
 * from another site gets the HTML shell rather than the result. Importing this module gives you
 * the same handler that answers those URLs when you open them in a browser.
 *
 * ```js
 * import { api } from "https://<your-domain>/api/v1/client.js";
 *
 * const fancy = await api.get("/text/fancy", { text: "hello", style: "bold" });
 * console.log(fancy.data.output);
 * ```
 */

import { API_PREFIX, DEFAULT_ORIGIN, ENDPOINTS, createApi, type ApiEndpoint } from "./api";

export { DEFAULT_ORIGIN };

const origin =
  typeof globalThis.location === "object" && "origin" in globalThis.location && globalThis.location.origin !== "null"
    ? globalThis.location.origin
    : DEFAULT_ORIGIN;

/**
 * Discord lookups over plain `fetch`.
 *
 * Only the routes Discord answers with permissive CORS headers will succeed from a browser. The
 * invite routes do; the guild and user routes generally do not, and those raise a 401 from
 * Discord which is surfaced as an error rather than hidden.
 */
const discord = {
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

const handler = createApi({ origin, discord });

export class ApiRequestError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.payload = payload;
  }
}

function join(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${API_PREFIX}${clean}`.replace(/\/+$/, "");
}

async function send(request: Request): Promise<unknown> {
  const response = await handler.handle(request);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (payload as { error?: { message?: string } } | null)?.error;
    throw new ApiRequestError(response.status, error?.message ?? `Request failed with ${response.status}.`, payload);
  }
  return payload;
}

function withQuery(path: string, params?: Record<string, string | number | boolean | string[]>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const entry of value) search.append(key, String(entry));
    } else {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export type ParamValue = string | number | boolean | string[];

export interface ApiClient {
  /** Calls a GET endpoint. Path is relative to `/api/v1`, with or without the prefix. */
  get<T = unknown>(path: string, params?: Record<string, ParamValue>): Promise<T>;
  /** Calls an endpoint with a JSON body. Not reachable through GitHub Pages; use `get`. */
  post<T = unknown>(path: string, body?: Record<string, ParamValue>): Promise<T>;
  /** The shareable browser URL for a call. Open it and the site renders the JSON. */
  url(path: string, params?: Record<string, ParamValue>): string;
  /** The underlying `fetch`, for anything the helpers do not cover. */
  request(input: string | URL | Request, init?: RequestInit): Promise<Response>;
}

export const api: ApiClient = {
  async get<T>(path: string, params?: Record<string, ParamValue>) {
    return (await send(new Request(`${origin}${withQuery(join(path), params)}`, { method: "GET" }))) as T;
  },
  async post<T>(path: string, body?: Record<string, ParamValue>) {
    return (await send(
      new Request(`${origin}${join(path)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      }),
    )) as T;
  },
  url(path, params) {
    return `${origin}${withQuery(join(path), params)}`;
  },
  request(input, init) {
    return handler.handle(input instanceof Request ? input : new Request(input, init));
  },
};

/** Every endpoint, for building menus and validating calls. */
export { API_PREFIX, ENDPOINTS, createApi };
export type { ApiEndpoint };

/** Look up one endpoint by id or by path. */
export function findEndpoint(idOrPath: string): ApiEndpoint | undefined {
  return ENDPOINTS.find((endpoint) => endpoint.id === idOrPath || endpoint.path === idOrPath);
}
