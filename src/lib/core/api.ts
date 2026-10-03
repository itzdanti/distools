/**
 * The public JSON API.
 *
 * This module is the single source of truth for the API: the docs at `/docs/api` and the
 * pre-baked discovery documents are generated from the same list, and every tool page links to
 * its endpoint. Nothing here imports React or the DOM, so the same handler runs in the browser,
 * in Node and inside the published `client.js`.
 */

import {
  decodeBase64,
  decodeBase64Url,
  decodeUrl,
  encodeBase64,
  encodeBase64Url,
  encodeUrl,
} from "../codecs";
import {
  contrastAgainst,
  hexToRgb,
  hslToRgb,
  isHex,
  luminanceLabel,
  parseHslString,
  parseRgbString,
  relativeLuminance,
  rgbToHex,
  rgbToHsl,
} from "../color";
import { BADGES, BADGE_GROUPS, MARKDOWN_ROWS, MENTION_TYPES, formatStamp, relativeFrom } from "../discordData";
import {
  DEFAULT_PASSWORD,
  RULE_TEMPLATES,
  buildRules,
  buildWelcome,
  estimateStrength,
  generateBio,
  generateChannelName,
  generateChannelSet,
  generateNicknames,
  generatePassword,
  generateRole,
  generateRoleName,
  generateServerName,
  generateUsernames,
  uuidV4,
  type PasswordOptions,
  type RuleSetOptions,
  type UsernameStyle,
  type WelcomeOptions,
} from "../generators";
import { ROLE_PALETTE, shadeColor } from "../color";
import { CUSTOM_STATUS_EMOJI, CUSTOM_STATUS_PRESETS } from "../generators";
import { createSnowflake, decodeSnowflake, describeAge, DISCORD_EPOCH } from "../snowflake";
import { buildPresence, RPC_PRESETS } from "../rpc";
import { SOUNDS } from "../sound";
import { EMOJIS, EMOJI_CATEGORIES } from "../emojiData";
import {
  DIVIDERS,
  STYLE_OPTIONS,
  analyzeText,
  applyFont,
  buildDivider,
  escapeSpoiler,
  reverseText,
  spoilerEachChar,
  spoilerEachLine,
  titleCase,
  toAccents,
  toOutline,
  toSmallCaps,
  toSpaced,
  toStrikethrough,
  toSubscript,
  toSuperscript,
  zalgo,
  type StyleName,
} from "../text";
import { DISCORD_API, extractCode, extractId, iconUrl, bannerUrlFor, splashUrl, CDN_SIZES, type InviteGuild } from "./discord";

export { DISCORD_API };
import { embedSummary, EMBED_LIMITS, type WebhookPayloadInput } from "./embed";
import { jsonStats, parseJson, runJsonMode, type JsonMode } from "./json";
import { buildMentions, mentionTypes } from "./mentions";
import { bitsFromNames, parseInteger, serializePermissions, summarize } from "./permissions";
import { parseMessageLink, validateInviteOptions } from "./invites";
import { inspectToken, maskToken } from "./token";
import { ageStats, formatCountdown, parseDateInput } from "./time";
import { vttResult } from "./vtt";
import { config, serviceOrigin, type DistoolsConfig } from "../config";

export const API_VERSION = "1";
export const API_PREFIX = `/api/v${API_VERSION}`;

/** Where the site is published, used for links when no live origin is supplied. */
export const DEFAULT_ORIGIN = serviceOrigin || "https://distools.itzdanti.dev";

/* --------------------------------- errors -------------------------------- */

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/* -------------------------------- plumbing ------------------------------- */

/** Injected by the host so this module never reaches for a global fetch. */
export interface DiscordGateway {
  /** Performs a GET against Discord's REST API and returns the parsed body. */
  get(path: string, signal?: AbortSignal): Promise<unknown>;
}

export type ParamType = "string" | "number" | "boolean" | "string[]" | "object";

export interface ApiParam {
  name: string;
  in: "query" | "path" | "body";
  type: ParamType;
  required?: boolean;
  default?: string | number | boolean | string[];
  enum?: string[];
  description: string;
  example?: string;
}

export interface ApiEndpoint {
  id: string;
  method: "GET" | "POST";
  path: string;
  group: string;
  summary: string;
  description: string;
  /** Slugs of the site tools this endpoint backs. Empty means API-only. */
  tools: string[];
  params: ApiParam[];
  handler: (input: ApiInput) => unknown | Promise<unknown>;
}

export interface ApiInput {
  path: Record<string, string>;
  query: URLSearchParams;
  body: Record<string, unknown>;
  discord?: DiscordGateway;
}

export function text(input: ApiInput, name: string, fallback = ""): string {
  const fromBody = input.body[name];
  const raw = fromBody === undefined || fromBody === null ? input.query.get(name) : fromBody;
  if (Array.isArray(raw)) return raw.length > 0 ? String(raw[raw.length - 1]) : fallback;
  const value = raw === undefined || raw === null ? "" : String(raw);
  return value.trim() === "" ? fallback : value;
}

export function num(input: ApiInput, name: string, fallback: number): number {
  const raw = text(input, name, "");
  if (raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new ApiError(400, `"${name}" must be a number.`);
  }
  return value;
}

export function int(input: ApiInput, name: string, fallback: number, min: number, max: number): number {
  const value = num(input, name, fallback);
  if (!Number.isInteger(value)) throw new ApiError(400, `"${name}" must be a whole number.`);
  if (value < min || value > max) {
    throw new ApiError(400, `"${name}" must be between ${min} and ${max}.`);
  }
  return value;
}

