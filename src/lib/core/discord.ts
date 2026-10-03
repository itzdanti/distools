/**
 * String helpers for pulling IDs out of things people paste.
 *
 * Pure on purpose: the API, the docs and the browser tools all use these.
 */

export const DISCORD_API = "https://discord.com/api/v10";
export const DISCORD_CDN = "https://cdn.discordapp.com";

export function extractCode(input: string): string {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/discord\.gg\/([A-Za-z0-9-]+)/i);
  if (urlMatch) return urlMatch[1];
  return trimmed.replace(/^(https?:\/\/)?(www\.)?discord(app)?\.com\/invite\//i, "");
}

export function extractWebhook(url: string): string | null {
  const match = url
    .trim()
    .match(/^https:\/\/(?:\w+\.)?discord(?:app)?\.com\/api\/webhooks\/(\d+)\/([A-Za-z0-9_-]+)/);
  if (!match) return null;
  return `${DISCORD_API}/webhooks/${match[1]}/${match[2]}`;
}

export function extractId(input: string): string | null {
  const patterns = [
    /discord\.com\/users\/(\d{17,20})/i,
    /discord\.com\/channels\/(\d{17,20})/i,
    /discord\.com\/guilds\/(\d{17,20})/i,
    /(?:^|\D)(\d{17,20})(?:\D|$)/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/** True when Discord's CDN will serve this path without a token. */
export function isCdnUrl(url: string): boolean {
  return /^https:\/\/(?:cdn\.)?discordapp\.com\//i.test(url.trim());
}

/** The powers of two Discord's CDN accepts, which are the only sizes it will resize to. */
export const CDN_SIZES = [
  "16", "32", "64", "128", "256", "512", "1024", "2048", "4096",
] as const;

/** Animated hashes start with this, and end in `.gif` rather than `.png`. */
function hashExt(hash: string): string {
  return hash.startsWith("a_") ? "gif" : "png";
}

export function iconUrl(guildId: string, hash: string | null | undefined, size = "1024"): string | null {
  return hash ? `${DISCORD_CDN}/icons/${guildId}/${hash}.${hashExt(hash)}?size=${size}` : null;
}

export function bannerUrlFor(guildId: string, hash: string | null | undefined, size = "1024"): string | null {
  return hash ? `${DISCORD_CDN}/banners/${guildId}/${hash}.${hashExt(hash)}?size=${size}` : null;
}

export function splashUrl(guildId: string, hash: string | null | undefined, size = "1024"): string | null {
  return hash ? `${DISCORD_CDN}/splashes/${guildId}/${hash}.png?size=${size}` : null;
}

/** The guild fields an invite response carries that we care about. */
export interface InviteGuild {
  id: string;
  name?: string;
  icon?: string | null;
  banner?: string | null;
  splash?: string | null;
  description?: string | null;
}
