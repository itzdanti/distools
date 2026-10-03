/**
 * The browser's Discord client.
 *
 * Discord's REST API does not send CORS headers for most routes, so a page cannot always
 * read it directly. This module tries three routes in order and reports which one worked:
 *
 *   1. the site's own JSON API, when one is configured (no third party involved)
 *   2. Discord directly, which works for the routes that do allow it
 *   3. public CORS proxies, as a last resort
 *
 * Anything carrying a credential (a webhook URL, a token) uses `discordDirect` and never
 * touches a proxy or the hosted API.
 */

import { apiRequest, canServeLocally } from "./apiClient";
import { DISCORD_API, extractCode, extractId, extractWebhook, isCdnUrl } from "./core/discord";

export { extractCode, extractId, extractWebhook, isCdnUrl, DISCORD_API };

export class DiscordApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "DiscordApiError";
    this.status = status;
  }
}

/** Which route produced the answer, so the UI can be honest about it. */
export type Transport = "api" | "direct" | "proxy" | "cache";

export interface DiscordMeta {
  transport: Transport;
  status: number;
  ms: number;
  fromCache: boolean;
  /** Host of the proxy that answered, when one did. */
  via?: string;
  path: string;
}

export interface DiscordOptions {
  onMeta?: (meta: DiscordMeta) => void;
  /** GET responses are reused for this long. Defaults to 60 seconds. */
  cacheTtlMs?: number;
  signal?: AbortSignal;
}

const PROXIES: { name: string; wrap: (url: string) => string }[] = [
  { name: "allorigins.win", wrap: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` },
  { name: "corsproxy.io", wrap: (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}` },
  { name: "codetabs.com", wrap: (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}` },
];

const TIMEOUT_MS = 12_000;

const MESSAGES: Record<number, string> = {
  400: "Discord rejected that request. An ID or invite code is probably wrong.",
  401: "Discord needs authorization for that resource.",
  403: "Discord blocked the request. This often means the server or user has blocked bots or DMs.",
  404: "Not found. Check the ID, invite code or webhook URL.",
  429: "Rate limited by Discord. Wait a few seconds and try again.",
  500: "Discord had a problem on their side. Try again in a moment.",
  502: "Discord is unreachable right now.",
  503: "Discord is down or blocking this request.",
};

function describe(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { message?: string };
    if (parsed.message) return parsed.message;
  } catch {
    /* Discord did not send JSON, fall through to the generic wording. */
  }
  return MESSAGES[status] ?? `Request failed with status ${status}.`;
}

const cache = new Map<string, { at: number; value: unknown }>();

function readCache(key: string, ttl: number): unknown | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > ttl) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}

function writeCache(key: string, value: unknown): void {
  // Bounded so a long session cannot grow this without limit.
  if (cache.size > 200) cache.clear();
  cache.set(key, { at: Date.now(), value });
}

export function clearDiscordCache(): void {
  cache.clear();
}

async function attempt(
  url: string,
  init: RequestInit | undefined,
  signal: AbortSignal | undefined,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    });

    const body = await res.text();
    if (!res.ok) throw new DiscordApiError(describe(res.status, body), res.status);
    if (!body) return null;

    try {
      return JSON.parse(body);
    } catch {
      throw new DiscordApiError("Discord returned a response we could not read.", res.status);
    }
  } catch (error) {
    if (error instanceof DiscordApiError) throw error;
    if (controller.signal.aborted && !signal?.aborted) {
      throw new DiscordApiError("That request took too long and was stopped.", 0);
    }
    throw new DiscordApiError("", 0);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

function target(path: string): string {
  return path.startsWith("http") ? path : `${DISCORD_API}${path}`;
}

/**
 * Reads from Discord, trying every route that can serve it without a credential.
 *
 * A real HTTP status from Discord (404, 429, and so on) is surfaced immediately rather than
 * being retried through a proxy, because another route would give the same answer.
 */
export async function discordFetch<T = unknown>(
  path: string,
  init?: RequestInit,
  options: DiscordOptions = {},
): Promise<T> {
  const url = target(path);
  const cacheable = !init?.method && (init?.method ?? "GET") === "GET";
  const ttl = options.cacheTtlMs ?? 60_000;
  const cacheKey = `${init?.method ?? "GET"} ${url}`;

  if (cacheable) {
    const hit = readCache(cacheKey, ttl);
    if (hit !== undefined) {
      options.onMeta?.({ transport: "cache", status: 200, ms: 0, fromCache: true, path });
      return hit as T;
    }
  }

  const started = performance.now();
  const report = (transport: Transport, status: number, via?: string) =>
    options.onMeta?.({
      transport,
      status,
      via,
      ms: Math.round(performance.now() - started),
      fromCache: false,
      path,
    });

  // 1. The site's own API, run in this tab. There is no hosted backend to call, so this is the
  //    same handler the docs describe, called directly rather than over HTTP.
  if (cacheable && canServeLocally(url)) {
    try {
      const data = await apiRequest<{ user?: unknown } | Record<string, unknown>>(url);
      report("api", 200);
      writeCache(cacheKey, data);
      return data as T;
    } catch (error) {
      // Discord's own status has already been decided and passed through, so there is nothing
      // to gain by trying again. Anything else is a local problem and the routes below may still
      // work, so fall through rather than failing the lookup.
      if (error instanceof DiscordApiError && error.status !== 0) throw error;
    }
  }

  // 2. Straight to Discord, for the routes that allow browser callers.
  try {
    const data = await attempt(url, init, options.signal);
    report("direct", 200);
    if (cacheable) writeCache(cacheKey, data);
    return data as T;
  } catch (error) {
    if (error instanceof DiscordApiError && error.status !== 0) throw error;
  }

  // 3. Public proxies.
  for (const proxy of PROXIES) {
    try {
      const data = await attempt(proxy.wrap(url), init, options.signal);
      report("proxy", 200, proxy.name);
      if (cacheable) writeCache(cacheKey, data);
      return data as T;
    } catch (error) {
      if (error instanceof DiscordApiError && error.status !== 0) throw error;
    }
  }

  throw new DiscordApiError(
    "Could not reach Discord. The browser blocked the direct request and every public proxy failed. Discord itself may be down, or it may be rate limiting this network.",
    0,
  );
}

/**
 * Sends a request straight to Discord without a proxy.
 *
 * Webhook URLs are credentials, so they must never be handed to a third party or relayed
 * through the site's API. Read-only endpoints go through `discordFetch` instead.
 */
export async function discordDirect<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  try {
    return (await attempt(target(path), init, undefined)) as T;
  } catch (error) {
    if (error instanceof DiscordApiError && error.status !== 0) throw error;
    throw new DiscordApiError(
      "The browser blocked this request before it reached Discord. Discord only allows some of these calls straight from a page, and nothing was sent.",
    );
  }
}