export function bool(input: ApiInput, name: string, fallback = false): boolean {
  const raw = text(input, name, "").toLowerCase();
  if (raw === "") return fallback;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

/**
 * Reads a list of values from a body field or repeated query parameters.
 *
 * Commas separate entries, never spaces, so that names which contain spaces survive
 * intact. Pass a real JSON array to include a value with a comma in it.
 */
export function list(input: ApiInput, name: string): string[] {
  const raw = input.body[name];
  if (Array.isArray(raw)) return raw.map((entry) => String(entry).trim()).filter(Boolean);
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return input.query
    .getAll(name)
    .flatMap((value) => value.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function required(input: ApiInput, name: string): string {
  const value = text(input, name, "");
  if (value === "") throw new ApiError(400, `"${name}" is required.`);
  return value;
}

function oneOf<T extends string>(value: string, allowed: readonly T[], name: string): T {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new ApiError(400, `"${name}" must be one of: ${allowed.join(", ")}.`);
  }
  return value as T;
}

function requireDiscord(input: ApiInput): DiscordGateway {
  if (!input.discord) {
    throw new ApiError(503, "This deployment has no Discord gateway configured.");
  }
  return input.discord;
}

const STYLES = STYLE_OPTIONS.map((option) => option.id) as readonly StyleName[];
const ZALGO_MODES = ["up", "down", "middle", "random", "all"] as const;
const JSON_MODES = ["pretty", "minify", "validate", "escape", "unescape"] as const;
const BASE64_MODES = ["encode", "decode", "encodeUrl", "decodeUrl"] as const;
const URL_MODES = ["encode", "decode", "component"] as const;
const TEXT_TRANSFORMS = [
  "upper",
  "lower",
  "title",
  "reverse",
  "spaced",
  "accent",
  "outline",
  "strikethrough",
  "superscript",
  "subscript",
  "escapeSpoiler",
] as const;

const p = (
  name: string,
  description: string,
  extra: Partial<ApiParam> = {},
): ApiParam => ({ name, in: "body", type: "string", description, ...extra });

/* ------------------------------- endpoints ------------------------------- */

export const ENDPOINTS: ApiEndpoint[] = [
  {
    id: "text.fancy",
    method: "POST",
    path: `${API_PREFIX}/text/fancy`,
    group: "Text",
    summary: "Convert text to a fancy Unicode style",
    description:
      "Applies one of the site's font tables. Returns the same output as the Fancy Text tool.",
    tools: ["fancy-text"],
    params: [
      p("text", "Text to convert.", { required: true, example: "hello" }),
      p("style", "Style id from GET /text/styles.", {
        default: "bold",
        enum: [...STYLES],
        example: "bold",
      }),
    ],
    handler: (input) => ({
      style: oneOf(text(input, "style", "bold"), STYLES, "style"),
      output: applyFont(required(input, "text"), oneOf(text(input, "style", "bold"), STYLES, "style")),
    }),
  },
  {
    id: "text.styles",
    method: "GET",
    path: `${API_PREFIX}/text/styles`,
    group: "Text",
    summary: "List every fancy text style",
    description: "Style ids accepted by POST /text/fancy.",
    tools: ["fancy-text"],
    params: [],
    handler: () => STYLE_OPTIONS,
  },
  {
    id: "text.zalgo",
    method: "POST",
    path: `${API_PREFIX}/text/zalgo`,
    group: "Text",
    summary: "Add combining characters (zalgo)",
    description: "Same modes as the Zalgo tool.",
    tools: ["zalgo-text"],
    params: [
      p("text", "Text to stack.", { required: true, example: "aki" }),
      p("mode", "Direction of the marks.", { default: "random", enum: [...ZALGO_MODES] }),
      p("amount", "Marks per character.", { type: "number", default: 1, example: "3" }),
    ],
    handler: (input) => {
      const mode = oneOf(text(input, "mode", "random"), ZALGO_MODES, "mode");
      const amount = int(input, "amount", 1, 1, 20);
      return { mode, amount, output: zalgo(required(input, "text"), mode, amount) };
    },
  },
  {
    id: "text.small-caps",
    method: "POST",
    path: `${API_PREFIX}/text/small-caps`,
    group: "Text",
    summary: "Convert text to small caps",
    description: "Unicode small capitals, not CSS.",
    tools: ["small-caps"],
    params: [p("text", "Text to convert.", { required: true, example: "aki" })],
    handler: (input) => ({ output: toSmallCaps(required(input, "text")) }),
  },
  {
    id: "text.spoiler",
    method: "POST",
    path: `${API_PREFIX}/text/spoiler`,
    group: "Text",
    summary: "Wrap text in Discord spoilers",
    description: "Either one spoiler per line or one per character.",
    tools: ["spoiler-text"],
    params: [
      p("text", "Text to hide.", { required: true, example: "secret" }),
      p("mode", "line or char.", { default: "line", enum: ["line", "char"] }),
    ],
    handler: (input) => {
      const mode = oneOf(text(input, "mode", "line"), ["line", "char"] as const, "mode");
      const value = required(input, "text");
      return { mode, output: mode === "line" ? spoilerEachLine(value) : spoilerEachChar(value) };
    },
  },
  {
    id: "text.divider",
    method: "POST",
    path: `${API_PREFIX}/text/divider`,
    group: "Text",
    summary: "Build a text divider",
    description: "Same characters as the Divider tool.",
    tools: ["text-divider"],
    params: [
      p("char", "Character to repeat. Defaults to the first preset.", {
        example: "─",
      }),
      p("length", "How many characters.", { type: "number", default: 40, example: "60" }),
    ],
    handler: (input) => {
      const char = text(input, "char", DIVIDERS[0].value);
      const length = int(input, "length", 40, 1, 500);
      return { char, length, output: buildDivider(char, length), presets: DIVIDERS };
    },
  },
  {
    id: "text.status",
    method: "POST",
    path: `${API_PREFIX}/text/status`,
    group: "Text",
    summary: "Build a Discord custom status",
    description:
      "Custom status needs Nitro. Presence (online, idle, do not disturb) is free and is set from the status picker, not a text field. Returns the emoji and preset lists so a client does not have to hardcode them.",
    tools: ["custom-status"],
    params: [
      p("text", "Status text, up to 128 characters.", { example: "focus mode" }),
      p("emoji", "Optional leading emoji. Only added when it is missing.", {
        enum: CUSTOM_STATUS_EMOJI,
        example: "\u{1F4BB}",
      }),
    ],
    handler: (input) => {
      const raw = text(input, "text", "");
      const emoji = text(input, "emoji", "");
      // Discord counts the emoji as part of the 128 characters.
      const status = emoji !== "" && !raw.startsWith(emoji) ? `${emoji} ${raw}` : raw;

      if (status.length > 128) {
        throw new ApiError(
          400,
          `That status is ${status.length} characters. Discord allows 128, including the emoji.`,
        );
      }

      return {
        status,
        length: status.length,
        limit: 128,
        requiresNitro: true,
        emoji: CUSTOM_STATUS_EMOJI,
        presets: CUSTOM_STATUS_PRESETS,
      };
    },
  },
  {
    id: "text.mentions",
    method: "POST",
    path: `${API_PREFIX}/text/mentions`,
    group: "Text",
    summary: "Build mention strings",
    description: "One id per line, or separated by spaces or commas.",
    tools: ["mentions"],
    params: [
      p("type", "Mention type id.", { default: "user", enum: MENTION_TYPES.map((m) => m.id) }),
      p("ids", "IDs to wrap.", { required: true, example: "81384788765712384" }),
    ],
    handler: (input) =>
      buildMentions(text(input, "type", "user"), required(input, "ids")),
  },
  {
    id: "text.mention-types",
    method: "GET",
    path: `${API_PREFIX}/text/mention-types`,
    group: "Text",
    summary: "List mention templates",
    description: "Templates and notes for every mention type.",
    tools: ["mentions"],
    params: [],
    handler: () => mentionTypes(),
  },
  {
    id: "text.stats",
    method: "POST",
    path: `${API_PREFIX}/text/stats`,
    group: "Text",
    summary: "Word, character and reading stats",
    description: "Identical to the Word Counter tool.",
    tools: ["word-counter"],
    params: [p("text", "Text to measure.", { required: true })],
    handler: (input) => analyzeText(required(input, "text")),
  },
  {
    id: "text.transform",
    method: "POST",
    path: `${API_PREFIX}/text/transform`,
    group: "Text",
    summary: "Case changes and stylisers",
    description: "Covers every mode of the Text Transform tool.",
    tools: ["text-transform"],
    params: [
      p("text", "Text to transform.", { required: true }),
      p("mode", "Transform to apply.", {
        required: true,
        enum: [...TEXT_TRANSFORMS],
        example: "title",
      }),
    ],
    handler: (input) => {
      const mode = oneOf(required(input, "mode"), TEXT_TRANSFORMS, "mode");
      const value = required(input, "text");
      const output =
        mode === "upper"
          ? value.toUpperCase()
          : mode === "lower"
            ? value.toLowerCase()
            : mode === "title"
              ? titleCase(value)
              : mode === "reverse"
                ? reverseText(value)
                : mode === "spaced"
                  ? toSpaced(value)
                  : mode === "accent"
                    ? toAccents(value)
                    : mode === "outline"
                      ? toOutline(value)
                      : mode === "strikethrough"
                        ? toStrikethrough(value)
                        : mode === "superscript"
                          ? toSuperscript(value)
                          : mode === "subscript"
                            ? toSubscript(value)
                            : escapeSpoiler(value);
      return { mode, output };
    },
  },
  {
    id: "ids.snowflake",
    method: "GET",
    path: `${API_PREFIX}/snowflake`,
    group: "IDs",
    summary: "Decode a snowflake",
    description: "Timestamp, worker, process and increment from any 17-20 digit ID.",
    tools: ["snowflake"],
    params: [
      {
        name: "id",
        in: "query",
        type: "string",
        required: true,
        description: "The snowflake to decode.",
        example: "81384788765712384",
      },
    ],
    handler: (input) => {
      const info = decodeSnowflake(required(input, "id"));
      return {
        id: info.id,
        timestamp: info.timestamp,
        iso: info.date.toISOString(),
        local: info.date.toString(),
        discord: `<t:${Math.floor(info.timestamp / 1000)}:F>`,
        workerId: info.workerId,
        processId: info.processId,
        increment: info.increment,
        age: describeAge(info.date),
      };
    },
  },
  {
    id: "ids.snowflake-create",
    method: "POST",
    path: `${API_PREFIX}/snowflake/create`,
    group: "IDs",
    summary: "Build a snowflake from a date",
    description: "The inverse of the decode endpoint, using Discord's 2015 epoch.",
    tools: ["snowflake"],
    params: [
      p("date", "ISO date or timestamp.", { required: true, example: "2024-01-01T00:00:00Z" }),
      p("worker_id", "Worker id, 0-31.", { type: "number", default: 1 }),
      p("process_id", "Process id, 0-31.", { type: "number", default: 0 }),
      p("increment", "Increment, 0-1023.", { type: "number", default: 0 }),
    ],
    handler: (input) => {
      const date = parseDateInput(required(input, "date"));
      const id = createSnowflake(
        date,
        int(input, "worker_id", 1, 0, 31),
        int(input, "process_id", 0, 0, 31),
        int(input, "increment", 0, 0, 1023),
      );
      return { id, epoch: DISCORD_EPOCH, iso: date.toISOString() };
    },
  },
  {
    id: "ids.mock",
    method: "POST",
    path: `${API_PREFIX}/ids/mock`,
    group: "IDs",
    summary: "Generate fake snowflakes",
    description:
      "Real snowflake-shaped ids for seeding a dev database or testing mention rendering. They decode to a real timestamp, so nobody can tell them apart from a real id by shape alone.",
    tools: ["mock-ids"],
    params: [
      p("count", "How many to generate.", { type: "number", default: 5, example: "10" }),
      p("kind", "What the ids are for. Only changes the wording, never the format.", {
        default: "user",
        enum: ["user", "message", "role"],
      }),
    ],
    handler: (input) => {
      const count = int(input, "count", 5, 1, 50);
      const kind = oneOf(text(input, "kind", "user"), ["user", "message", "role"] as const, "kind");

      // Spread across the next day so the decoded timestamps are not all identical.
      const ids = Array.from({ length: count }, () =>
        createSnowflake(new Date(Date.now() + Math.random() * 86_400_000)),
      );

      return {
        kind,
        ids,
        mentions: ids.map((id) => `<@${id}>`),
        note: "These are valid snowflakes but no account exists behind them.",
      };
    },
  },
  {
    id: "ids.user",
    method: "GET",
    path: `${API_PREFIX}/discord/users/:id`,
    group: "Discord",
    summary: "Look up a user",
    description:
      "Unauthenticated Discord call, relayed so browsers are not blocked by CORS. Discord answers 401 both for a user that does not exist and for one it will not serve without a token, and it does not distinguish the two, so treat a 401 as \"no public profile for this ID\" rather than as proof either way.",
    tools: ["profile-viewer", "account-age", "pfp-grabber", "banner-grabber", "badge-checker"],
    params: [
      {
        name: "id",
        in: "path",
        type: "string",
        required: true,
        description: "User ID, or any string containing one.",
        example: "81384788765712384",
      },
    ],
    handler: async (input) => {
      const id = extractId(input.path.id ?? "") ?? input.path.id;
      return { user: await requireDiscord(input).get(`/users/${id}`) };
    },
  },
  {
    id: "ids.guild",
    method: "GET",
    path: `${API_PREFIX}/discord/guilds/:id`,
    group: "Discord",
    summary: "Look up a server",
    description:
      "Accepts a server ID or a bare invite code. Discord answers 401 on the bare guild route without a bot token, so a code is the reliable option and returns the same guild object. A path segment cannot contain slashes, so strip a discord.gg link down to its code first, or use GET /invites/{code} directly.",
    tools: ["server-lookup"],
    params: [
      {
        name: "id",
        in: "path",
        type: "string",
        required: true,
        description: "Guild ID, invite code or discord.gg link.",
        example: "197038439483310086",
      },
    ],
    handler: async (input) => {
      const raw = input.path.id ?? "";
      const discord = requireDiscord(input);

      // An invite resolves to the full guild object and needs no token, so prefer it when
      // the input looks like one.
      if (!extractId(raw) || /discord\.gg/i.test(raw)) {
        const code = extractCode(raw);
        if (code) {
          const body = (await discord.get(
            `/invites/${code}?with_counts=true&with_expiration=true`,
          )) as { guild?: unknown };
          return { via: "invite", guild: body.guild ?? null };
        }
      }

      const id = extractId(raw) ?? raw;
      try {
        return {
          via: "guild",
          guild: await discord.get(`/guilds/${id}?with_counts=true`),
        };
      } catch (error) {
        // Discord gates this route behind a bot token now. Say so, and say what to do
        // instead, rather than passing a bare 401 back.
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          throw new ApiError(
            401,
            `Discord will not return server ${id} without a bot token. Pass an invite code or discord.gg link instead, which resolves the same server without authentication.`,
          );
        }
        throw error;
      }
    },
  },
  {
    id: "ids.invite",
    method: "GET",
    path: `${API_PREFIX}/discord/invites/:code`,
    group: "Discord",
    summary: "Look up an invite",
    description: "Counts and expiry included. Unauthenticated.",
    tools: ["invite-info"],
    params: [
      {
        name: "code",
        in: "path",
        type: "string",
        required: true,
        description: "Invite code or full discord.gg link.",
        example: "discord",
      },
    ],
    handler: async (input) => {
      const code = extractCode(input.path.code ?? "");
      return {
        invite: await requireDiscord(input).get(
          `/invites/${encodeURIComponent(code)}?with_counts=true&with_expiration=true`,
        ),
      };
    },
  },
  {
    id: "ids.emoji",
    method: "GET",
    path: `${API_PREFIX}/discord/emojis/:id`,
    group: "Discord",
    summary: "Look up an emoji",
    description: "Returns the CDN URL for every size Discord holds.",
    tools: ["emoji-downloader"],
    params: [
      {
        name: "id",
        in: "path",
        type: "string",
        required: true,
        description: "Emoji ID.",
        example: "1234567890123456789",
      },
    ],
    handler: async (input) => ({ emoji: await requireDiscord(input).get(`/emojis/${input.path.id}`) }),
  },
  {
    id: "ids.snowflake-exists",
    method: "GET",
    path: `${API_PREFIX}/discord/snowflakes/:id`,
    group: "Discord",
    summary: "Check whether a snowflake is a real user",
    description:
      "A 404 means the ID does not belong to a user. Useful for verifying an ID someone sent you.",
    tools: ["snowflake", "id-finder"],
    params: [
      {
        name: "id",
        in: "path",
        type: "string",
        required: true,
        description: "Snowflake to check.",
        example: "81384788765712384",
      },
    ],
    handler: async (input) => {
      const decoded = decodeSnowflake(input.path.id);
      try {
        const user = (await requireDiscord(input).get(`/users/${input.path.id}`)) as {
          username?: string;
        };
        return {
          id: input.path.id,
          exists: true,
          username: user.username ?? null,
          createdIso: decoded.date.toISOString(),
        };
      } catch (error) {
        const status = error instanceof ApiError ? error.status : 0;
        if (status === 404) {
          return { id: input.path.id, exists: false, username: null, createdIso: decoded.date.toISOString() };
        }
        throw error;
      }
    },
  },
  {
    id: "invites.extract",
    method: "GET",
    path: `${API_PREFIX}/invites/extract`,
    group: "Invites",
    summary: "Pull the code out of an invite link",
    description: "Pure string handling, no Discord call.",
    tools: ["invite-builder", "invite-info"],
    params: [
      {
        name: "url",
        in: "query",
        type: "string",
        required: true,
        description: "Any invite link or bare code.",
        example: "https://discord.gg/aki",
      },
    ],
    handler: (input) => {
      const url = required(input, "url");
      return { code: extractCode(url), url: `https://discord.gg/${extractCode(url)}` };
    },
  },
  {
    id: "invites.images",
    method: "GET",
    path: `${API_PREFIX}/invites/images`,
    group: "Invites",
    summary: "Resolve a server icon and banner from an invite",
    description:
      "Returns CDN URLs rather than the image bytes, so nothing is proxied through here. Invite splash images are only shown to members who have passed the guild boost requirements.",
    tools: ["invite-images"],
    params: [
      {
        name: "code",
        in: "query",
        type: "string",
        required: true,
        description: "Invite code or full discord.gg link.",
        example: "aki",
      },
      {
        name: "size",
        in: "query",
        type: "string",
        description: "CDN size. 16 to 4096.",
        default: "1024",
      },
    ],
    handler: async (input) => {
      const size = oneOf(text(input, "size", "1024"), CDN_SIZES, "size");
      const code = extractCode(required(input, "code"));
      const body = (await requireDiscord(input).get(
        `/invites/${code}?with_counts=true&with_expiration=true`,
      )) as { guild?: InviteGuild };

      const guild = body.guild;
      if (!guild) return { code, icon: null, banner: null, splash: null, guild: null };

      return {
        code,
        guild: { id: guild.id, name: guild.name, icon: guild.icon, banner: guild.banner },
        icon: iconUrl(guild.id, guild.icon, size),
        // The splash is the fallback Discord shows when a server has no banner.
        banner: bannerUrlFor(guild.id, guild.banner, size) ?? splashUrl(guild.id, guild.splash, size),
        splash: splashUrl(guild.id, guild.splash, size),
      };
    },
  },
  {
    id: "invites.build",
    method: "POST",
    path: `${API_PREFIX}/invites/build`,
    group: "Invites",
    summary: "Validate invite options and build the query string",
    description:
      "Discord only creates invites through an authenticated endpoint. This validates your options and returns the exact query string to send.",
    tools: ["invite-builder"],
    params: [
      p("channel_id", "Channel the invite points at.", { required: true, example: "197038439483310086" }),
      p("guild_id", "Guild ID, for the invite payload."),
      p("max_age", "Seconds before expiry.", { type: "number", default: 86400, example: "3600" }),
      p("max_uses", "0 is unlimited.", { type: "number", default: 0 }),
      p("temporary", "Members get the Temporary Membership flag.", { type: "boolean", default: false }),
      p("unique", "Force a new code.", { type: "boolean", default: true }),
      p("target_type", "1 stream, 2 embedded application."),
      p("target_id", "Target application or stream ID."),
    ],
    handler: (input) => {
      const validation = validateInviteOptions({
        channelId: text(input, "channel_id"),
        guildId: text(input, "guild_id") || undefined,
        maxAge: num(input, "max_age", 86400),
        maxUses: num(input, "max_uses", 0),
        temporary: bool(input, "temporary"),
        unique: bool(input, "unique", true),
        targetType: text(input, "target_type") ? Number(text(input, "target_type")) : undefined,
        targetId: text(input, "target_id") || undefined,
      });
      if (!validation.valid) {
        throw new ApiError(400, validation.errors[0], validation.errors);
      }
      const query = new URLSearchParams(
        Object.entries(validation.query).map(([key, value]) => [key, String(value)]),
      ).toString();
      return {
        ...validation,
        query: validation.query,
        path: `/channels/${validation.query.channel_id}/invites`,
        request: `POST /api/v10/channels/${validation.query.channel_id}/invites?${query}`,
      };
    },
  },
  {
    id: "webhooks.payload",
    method: "POST",
    path: `${API_PREFIX}/webhooks/payload`,
    group: "Webhooks",
    summary: "Build and validate a webhook payload",
    description:
      "Returns the JSON body, the character count and any limit warnings. Webhook URLs are never sent to this API.",
    tools: ["embed-builder"],
    params: [
      p("username", "Webhook username override."),
      p("avatar_url", "Webhook avatar override."),
      p("content", "Message content."),
      p("include_content", "Always include an empty content field.", { type: "boolean", default: false }),
      p("thread_id", "Send into a thread."),
      p("embed", "Embed object: title, description, color, fields and so on.", { type: "object" }),
    ],
    handler: (input) => {
      const embed =
        typeof input.body.embed === "object" && input.body.embed !== null
          ? (input.body.embed as WebhookPayloadInput["embed"])
          : undefined;
      return embedSummary({
        embed,
        username: text(input, "username") || undefined,
        avatarUrl: text(input, "avatar_url") || undefined,
        content: text(input, "content") || undefined,
        includeContent: bool(input, "include_content"),
        threadId: text(input, "thread_id") || undefined,
      });
    },
  },
  {
    id: "webhooks.limits",
    method: "GET",
    path: `${API_PREFIX}/webhooks/limits`,
    group: "Webhooks",
    summary: "Embed and webhook limits",
    description: "The numbers the Embed Builder checks against.",
    tools: ["embed-builder"],
    params: [],
    handler: () => ({
      limits: EMBED_LIMITS,
      rateLimit: {
        perWebhook: "5 requests per 2 seconds",
        perChannel: "5 requests per 2 seconds",
        global: "50 requests per second",
      },
      note: "A 429 comes back with a retry_after in seconds and a global flag.",
    }),
  },
  {
    id: "webhooks.rpc",
    method: "POST",
    path: `${API_PREFIX}/webhooks/rpc`,
    group: "Webhooks",
    summary: "Build a rich presence payload",
    description:
      "The activity shape a bot or RPC client sends to show Playing, Listening to, Watching or Streaming. This endpoint only builds the JSON; it never connects to Discord. Requires no webhook and no token.",
    tools: ["rpc-preview"],
    params: [
      p("text", "Main text, what you are doing.", { required: true, example: "Baldur's Gate 3" }),
      p("verb", "Which activity type to use.", {
        default: "playing",
        enum: RPC_PRESETS.map((preset) => preset.id),
      }),
      p("state", "Optional second line."),
      p("started_at", "Epoch milliseconds, for the elapsed clock.", { type: "number" }),
      p("large_image", "Application icon key or URL."),
      p("small_image", "Secondary icon key or URL."),
    ],
    handler: (input) => {
      try {
        return {
          ...buildPresence({
            verb: oneOf(
              text(input, "verb", "playing"),
              RPC_PRESETS.map((preset) => preset.id),
              "verb",
            ) as "playing",
            text: required(input, "text"),
            ...(text(input, "state") ? { state: text(input, "state") } : {}),
            ...(text(input, "started_at")
              ? { startedAt: int(input, "started_at", Date.now(), 0, 4_102_444_800_000) }
              : {}),
            ...(text(input, "large_image") ? { largeImage: text(input, "large_image") } : {}),
            ...(text(input, "small_image") ? { smallImage: text(input, "small_image") } : {}),
          }),
          verbs: RPC_PRESETS,
        };
      } catch (error) {
        throw new ApiError(400, error instanceof Error ? error.message : "Could not build that presence.");
      }
    },
  },
  {
    id: "permissions.compute",
    method: "POST",
    path: `${API_PREFIX}/permissions`,
    group: "Permissions",
    summary: "Convert permission names to an integer, or back",
    description: "Send names, an integer, or both. Unknown bits are reported rather than dropped.",
    tools: ["permission-calculator"],
    params: [
      p("permissions", "Permission names, comma separated. Case and spacing do not matter.", {
        example: "View Channel,Send Messages",
      }),
      p("integer", "Decimal, 0x hex or 0b binary integer."),
    ],
    handler: (input) => {
      const names = list(input, "permissions");
      const rawInteger = text(input, "integer", "");

      if (names.length === 0 && rawInteger === "") {
        throw new ApiError(400, 'Send "permissions" as names or "integer" as a value.');
      }

      if (rawInteger !== "") {
        const bits = parseInteger(rawInteger);
        return { ...summarize(bits), all: serializePermissions() };
      }

      return { ...summarize(bitsFromNames(names)), all: serializePermissions() };
    },
  },
  {
    id: "permissions.list",
    method: "GET",
    path: `${API_PREFIX}/permissions/all`,
    group: "Permissions",
    summary: "Every permission with its bit",
    description: "Bits are strings because they exceed Number.MAX_SAFE_INTEGER in places.",
    tools: ["permission-calculator"],
    params: [],
    handler: () => ({ permissions: serializePermissions() }),
  },
  {
    id: "emoji.library",
    method: "GET",
    path: `${API_PREFIX}/emojis`,
    group: "Emoji",
    summary: "Search the built-in emoji library",
    description: "The same data the Emoji Library tool renders.",
    tools: ["emoji-library"],
    params: [
      {
        name: "q",
        in: "query",
        type: "string",
        description: "Match against name, character or keywords.",
        example: "cat",
      },
      {
        name: "category",
        in: "query",
        type: "string",
        description: "Category id.",
        enum: [...EMOJI_CATEGORIES],
      },
      {
        name: "limit",
        in: "query",
        type: "number",
        description: "Maximum results, 1-500.",
        default: 100,
      },
    ],
    handler: (input) => {
      const q = text(input, "q").toLowerCase();
      const category = text(input, "category");
      const limit = int(input, "limit", 100, 1, 500);

      const matched = EMOJIS.filter((emoji) => {
        if (category && emoji.category !== category) return false;
        if (!q) return true;
        return (
          emoji.name.toLowerCase().includes(q) ||
          emoji.keywords.some((keyword) => keyword.toLowerCase().includes(q))
        );
      });

      return {
        total: matched.length,
        returned: Math.min(matched.length, limit),
        categories: EMOJI_CATEGORIES,
        emojis: matched.slice(0, limit),
      };
    },
  },
  {
    id: "emoji.categories",
    method: "GET",
    path: `${API_PREFIX}/emojis/categories`,
    group: "Emoji",
    summary: "List emoji categories",
    description: "Category ids for the emoji search endpoint.",
    tools: ["emoji-library"],
    params: [],
    handler: () =>
      EMOJI_CATEGORIES.map((category) => ({
        id: category,
        count: EMOJIS.filter((emoji) => emoji.category === category).length,
      })),
  },
  {
    id: "emoji.color-text",
    method: "POST",
    path: `${API_PREFIX}/emoji/color-text`,
    group: "Emoji",
    summary: "Get coloured text, or find out why you cannot",
    description:
      "Discord does not render coloured text in a normal message. Colour only appears inside embeds, which bots and webhooks can post. In block mode this returns nine shades of the colour for decoration. Block coverage is unreliable: some fonts and themes render them as plain rectangles or not at all, so never use them to convey meaning.",
    tools: ["color-text"],
    params: [
      p("text", "Text to colour.", { required: true, example: "coloured text" }),
      p("hex", "Colour as a hex string.", { required: true, example: "#5865f2" }),
      p("mode", "embed for the payload a bot posts, blocks for the decoration.", {
        default: "embed",
        enum: ["embed", "blocks"],
      }),
    ],
    handler: (input) => {
      const hex = required(input, "hex");
      if (!isHex(hex)) throw new ApiError(400, `"${hex}" is not a hex colour. Use #RRGGBB.`);

      const normalized = hex.startsWith("#") ? hex.toLowerCase() : `#${hex.toLowerCase()}`;
      const rgb = hexToRgb(normalized);
      const decimal = parseInt(normalized.replace("#", "").slice(0, 6), 16);
      const body = required(input, "text");
      const mode = oneOf(text(input, "mode", "embed"), ["embed", "blocks"] as const, "mode");

      const shades = Array.from({ length: 9 }, (_, index) =>
        shadeColor(normalized, ((index - 4) / 4) * 0.55),
      );

      return {
        mode,
        hex: normalized,
        decimal,
        rgb,
        embed: { embeds: [{ description: body, color: decimal }] },
        blocks: shades.map((color) => ({ color, bar: "\u2588".repeat(3) })),
        caveat:
          "Discord renders one message colour only. Embeds are the real answer; blocks are decoration.",
      };
    },
  },
  {
    id: "codecs.base64",
    method: "POST",
    path: `${API_PREFIX}/base64`,
    group: "Developer",
    summary: "Base64 encode or decode",
    description: "Standard and URL-safe alphabets.",
    tools: ["base64"],
    params: [
      p("input", "Value to convert.", { required: true, example: "hello" }),
      p("mode", "encode, decode, encodeUrl or decodeUrl.", {
        default: "encode",
        enum: [...BASE64_MODES],
      }),
    ],
    handler: (input) => {
      const mode = oneOf(text(input, "mode", "encode"), BASE64_MODES, "mode");
      const value = required(input, "input");
      const output =
        mode === "encode"
          ? encodeBase64(value)
          : mode === "decode"
            ? decodeBase64(value)
            : mode === "encodeUrl"
              ? encodeBase64Url(value)
              : decodeBase64Url(value);
      return { mode, output };
    },
  },
  {
    id: "codecs.url",
    method: "POST",
    path: `${API_PREFIX}/url`,
    group: "Developer",
    summary: "Percent-encode or decode a URL component",
    description: "component mode also escapes !'()* the way encodeURIComponent should.",
    tools: ["url-encoder"],
    params: [
      p("input", "Value to convert.", { required: true, example: "a b&c" }),
      p("mode", "encode, decode or component.", { default: "encode", enum: [...URL_MODES] }),
    ],
    handler: (input) => {
      const mode = oneOf(text(input, "mode", "encode"), URL_MODES, "mode");
      const value = required(input, "input");
      const output =
        mode === "encode"
          ? encodeUrl(value)
          : mode === "decode"
            ? decodeUrl(value)
            : encodeUrl(value).replace(/[!'()*]/g, (char) =>
                `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
              );
      return { mode, output };
    },
  },
  {
    id: "dev.json",
    method: "POST",
    path: `${API_PREFIX}/json`,
    group: "Developer",
    summary: "Format, minify or validate JSON",
    description: "Returns the output plus a structural summary of the document.",
    tools: ["json-tool"],
    params: [
      p("input", "JSON text.", { required: true, example: '{"b":1,"a":2}' }),
      p("mode", "What to do with it.", { default: "pretty", enum: [...JSON_MODES] }),
      p("indent", "Spaces per level for pretty mode.", { type: "number", default: 2 }),
      p("sort_keys", "Sort object keys recursively.", { type: "boolean", default: false }),
    ],
    handler: (input) => {
      const mode = oneOf(text(input, "mode", "pretty"), JSON_MODES, "mode") as JsonMode;
      const result = runJsonMode(required(input, "input"), mode, {
        indent: int(input, "indent", 2, 0, 10),
        sortKeys: bool(input, "sort_keys"),
      });
      if (result.error) throw new ApiError(400, result.error);
      const parsed = parseJson(required(input, "input"));
      return { mode, output: result.output, stats: parsed.data === null ? null : jsonStats(parsed.data) };
    },
  },
  {
    id: "dev.uuid",
    method: "GET",
    path: `${API_PREFIX}/uuid`,
    group: "Developer",
    summary: "Generate v4 UUIDs",
    description: "Cryptographically random, from the platform CSPRNG.",
    tools: ["uuid-generator"],
    params: [
      {
        name: "count",
        in: "query",
        type: "number",
        description: "How many, 1-100.",
        default: 1,
        example: "5",
      },
    ],
    handler: (input) => {
      const count = int(input, "count", 1, 1, 100);
      return { count, uuids: Array.from({ length: count }, () => uuidV4()) };
    },
  },
  {
    id: "dev.color",
    method: "POST",
    path: `${API_PREFIX}/color`,
    group: "Developer",
    summary: "Convert a colour between every format",
    description: "Send hex, rgb() or hsl(). Returns hex, rgb, hsl, decimal and contrast data.",
    tools: ["color-converter", "hex-color-picker", "role-color-preview"],
    params: [
      p("hex", "Hex colour, with or without the #.", { example: "#5865f2" }),
      p("rgb", "RGB string or object.", { example: "88, 101, 242" }),
      p("hsl", "HSL string or object.", { example: "235, 86%, 65%" }),
    ],
    handler: (input) => {
      const hexRaw = text(input, "hex");
      const rgbRaw = text(input, "rgb");
      const hslRaw = text(input, "hsl");

      let rgb: { r: number; g: number; b: number };
      if (hexRaw) {
        if (!isHex(hexRaw)) throw new ApiError(400, `"${hexRaw}" is not a valid hex colour.`);
        rgb = hexToRgb(hexRaw.startsWith("#") ? hexRaw : `#${hexRaw}`);
      } else if (rgbRaw) {
        rgb =
          typeof input.body.rgb === "object" && input.body.rgb !== null
            ? (input.body.rgb as { r: number; g: number; b: number })
            : parseRgbString(rgbRaw);
      } else if (hslRaw) {
        rgb =
          typeof input.body.hsl === "object" && input.body.hsl !== null
            ? hslToRgb(input.body.hsl as { h: number; s: number; l: number })
            : hslToRgb(parseHslString(hslRaw));
      } else {
        throw new ApiError(400, 'Send one of "hex", "rgb" or "hsl".');
      }

      const hex = rgbToHex(rgb);
      const hsl = rgbToHsl(rgb);
      const contrast = contrastAgainst(hex);

      return {
        hex,
        rgb,
        hsl,
        rgbString: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
        hslString: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
        decimal: parseInt(hex.slice(1), 16),
        luminance: Math.round(relativeLuminance(rgb) * 10000) / 10000,
        label: luminanceLabel(hex),
        contrast,
      };
    },
  },
  {
    id: "dev.password",
    method: "POST",
    path: `${API_PREFIX}/password`,
    group: "Developer",
    summary: "Generate a password and score it",
    description: "Character pools are configurable. Scoring matches the Password Generator tool.",
    tools: ["password-generator"],
    params: [
      p("length", "Characters, 4-128.", { type: "number", default: DEFAULT_PASSWORD.length, example: "24" }),
      p("uppercase", "Include A-Z.", { type: "boolean", default: DEFAULT_PASSWORD.uppercase }),
      p("lowercase", "Include a-z.", { type: "boolean", default: DEFAULT_PASSWORD.lowercase }),
      p("digits", "Include 0-9.", { type: "boolean", default: DEFAULT_PASSWORD.digits }),
      p("symbols", "Include punctuation.", { type: "boolean", default: DEFAULT_PASSWORD.symbols }),
      p("avoid_ambiguous", "Drop l, 1, I, O, 0 and similar.", {
        type: "boolean",
        default: DEFAULT_PASSWORD.avoidAmbiguous,
      }),
    ],
    handler: (input) => {
      const options: PasswordOptions = {
        length: int(input, "length", DEFAULT_PASSWORD.length, 4, 128),
        uppercase: bool(input, "uppercase", DEFAULT_PASSWORD.uppercase),
        lowercase: bool(input, "lowercase", DEFAULT_PASSWORD.lowercase),
        digits: bool(input, "digits", DEFAULT_PASSWORD.digits),
        symbols: bool(input, "symbols", DEFAULT_PASSWORD.symbols),
        avoidAmbiguous: bool(input, "avoid_ambiguous", DEFAULT_PASSWORD.avoidAmbiguous),
      };
      if (!options.uppercase && !options.lowercase && !options.digits && !options.symbols) {
        throw new ApiError(400, "Leave at least one character set enabled.");
      }
      const password = generatePassword(options);
      return { password, strength: estimateStrength(password), options };
    },
  },
  {
    id: "dev.token",
    method: "POST",
    path: `${API_PREFIX}/token/decode`,
    group: "Developer",
    summary: "Read the structure of a token",
    description:
      "Decodes locally and sends nothing onward. The third segment is masked before it leaves the handler.",
    tools: ["token-inspector"],
    params: [p("token", "A token you already own.", { required: true })],
    handler: (input) => {
      const token = required(input, "token");
      const shape = inspectToken(token);
      return {
        valid: shape.valid,
        error: shape.error ?? null,
        userId: shape.userId,
        issuedAt: shape.issuedAtIso,
        segmentCount: shape.segments.length,
        masked: maskToken(token),
      };
    },
  },
  {
    id: "dev.timestamp",
    method: "POST",
    path: `${API_PREFIX}/timestamp`,
    group: "Developer",
    summary: "Convert a date to Discord timestamp formats",
    description: "Every style the Timestamp Generator shows.",
    tools: ["timestamp-generator"],
    params: [p("date", "ISO date or timestamp. Defaults to now.", { example: "2024-01-01T00:00:00Z" })],
    handler: (input) => {
      const raw = text(input, "date");
      const date = raw ? parseDateInput(raw) : new Date();
      const stamp = formatStamp(date);
      return {
        iso: date.toISOString(),
        epochSeconds: Math.floor(date.getTime() / 1000),
        epochMilliseconds: date.getTime(),
        unix: stamp.unix,
        relative: stamp.relative,
        isoString: stamp.iso,
        styles: {
          shortTime: stamp.shortTime,
          longTime: stamp.longTime,
          shortDate: stamp.shortDate,
          longDate: stamp.longDate,
          relative: stamp.relative,
        },
        tags: stamp.tags,
        relativeText: relativeFrom(date),
      };
    },
  },
  {
    id: "dev.message-link",
    method: "GET",
    path: `${API_PREFIX}/message-links`,
    group: "Developer",
    summary: "Split a message link into IDs",
    description: "Works for server messages, DMs and threads.",
    tools: ["message-link"],
    params: [
      {
        name: "url",
        in: "query",
        type: "string",
        required: true,
        description: "A discord.com message link.",
        example: "https://discord.com/channels/197038439483310086/123456789012345678/123456789012345679",
      },
    ],
    handler: (input) => {
      const url = required(input, "url");
      const parts = parseMessageLink(url);
      if (!parts) throw new ApiError(400, "That does not look like a Discord message link.");
      return {
        ...parts,
        jump: `https://discord.com/channels/${parts.guildId}/${parts.channelId}/${parts.messageId}`,
      };
    },
  },
  {
    id: "dev.markdown",
    method: "GET",
    path: `${API_PREFIX}/markdown`,
    group: "Developer",
    summary: "Discord markdown reference",
    description: "The table behind the Markdown Guide tool.",
    tools: ["markdown-guide"],
    params: [],
    handler: () => MARKDOWN_ROWS,
  },
  {
    id: "dev.badges",
    method: "GET",
    path: `${API_PREFIX}/badges`,
    group: "Discord",
    summary: "List every user badge",
    description: "Badge ids and descriptions, for building a badge viewer.",
    tools: ["badge-library", "badge-checker"],
    params: [],
    handler: () => ({ groups: BADGE_GROUPS, badges: BADGES }),
  },
  {
    id: "misc.vtt",
    method: "POST",
    path: `${API_PREFIX}/vtt`,
    group: "Misc",
    summary: "Parse WebVTT captions",
    description: "Returns cue timings in seconds plus a Discord soundboard payload.",
    tools: ["vtt-tool"],
    params: [p("input", "VTT file contents.", { required: true })],
    handler: (input) => vttResult(required(input, "input")),
  },
  {
    id: "misc.age",
    method: "POST",
    path: `${API_PREFIX}/age`,
    group: "Misc",
    summary: "Age statistics for a date",
    description: "Same breakdown as the Age Tool.",
    tools: ["age-tool"],
    params: [
      p("dob", "Date of birth, YYYY-MM-DD or ISO.", { required: true, example: "2000-04-01" }),
      p("from", "Reference date. Defaults to now.", { example: "2026-01-01" }),
    ],
    handler: (input) => {
      const birth = parseDateInput(required(input, "dob"));
      const fromRaw = text(input, "from");
      return ageStats(birth, fromRaw ? parseDateInput(fromRaw) : new Date());
    },
  },
  {
    id: "misc.countdown",
    method: "POST",
    path: `${API_PREFIX}/countdown`,
    group: "Misc",
    summary: "Format seconds as a countdown",
    description: "Returns the breakdown the Countdown tool renders.",
    tools: ["countdown"],
    params: [
      p("seconds", "Total seconds.", { type: "number", required: true, example: "93784" }),
    ],
    handler: (input) => {
      const seconds = num(input, "seconds", 0);
      return {
        seconds,
        formatted: formatCountdown(seconds),
        days: Math.floor(seconds / 86400),
        hours: Math.floor((seconds % 86400) / 3600),
        minutes: Math.floor((seconds % 3600) / 60),
        remainingSeconds: Math.floor(seconds % 60),
      };
    },
  },
  {
    id: "misc.sounds",
    method: "GET",
    path: `${API_PREFIX}/sounds`,
    group: "Misc",
    summary: "List the synthesised soundboard",
    description:
      "Audio is generated with the Web Audio API, so there is nothing to download. This returns the definitions.",
    tools: ["soundboard", "discord-sfx"],
    params: [],
    handler: () => ({
      count: SOUNDS.length,
      groups: Array.from(new Set(SOUNDS.map((sound) => sound.group))),
      sounds: SOUNDS.map((sound) => ({
        id: sound.id,
        name: sound.name,
        group: sound.group,
        duration: sound.duration,
        description: sound.description,
        tones: sound.tones?.length ?? 0,
        noise: sound.noise?.length ?? 0,
      })),
    }),
  },
  {
    id: "gen.username",
    method: "GET",
    path: `${API_PREFIX}/generate/usernames`,
    group: "Generators",
    summary: "Generate usernames",
    description: "Every username style the generator offers.",
    tools: ["username-generator"],
    params: [
      {
        name: "style",
        in: "query",
        type: "string",
        description: "Style id.",
        default: "aesthetic",
        enum: ["aesthetic", "minimal", "gamer", "leetspeak", "twoWord", "symbolic"],
      },
      {
        name: "count",
        in: "query",
        type: "number",
        description: "How many, 1-50.",
        default: 10,
      },
    ],
    handler: (input) => {
      const style = text(input, "style", "aesthetic") as UsernameStyle;
      const count = int(input, "count", 10, 1, 50);
      return { style, count, usernames: generateUsernames(style, count) };
    },
  },
  {
    id: "gen.nickname",
    method: "GET",
    path: `${API_PREFIX}/generate/nicknames`,
    group: "Generators",
    summary: "Generate nicknames",
    description: "Shorter, plainer versions of the username list.",
    tools: ["nickname-generator"],
    params: [
      { name: "count", in: "query", type: "number", description: "How many, 1-50.", default: 10 },
    ],
    handler: (input) => ({ nicknames: generateNicknames(int(input, "count", 10, 1, 50)) }),
  },
  {
    id: "gen.bio",
    method: "GET",
    path: `${API_PREFIX}/generate/bio`,
    group: "Generators",
    summary: "Generate a bio",
    description: "One line bios that fit Discord's 190 character custom status.",
    tools: ["bio-generator"],
    params: [{ name: "count", in: "query", type: "number", description: "How many, 1-50.", default: 10 }],
    handler: (input) => ({
      bios: Array.from({ length: int(input, "count", 10, 1, 50) }, () => generateBio()),
    }),
  },
  {
    id: "gen.server",
    method: "GET",
    path: `${API_PREFIX}/generate/server`,
    group: "Generators",
    summary: "Generate a server name",
    description: "Also returns a matching channel set.",
    tools: ["server-name-generator", "channel-name-generator"],
    params: [
      { name: "channels", in: "query", type: "number", description: "Channel names, 1-30.", default: 8 },
    ],
    handler: (input) => ({
      server: generateServerName(),
      role: generateRole(),
      channels: generateChannelSet(int(input, "channels", 8, 1, 30)),
    }),
  },
  {
    id: "gen.channel",
    method: "GET",
    path: `${API_PREFIX}/generate/channels`,
    group: "Generators",
    summary: "Generate channel names",
    description: "Lowercase, hyphenated, Discord-safe.",
    tools: ["channel-name-generator"],
    params: [{ name: "count", in: "query", type: "number", description: "How many, 1-50.", default: 10 }],
    handler: (input) => ({
      channels: Array.from({ length: int(input, "count", 10, 1, 50) }, () => generateChannelName()),
    }),
  },
  {
    id: "gen.role",
    method: "GET",
    path: `${API_PREFIX}/generate/roles`,
    group: "Generators",
    summary: "Generate role names",
    description: "With a suggested hex colour for each.",
    tools: ["role-name-generator"],
    params: [{ name: "count", in: "query", type: "number", description: "How many, 1-50.", default: 10 }],
    handler: (input) => ({
      roles: Array.from({ length: int(input, "count", 10, 1, 50) }, () => generateRoleName()),
      palette: ROLE_PALETTE,
    }),
  },
  {
    id: "gen.rules",
    method: "POST",
    path: `${API_PREFIX}/generate/rules`,
    group: "Generators",
    summary: "Assemble a rules template",
    description: "Pick template titles and this fills in the wording.",
    tools: ["rules-generator"],
    params: [
      p("titles", "Template titles to include.", { required: true, example: "Be respectful,No spam" }),
      p("server_name", "Substituted into the wording."),
    ],
    handler: (input) => {
      const wanted = list(input, "titles");
      const templates = wanted.length
        ? RULE_TEMPLATES.filter((template) =>
            wanted.some(
              (title) =>
                title.toLowerCase() === template.id ||
                title.toLowerCase() === template.name.toLowerCase(),
            ),
          )
        : RULE_TEMPLATES.slice(0, 6);

      if (wanted.length > 0 && templates.length === 0) {
        throw new ApiError(
          400,
          `None of those matched a template. Try one of: ${RULE_TEMPLATES.map((t) => t.id).join(", ")}.`,
        );
      }

      const options: RuleSetOptions = {
        serverName: text(input, "server_name", "the server"),
        tone: oneOf(
          text(input, "tone", "friendly"),
          ["friendly", "strict", "minimal"] as const,
          "tone",
        ),
        numbering: oneOf(
          text(input, "numbering", "numbers"),
          ["numbers", "bullets"] as const,
          "numbering",
        ),
      };

      const rules = buildRules(templates, options);
      return { rules, count: rules.length, templates, options };
    },
  },
  {
    id: "gen.welcome",
    method: "POST",
    path: `${API_PREFIX}/generate/welcome`,
    group: "Generators",
    summary: "Assemble a welcome message",
    description: "Server name and member count are substituted into the template.",
    tools: ["welcome-generator"],
    params: [
      p("server_name", "Server name.", { required: true, example: "Aki's Tools" }),
      p("user_name", "Name of the member being welcomed.", { default: "friend", example: "dani" }),
      p("member_count", "Member count shown in the message.", { type: "number", example: "1284" }),
      p("channel_name", "Channel to point them at.", { example: "rules" }),
      p("rules_url", "Link to the rules.", { example: "https://discord.gg/aki" }),
      p("style", "embed, plain or image.", { default: "plain", enum: ["embed", "plain", "image"] }),
      p("accent", "Hex colour for the embed style.", { default: "#5865f2", example: "#5865f2" }),
    ],
    handler: (input) => {
      const options: WelcomeOptions = {
        serverName: required(input, "server_name"),
        userName: text(input, "user_name", "friend"),
        memberCount: num(input, "member_count", 0),
        rulesUrl: text(input, "rules_url") || undefined,
        channelName: text(input, "channel_name") || undefined,
        style: oneOf(text(input, "style", "plain"), ["embed", "plain", "image"] as const, "style"),
        accent: text(input, "accent", "#5865f2"),
      };
      return { message: buildWelcome(options), options };
    },
  },
];

/* --------------------------------- router -------------------------------- */

export interface ApiOptions {
  discord?: DiscordGateway;
  version?: string;
  /** Overrides the public origin used in docs and cURL examples. */
  origin?: string;
  /** Overrides the build-time `DISTOOLS_CONFIG`. Used by the bake step, which runs outside Vite. */
  config?: DistoolsConfig;
  /** Best-effort per-IP throttle. */
  rateLimit?: { limit: number; windowMs: number };
}

export interface ApiIndexEntry {
  id: string;
  method: string;
  path: string;
  group: string;
  summary: string;
  tools: string[];
  params: ApiParam[];
}

interface Bucket {
  count: number;
  reset: number;
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function segments(path: string): string[] {
  return path.split("/").filter(Boolean);
}

/** Matches `/api/v1/discord/users/:id` style templates. */
function matchPath(template: string, actual: string): Record<string, string> | null {
  const templateParts = segments(template);
  const actualParts = segments(actual);
  if (templateParts.length !== actualParts.length) return null;

  const params: Record<string, string> = {};
  for (const [index, part] of templateParts.entries()) {
    const value = actualParts[index];
    if (part.startsWith(":")) {
      params[part.slice(1)] = decodeURIComponent(value);
      continue;
    }
    if (part !== value) return null;
  }
  return params;
}

/**
 * The site is served by GitHub Pages, which is a file host: it only ever answers GET and HEAD,
 * and there is no process behind it to read a request body. So every endpoint is reachable as
 * a plain URL with query parameters, and the POST form is kept purely as a convenience for
 * callers that would rather send a body.
 */
export function methodAllowed(endpoint: ApiEndpoint, method: string): boolean {
  if (method === endpoint.method) return true;
  return endpoint.method === "POST" && method === "GET";
}

/** True when the endpoint runs with no parameters at all, so it can be baked to a file. */
export function isStaticEndpoint(endpoint: ApiEndpoint): boolean {
  return endpoint.params.every((param) => !param.required);
}

/** The URL a caller can paste into a browser. Always a GET, always query parameters. */
export function staticUrl(
  endpoint: ApiEndpoint,
  origin: string,
  example: Record<string, string> = {},
): string {
  const url = new URL(endpoint.path.replace(/:([A-Za-z0-9_]+)/g, (_, key: string) => example[key] ?? "id"), origin);
  for (const param of endpoint.params) {
    if (param.in === "path") continue;
    const value = example[param.name];
    if (value === undefined) continue;
    if (param.type === "string[]") {
      for (const entry of String(value).split(",")) url.searchParams.append(param.name, entry.trim());
    } else {
      url.searchParams.set(param.name, String(value));
    }
  }
  return url.toString();
}

export function createApi(options: ApiOptions = {}) {
  const service = options.config ?? config;
  const version = options.version ?? API_VERSION;
  const buckets = new Map<string, Bucket>();

  const throttle = (request: Request): ApiError | null => {
    if (!options.rateLimit) return null;
    const { limit, windowMs } = options.rateLimit;
    const key = request.headers.get("CF-Connecting-IP") ?? "anonymous";
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now > bucket.reset) {
      buckets.set(key, { count: 1, reset: now + windowMs });
      return null;
    }
    bucket.count += 1;
    if (bucket.count > limit) {
      return new ApiError(429, "Too many requests. Slow down.");
    }
    return null;
  };

  const describe = (endpoint: ApiEndpoint): ApiIndexEntry => ({
    id: endpoint.id,
    // GET is the canonical wire method even where a body is accepted, because the site is
    // served as static files.
    method: "GET",
    path: endpoint.path,
    group: endpoint.group,
    summary: endpoint.summary,
    tools: endpoint.tools,
    params: endpoint.params,
  });

  const openapi = (origin: string) => {
    const paths: Record<string, Record<string, unknown>> = {};

    const schemaFor = (param: ApiParam) => ({
      type: param.type === "number" ? "number" : param.type === "boolean" ? "boolean" : "string",
      ...(param.default !== undefined ? { default: param.default } : {}),
      ...(param.enum ? { enum: param.enum } : {}),
    });

    for (const endpoint of ENDPOINTS) {
      const concrete = endpoint.path.replace(/:([A-Za-z_]+)/g, "{$1}");

      const responses = {
        "200": {
          description: "Success.",
          content: { "application/json": { schema: { type: "object" } } },
        },
        "400": { description: "Bad request." },
      };

      // The GET form is what a file host can actually serve, so every body parameter is
      // re-described as a query parameter here.
      const getParameters = endpoint.params
        .filter((param) => param.in !== "body")
        .map((param) => ({
          name: param.name,
          in: param.in,
          required: Boolean(param.required),
          description: param.description,
          ...(param.example ? { example: param.example } : {}),
          schema: schemaFor(param),
        }))
        .concat(
          endpoint.params
            .filter((param) => param.in === "body")
            .map((param) => ({
              name: param.name,
              in: "query",
              required: Boolean(param.required),
              description: param.description,
              ...(param.type === "string[]" ? { style: "form", explode: true } : {}),
              ...(param.example ? { example: param.example } : {}),
              schema: schemaFor(param),
            })),
        );

      const bodyParams = endpoint.params.filter((param) => param.in === "body");
      const requestBody =
        bodyParams.length > 0
          ? {
              required: bodyParams.some((param) => param.required),
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: Object.fromEntries(
                      bodyParams.map((param) => [
                        param.name,
                        {
                          ...schemaFor(param),
                          ...(param.type === "string[]" ? { type: "array", items: { type: "string" } } : {}),
                          ...(param.description ? { description: param.description } : {}),
                          ...(param.example ? { example: param.example } : {}),
                        },
                      ]),
                    ),
                  },
                },
              },
            }
          : undefined;

      const operation = (method: "get" | "post", parameters: unknown[], body?: unknown) => ({
        [method]: {
          summary: endpoint.summary,
          description:
            method === "get"
              ? endpoint.description
              : `${endpoint.description}\n\nThe POST form takes the same parameters in a JSON body. It is not served by GitHub Pages, which only answers GET and HEAD, but it is what a self-hosted copy of this handler expects.`,
          tags: [endpoint.group],
          operationId: method === "get" ? endpoint.id : `${endpoint.id}Post`,
          ...(parameters.length ? { parameters } : {}),
          ...(body ? { requestBody: body } : {}),
          responses,
        },
      });

      paths[concrete] = {
        ...operation("get", getParameters),
        ...(endpoint.method === "POST" ? operation("post", [], requestBody) : {}),
      };
    }

    return {
      openapi: "3.1.0",
      info: {
        title: `${service.service_name} API`,
        version,
        description:
          "Read-only helpers that mirror the tools on the site. No authentication, no user data stored. Webhook URLs are never accepted.\n\nEvery endpoint is a pure function served from static files, so the canonical method is GET with query parameters. POST is accepted too by any self-hosted copy of the handler.",
        license: { name: service.license, url: `${origin}/LICENSE` },
      },
      servers: [{ url: origin }],
      tags: Array.from(new Set(ENDPOINTS.map((endpoint) => endpoint.group))).map((name) => ({
        name,
      })),
      paths,
    };
  };

  const index = () => {
    const groups = Array.from(new Set(ENDPOINTS.map((endpoint) => endpoint.group))).map((name) => ({
      name,
      endpoints: ENDPOINTS.filter((endpoint) => endpoint.group === name).map(describe),
    }));
    return {
      name: `${service.service_name} API`,
      version,
      openapi: `${API_PREFIX}/openapi.json`,
      docs: `${(options.origin ?? DEFAULT_ORIGIN).replace(/^https?:\/\//, "")}/docs`,
      client: `${API_PREFIX}/client.js`,
      endpoints: ENDPOINTS.length,
      groups,
    };
  };

  const toolIndex = () => {
    const tools = new Map<string, { endpoints: string[]; requests: string[] }>();
    for (const endpoint of ENDPOINTS) {
      for (const slug of endpoint.tools) {
        const entry = tools.get(slug) ?? { endpoints: [], requests: [] };
        entry.endpoints.push(`${endpoint.method} ${endpoint.path}`);
        if (endpoint.group === "Discord") {
          entry.requests.push(`GET ${DISCORD_API}${discordPathFor(endpoint)}`);
        }
        tools.set(slug, entry);
      }
    }
    return Object.fromEntries(tools);
  };

  const handle = async (request: Request): Promise<Response> => {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    const limited = throttle(request);
    if (limited) {
      return json({ error: { message: limited.message, status: 429 } }, 429, CORS_HEADERS);
    }

    if (path === `${API_PREFIX}` || path === `${API_PREFIX}/` || path === "/api") {
      return json(index(), 200, CORS_HEADERS);
    }
    if (path === `${API_PREFIX}/health`) {
      return json({ status: "ok", version, uptime: null }, 200, CORS_HEADERS);
    }
    if (path === `${API_PREFIX}/openapi.json`) {
      return json(openapi(options.origin ?? url.origin), 200, CORS_HEADERS);
    }
    if (path === `${API_PREFIX}/tools`) {
      return json({ tools: toolIndex() }, 200, CORS_HEADERS);
    }

    let body: Record<string, unknown> = {};
    if (request.method === "POST") {
      const contentType = request.headers.get("Content-Type") ?? "";
      if (contentType.includes("application/json")) {
        try {
          body = ((await request.json()) as Record<string, unknown>) ?? {};
        } catch {
          return json(
            { error: { message: "Request body is not valid JSON.", status: 400 } },
            400,
            CORS_HEADERS,
          );
        }
      } else {
        const form = await request.formData();
        body = Object.fromEntries(form.entries());
      }
    }

    for (const endpoint of ENDPOINTS) {
      const pathParams = matchPath(endpoint.path, path);
      if (!pathParams) continue;
      if (!methodAllowed(endpoint, request.method)) continue;

      const input: ApiInput = {
        path: pathParams,
        query: url.searchParams,
        body,
        ...(options.discord ? { discord: options.discord } : {}),
      };

      try {
        const result = await endpoint.handler(input);
        return json({ data: result, endpoint: endpoint.id, method: request.method, path }, 200, {
          ...CORS_HEADERS,
          "Cache-Control": endpoint.group === "Discord" ? "public, max-age=60" : "no-store",
        });
      } catch (error) {
        if (error instanceof ApiError) {
          return json(
            {
              error: {
                message: error.message,
                status: error.status,
                ...(error.details ? { details: error.details } : {}),
              },
              endpoint: endpoint.id,
            },
            error.status,
            CORS_HEADERS,
          );
        }
        return json(
          {
            error: {
              message:
                error instanceof Error ? error.message : "Something went wrong handling that.",
              status: 400,
            },
            endpoint: endpoint.id,
          },
          400,
          CORS_HEADERS,
        );
      }
    }

    const existsElsewhere = ENDPOINTS.some((endpoint) => matchPath(endpoint.path, path));
    return json(
      {
        error: {
          message: existsElsewhere
            ? `${request.method} is not allowed on ${path}.`
            : `No endpoint at ${path}. See ${API_PREFIX} for the list.`,
          status: existsElsewhere ? 405 : 404,
        },
      },
      existsElsewhere ? 405 : 404,
      CORS_HEADERS,
    );
  };

  return { handle, openapi, index, endpoints: ENDPOINTS, toolIndex };
}

