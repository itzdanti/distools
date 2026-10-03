/**
 * In-process access to the site's own API.
 *
 * The API ships with the site, so there is nothing to configure and nowhere to point. What
 * matters is *how* it is reached: the handler is called directly rather than over HTTP, because
 * GitHub Pages serves files and a `fetch` of `/api/v1/...?text=hello` returns the HTML shell
 * rather than a computed answer. Running the same handler in this tab gives the identical result
 * without the round trip.
 *
 * The public module at `/api/v1/client.js` wraps exactly this, for code outside the site.
 *
 * Nothing here ever sends a webhook URL or a token. Those stay direct, to Discord.
 */

import { DEFAULT_ORIGIN, createApi } from "./core/api";

export const API_BASE = DEFAULT_ORIGIN;

/** The gateway that the API's Discord endpoints use: Discord itself, with no credential. */
const discord = {
  async get(path: string, signal?: AbortSignal): Promise<unknown> {
    const response = await fetch(`https://discord.com/api/v10${path}`, {
      ...(signal ? { signal } : {}),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Discord answered ${response.status} for ${path}.`);
    return response.json();
  },
};

const handler = createApi({ origin: DEFAULT_ORIGIN, discord });

export const API_ERROR = "ApiClientError";

export class ApiClientError extends Error {
  status: number;
  endpoint: string | null;

  constructor(message: string, status = 0, endpoint: string | null = null) {
    super(message);
    this.name = API_ERROR;
    this.status = status;
    this.endpoint = endpoint;
  }
}

interface Envelope<T> {
  data?: T;
  error?: { message?: string; status?: number };
  endpoint?: string;
}

/**
 * Calls an endpoint and unwraps the `{ data }` envelope.
 *
 * Accepts either a path on our own API or a full Discord URL, which is mapped onto the matching
 * `/api/v1/discord/...` endpoint.
 */
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const target = path.startsWith("http") ? apiLocalPath(path) : path;
  if (target === null) {
    throw new ApiClientError("No local endpoint covers that Discord route.", 0);
  }

  let response: Response;
  try {
    response = await handler.handle(new Request(`${DEFAULT_ORIGIN}${target}`, init));
  } catch (error) {
    throw new ApiClientError(
      error instanceof Error ? error.message : "The API could not handle that request.",
      0,
    );
  }

  const parsed = (await response.json().catch(() => null)) as Envelope<T> | null;

  if (!response.ok || parsed?.error) {
    throw new ApiClientError(
      parsed?.error?.message ?? `The API returned ${response.status}.`,
      parsed?.error?.status ?? response.status,
      parsed?.endpoint ?? null,
    );
  }

  return (parsed?.data ?? null) as T;
}

/** The API is always present: it is the same bundle as this page. */
export function apiConfigured(): boolean {
  return true;
}

const DISCORD_PREFIX = "/api/v1/discord";

/**
 * Turns a Discord URL into the matching path on our own API, or null when there is no endpoint
 * for it. Null matters: the caller then skips this route and goes straight to Discord, rather
 * than asking for a path that does not exist.
 */
function apiLocalPath(discordUrl: string): string | null {
  const url = new URL(discordUrl);

  if (url.hostname.endsWith("discord.com") && url.pathname.startsWith("/api/v10")) {
    const rest = url.pathname.slice("/api/v10".length);
    if (rest.startsWith("/users/")) return `${DISCORD_PREFIX}/users/${rest.slice(7)}`;
    if (rest.startsWith("/guilds/")) return `${DISCORD_PREFIX}/guilds/${rest.slice(8)}`;
    if (rest.startsWith("/invites/")) return `${DISCORD_PREFIX}/invites/${rest.slice(9)}`;
    if (rest.startsWith("/emojis/")) return `${DISCORD_PREFIX}/emojis/${rest.slice(9)}`;
  }

  return null;
}

/** True when the in-process API can answer for this Discord URL. */
export function canServeLocally(discordUrl: string): boolean {
  return apiLocalPath(discordUrl) !== null;
}

/** True when the build has an API to talk to. It always does. */
export const HAS_HOSTED_API = apiConfigured();