/** The Discord path an endpoint wraps, for docs and cURL examples. */
function discordPathFor(endpoint: ApiEndpoint): string {
  switch (endpoint.id) {
    case "ids.user":
      return "/users/:id";
    case "ids.guild":
      return "/guilds/:id";
    case "ids.invite":
      return "/invites/:code";
    case "ids.emoji":
      return "/emojis/:id";
    case "ids.snowflake-exists":
      return "/users/:id";
    default:
      return endpoint.path;
  }
}

/**
 * Snippets for the per-tool panel and the docs.
 *
 * There are two ways to call this API and it is worth being precise about which is which.
 *
 * - A shareable URL, which the site answers itself when you open it. This always works.
 * - The client module, `distools.itzdanti.dev/api/v1/client.js`, which bundles the same
 *   handler. This is what scripts should use, because GitHub Pages has no process behind it
 *   and cannot execute a query string: a plain `fetch` of a parameterised endpoint from
 *   another site gets the HTML shell back, not the computed answer.
 */
function queryFor(endpoint: ApiEndpoint, example: Record<string, string>): URLSearchParams {
  const query = new URLSearchParams();
  for (const param of endpoint.params) {
    if (param.in === "path") continue;
    const value = example[param.name] ?? (param.default !== undefined ? String(param.default) : param.example);
    if (value === undefined || value === "") continue;
    if (param.type === "string[]") {
      for (const entry of String(value).split(",")) {
        const trimmed = entry.trim();
        if (trimmed) query.append(param.name, trimmed);
      }
    } else {
      query.set(param.name, String(value));
    }
  }
  return query;
}

function concretePath(endpoint: ApiEndpoint, example: Record<string, string>): string {
  return endpoint.path.replace(/:([A-Za-z0-9_]+)/g, (_, key: string) => example[key] ?? `:${key}`);
}

/** The shareable GET URL for an endpoint, query parameters included. */
export function urlFor(endpoint: ApiEndpoint, origin: string, example: Record<string, string> = {}): string {
  const search = queryFor(endpoint, example).toString();
  return `${origin}${concretePath(endpoint, example)}${search ? `?${search}` : ""}`;
}

/** The example payload a POST body would carry, for callers that prefer one. */
function bodyExample(endpoint: ApiEndpoint, example: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    endpoint.params
      .filter((param) => param.in === "body")
      .map((param) => [param.name, example[param.name] ?? param.example ?? param.default ?? ""])
      .filter(([, value]) => value !== ""),
  );
}

export function curlFor(endpoint: ApiEndpoint, origin: string, example: Record<string, string> = {}): string {
  return `curl "${urlFor(endpoint, origin, example)}"`;
}

export function fetchFor(endpoint: ApiEndpoint, origin: string, example: Record<string, string> = {}): string {
  const path = concretePath(endpoint, example);
  const args = queryFor(endpoint, example);
  const pairs = [...args.entries()].map(([key, value]) => `      ${key}: ${JSON.stringify(value)},`);
  const argument = pairs.length > 0 ? `, {\n${pairs.join("\n")}\n    }` : "";
  return [
    `import { api } from "${origin}/client.js";`,
    ``,
    `const { data } = await api.get(${JSON.stringify(path)}${argument});`,
  ].join("\n");
}

/** The POST form, kept for callers running their own copy of the handler behind a real server. */
export function postFor(endpoint: ApiEndpoint, origin: string, example: Record<string, string> = {}): string {
  const payload = bodyExample(endpoint, example);
  return [
    `curl -X POST "${origin}${concretePath(endpoint, example)}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '${JSON.stringify(payload)}'`,
  ].join("\n");
}

export function endpointsForTool(slug: string): ApiEndpoint[] {
  return ENDPOINTS.filter((endpoint) => endpoint.tools.includes(slug));
}
