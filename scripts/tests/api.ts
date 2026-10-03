import { ApiError, createApi } from "../../src/lib/core/api";

const calls: string[] = [];

const api = createApi({
  origin: "https://api.example.dev",
  rateLimit: { limit: 500, windowMs: 60_000 },
  discord: {
    async get(path) {
      calls.push(path);
      if (path.startsWith("/invites/")) {
      return {
        code: path.slice("/invites/".length),
        guild: {
          id: "197038439483310086",
          name: "Aki",
          icon: "a_f9d8e6b7c1d2e3f4a5b6c7d8e9f0a1b",
          banner: null,
          splash: "1b2c3d4e5f60718293a4b5c6d7e8f901",
        },
      };
    }
    if (path.startsWith("/guilds/")) {
      return { id: "197038439483310086", name: "Aki", member_count: 4200 };
    }
    return { id: "81384788765712384", username: "aki", path };
    },
  },
});

async function call(method: string, path: string, body?: unknown) {
  const res = await api.handle(
    new Request(`https://api.example.dev${path}`, {
      method,
      ...(body
        ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }
        : {}),
    }),
  );
  const json = (await res.json()) as Record<string, any>;
  const status = res.status;
  const ok = status < 400;
  console.log(`${ok ? "PASS" : "FAIL"} ${method} ${path} -> ${status}`);
  if (!ok) console.log(`      ${JSON.stringify(json).slice(0, 200)}`);
  return json;
}

const results: [string, boolean][] = [];
const check = (name: string, condition: boolean, detail = "") => {
  results.push([name, condition]);
  if (!condition) console.log(`  assert failed: ${name} ${detail}`);
};

// Meta endpoints.
const index = await call("GET", "/api/v1");
check("index lists endpoints", (index.endpoints ?? 0) >= 30);
check("index has groups", Array.isArray(index.groups) && index.groups.length > 0);

const health = await call("GET", "/api/v1/health");
check("health ok", health.status === "ok" && typeof health.version === "string");

const openapi = await call("GET", "/api/v1/openapi.json");
check("openapi paths", Object.keys(openapi.paths ?? {}).length >= 30);

const tools = await call("GET", "/api/v1/tools");
check("tool index", Object.keys(tools.tools ?? {}).length >= 25);

// Snowflake.
const snow = await call("GET", "/api/v1/snowflake?id=81384788765712384");
check("snowflake iso", typeof snow.data?.iso === "string" && snow.data.iso.endsWith("Z"));
check("snowflake discord tag", String(snow.data?.discord ?? "").startsWith("<t:"));

const created = await call("POST", "/api/v1/snowflake/create", { date: "2024-01-01T00:00:00Z" });
check("snowflake create", /^\d{17,20}$/.test(created.data?.id ?? ""));

// Text.
const fancy = await call("POST", "/api/v1/text/fancy", { text: "hello", style: "bold" });
check("fancy text", typeof fancy.data?.output === "string" && fancy.data.output.length > 0);

const stats = await call("POST", "/api/v1/text/stats", { text: "one two three" });
check("text stats", stats.data?.words === 3);

const transform = await call("POST", "/api/v1/text/transform", { text: "hello world", mode: "title" });
check("transform title", transform.data?.output === "Hello World");

const zalgo = await call("POST", "/api/v1/text/zalgo", { text: "a", mode: "up", amount: 2 });
check("zalgo", (zalgo.data?.output ?? "").length > 1);

const divider = await call("POST", "/api/v1/text/divider", { char: "-", length: 5 });
check("divider", divider.data?.output === "-----");

const mentions = await call("POST", "/api/v1/text/mentions", {
  type: "user",
  ids: "81384788765712384",
});
check("mentions", mentions.data?.output === "<@81384788765712384>");

const spoiler = await call("POST", "/api/v1/text/spoiler", { text: "a\nb", mode: "line" });
check("spoiler", spoiler.data?.output === "||a||\n||b||");

// Codecs and dev.
const b64 = await call("POST", "/api/v1/base64", { input: "hello", mode: "encode" });
check("base64 encode", b64.data?.output === "aGVsbG8=");

const b64d = await call("POST", "/api/v1/base64", { input: "aGVsbG8=", mode: "decode" });
check("base64 decode", b64d.data?.output === "hello");

const uuid = await call("GET", "/api/v1/uuid?count=3");
check("uuid count", (uuid.data?.uuids ?? []).length === 3);

const json = await call("POST", "/api/v1/json", { input: '{"b":1,"a":2}', mode: "pretty", sort_keys: true });
check("json sorted", json.data?.output?.startsWith('{\n  "a"') === true);
check("json stats", json.data?.stats?.keys === 2);

const color = await call("POST", "/api/v1/color", { hex: "#5865F2" });
check("color hex", color.data?.hex?.toLowerCase() === "#5865f2");
check("color decimal", color.data?.decimal === 5793266);

const password = await call("POST", "/api/v1/password", { length: 16 });
check("password length", password.data?.password?.length === 16);

const token = await call("POST", "/api/v1/token/decode", {
  token: "MTIzNDU2Nzg5MDEyMzQ1Njc4.eyJfaXNzdWVkX2F0IjoxNzAwMDAwMDAwMH0.c2lnbmF0dXJl",
});
check("token user", token.data?.userId === "123456789012345678");
check("token masked", String(token.data?.masked).includes("\u2022"));

const stamp = await call("POST", "/api/v1/timestamp", { date: "2024-01-01T00:00:00Z" });
check("timestamp unix", stamp.data?.epochSeconds === 1704067200);

const link = await call("GET", "/api/v1/message-links?url=https://discord.com/channels/197038439483310086/123456789012345678/123456789012345679");
check("message link", link.data?.messageId === "123456789012345679");

const emoji = await call("GET", "/api/v1/emojis?q=cat&limit=5");
check("emoji search", (emoji.data?.emojis ?? []).length > 0);

const markdown = await call("GET", "/api/v1/markdown");
check("markdown rows", (markdown.data ?? []).length > 20);

const sounds = await call("GET", "/api/v1/sounds");
check("sounds", sounds.data?.count > 10);

const usernames = await call("GET", "/api/v1/generate/usernames?style=gamer&count=4");
check("usernames", (usernames.data?.usernames ?? []).length === 4);

const rules = await call("POST", "/api/v1/generate/rules", {
  titles: "respect,nospam",
  server_name: "Aki",
});
check("rules", (rules.data?.rules ?? []).length > 2);

const welcome = await call("POST", "/api/v1/generate/welcome", {
  server_name: "Aki",
  user_name: "dani",
  member_count: 10,
  style: "plain",
});
check("welcome", String(welcome.data?.message ?? "").includes("dani"));

// Discord-backed endpoints, using the stub gateway.
const user = await call("GET", "/api/v1/discord/users/81384788765712384");
check("user lookup", user.data?.user?.username === "aki");
check("gateway path", calls.some((path) => path.startsWith("/users/81384788765712384")));

const guild = await call("GET", "/api/v1/discord/guilds/197038439483310086");
check("guild lookup", Boolean(guild.data?.guild));

const invite = await call("GET", "/api/v1/discord/invites/aki");
check("invite lookup", Boolean(invite.data?.invite));

const exists = await call("GET", "/api/v1/discord/snowflakes/81384788765712384");
check("snowflake exists", exists.data?.exists === true);

// Permissions.
const perms = await call("POST", "/api/v1/permissions", {
  permissions: "View Channels,Send Messages",
});
check("perm integer", perms.data?.integer === "3072");
check("perm hex", perms.data?.hex === "0xC00");
check("perm names", (perms.data?.names ?? []).length === 2);

const snake = await call("POST", "/api/v1/permissions", {
  permissions: "send_messages,view_channels",
});
check("perm snake case", snake.data?.integer === "3072");

const badPerm = await call("POST", "/api/v1/permissions", { permissions: "Not A Permission" });
check("perm rejects unknown", badPerm.error?.status === 400);

const parsed = await call("POST", "/api/v1/permissions", { integer: "0xC00" });
check("perm parse integer", (parsed.data?.names ?? []).length === 2);

const permsList = await call("GET", "/api/v1/permissions/all");
check("perm list", (permsList.data?.permissions ?? []).length > 40);
check("perm bits are strings", typeof permsList.data?.permissions?.[0]?.bit === "string");

// Webhooks.
const embed = await call("POST", "/api/v1/webhooks/payload", {
  embed: { title: "hi", color: "#5865f2", description: "there" },
  include_content: true,
});
check("embed color int", embed.data?.payload?.embeds?.[0]?.color === 5793266);
check("embed content", embed.data?.payload?.content === "");
check("embed valid", embed.data?.valid === true);

const limits = await call("GET", "/api/v1/webhooks/limits");
check("embed limits", limits.data?.limits?.total === 6000);

const inviteBuild = await call("POST", "/api/v1/invites/build", {
  channel_id: "123456789012345678",
  max_age: 3600,
});
check("invite build", String(inviteBuild.data?.request ?? "").includes("max_age=3600"));

const badInvite = await call("POST", "/api/v1/invites/build", { channel_id: "nope" });
check("invite validation", badInvite.error?.status === 400);

const extract = await call("GET", "/api/v1/invites/extract?url=https://discord.gg/aki");
check("invite extract", extract.data?.code === "aki");

// Misc.
const vtt = await call("POST", "/api/v1/vtt", {
  input: "WEBVTT\n\n00:00:00.000 --> 00:00:02.500\nHello",
});
check("vtt cues", vtt.data?.cueCount === 1);
check("vtt discord", vtt.data?.discord?.cues?.[0]?.text === "Hello");

const age = await call("POST", "/api/v1/age", { dob: "2000-01-01", from: "2026-01-01" });
check("age years", age.data?.years === 26);
check("age total days", age.data?.totalDays === 9497);

const countdown = await call("POST", "/api/v1/countdown", { seconds: 93784 });
check("countdown", countdown.data?.formatted === "1d 02:03:04");

// Error handling.
const missing = await call("GET", "/api/v1/nope");
check("404 shape", missing.error?.status === 404);

// GET is accepted everywhere, including on endpoints declared as POST, because GitHub Pages
// cannot receive a body. This is the behaviour the whole static API depends on.
const getOnPost = await call("GET", "/api/v1/snowflake/create", undefined);
check("GET on POST endpoint reaches the handler", getOnPost.error?.status === 400);
check("GET reports GET in the envelope", getOnPost.method === undefined || getOnPost.method === "GET");

const badBody = await api.handle(
  new Request("https://api.example.dev/api/v1/text/fancy", {
    method: "POST",
    body: "{not json",
    headers: { "Content-Type": "application/json" },
  }),
);
check("bad json 400", badBody.status === 400);

const options = await api.handle(
  new Request("https://api.example.dev/api/v1/text/fancy", { method: "OPTIONS" }),
);
check("cors preflight", options.status === 204 && options.headers.get("Access-Control-Allow-Origin") === "*");

const cors = await api.handle(new Request("https://api.example.dev/api/v1/health"));
check("cors header on get", cors.headers.get("Access-Control-Allow-Origin") === "*");

const noGateway = createApi({});
const gated = await noGateway.handle(
  new Request("https://api.example.dev/api/v1/discord/users/81384788765712384"),
);
check("no gateway 503", gated.status === 503);


// Custom status.
const status = await call("POST", "/api/v1/text/status", { text: "focus mode" });
check("status text", status.data?.status === "focus mode");
check("status presets", (status.data?.presets ?? []).length > 3);
check("status emoji list", (status.data?.emoji ?? []).length > 10);

const statusEmoji = await call("POST", "/api/v1/text/status", { text: "focus mode", emoji: "\u{1F4BB}" });
check("status adds emoji", statusEmoji.data?.status === "\u{1F4BB} focus mode");

const statusTwice = await call("POST", "/api/v1/text/status", { text: "\u{1F4BB} focus", emoji: "\u{1F4BB}" });
check("status does not double emoji", statusTwice.data?.status === "\u{1F4BB} focus");

const statusLong = await call("POST", "/api/v1/text/status", { text: "x".repeat(200) });
check("status length limit", statusLong.error?.status === 400);

// Mock ids.
const mock = await call("POST", "/api/v1/ids/mock", { count: 4, kind: "message" });
check("mock count", (mock.data?.ids ?? []).length === 4);
check("mock shape", mock.data?.ids.every((id: string) => /^\d{17,20}$/.test(id)));
check("mock mentions", (mock.data?.mentions ?? [])[0] === `<@${mock.data.ids[0]}>`);
check("mock distinct", new Set(mock.data.ids).size === 4);

const mockTooMany = await call("POST", "/api/v1/ids/mock", { count: 500 });
check("mock clamps count", mockTooMany.error?.status === 400);

// Colour text.
const colorText = await call("POST", "/api/v1/emoji/color-text", { text: "hi", hex: "#5865F2" });
check("color text embed", colorText.data?.embed?.embeds?.[0]?.color === 5793266);
check("color text normalizes", colorText.data?.hex === "#5865f2");
check("color text rgb", colorText.data?.rgb?.b === 242);

const blocks = await call("POST", "/api/v1/emoji/color-text", { text: "hi", hex: "#5865F2", mode: "blocks" });
check("color text blocks", (blocks.data?.blocks ?? []).length === 9);
check("color text bar", blocks.data?.blocks?.[0]?.bar === "\u2588\u2588\u2588");

const badHex = await call("POST", "/api/v1/emoji/color-text", { text: "hi", hex: "nope" });
check("color text rejects bad hex", badHex.error?.status === 400);

// Invite images.
const images = await call("GET", "/api/v1/invites/images?code=aki");
check("invite images cdn", String(images.data?.icon ?? "").startsWith("https://cdn.discordapp.com/icons/"));
check("invite images animated gif", String(images.data?.icon).endsWith(".gif?size=1024"));
check("invite images splash fallback", String(images.data?.banner ?? "").includes("/splashes/"));
check("invite images guild", images.data?.guild?.id === "197038439483310086");

const badSize = await call("GET", "/api/v1/invites/images?code=aki&size=999");
check("invite images rejects size", badSize.error?.status === 400);

// RPC.
const rpc = await call("POST", "/api/v1/webhooks/rpc", { text: "BG3", verb: "playing" });
check("rpc display", rpc.data?.display === "Playing BG3");
check("rpc playing type", rpc.data?.presence?.activities?.[0]?.type === 0);
check("rpc verbs", (rpc.data?.verbs ?? []).length === 4);

const rpcState = await call("POST", "/api/v1/webhooks/rpc", {
  text: "BG3",
  state: "Party, level 9",
  verb: "listening",
  started_at: 1700000000000,
});
check("rpc details", rpcState.data?.presence?.activities?.[0]?.details === "Party, level 9");
check("rpc timestamps", rpcState.data?.presence?.activities?.[0]?.timestamps?.start === 1700000000000);
check("rpc listening type", rpcState.data?.presence?.activities?.[0]?.type === 4);

const rpcEmpty = await call("POST", "/api/v1/webhooks/rpc", { text: "   " });
check("rpc needs text", rpcEmpty.error?.status === 400);
// Guild route: Discord 401s the bare guild path, so the invite path must be used.
// The stub mirrors Discord: invites answer, the bare guild route is refused.
const guildAware = createApi({
  discord: {
    async get(path: string) {
      calls.push(`guild-aware:${path}`);
      if (path.startsWith("/guilds/")) {
        // Discord would answer 401 here. The router must translate that into advice.
        throw new ApiError(401, "401: Unauthorized");
      }
      if (path.startsWith("/invites/")) {
        return { code: path.slice("/invites/".length).split("?")[0], guild: { id: "197038439483310086", name: "Aki" } };
      }
      return { id: "81384788765712384" };
    },
  },
});

// A path segment cannot contain slashes, so a full link is a 404 by design. Clients strip
// the link down to its code first, which is what the site does.
const guildViaLink = await guildAware.handle(
  new Request("https://api.example.dev/api/v1/discord/guilds/https://discord.gg/aki"),
);
check("full link is not a path segment", guildViaLink.status === 404);

const guildViaCodeOnly = await guildAware.handle(
  new Request("https://api.example.dev/api/v1/discord/guilds/aki"),
);
const codeBody = (await guildViaCodeOnly.json()) as Record<string, any>;
check("guild code resolves via invite", codeBody.data?.via === "invite");
check("guild invite returns guild", codeBody.data?.guild?.name === "Aki");

const guildViaId = await guildAware.handle(
  new Request("https://api.example.dev/api/v1/discord/guilds/197038439483310086"),
);
const idBody = (await guildViaId.json()) as Record<string, any>;
check("guild 401 is explained", guildViaId.status === 401);
check("guild 401 suggests invite", String(idBody.error?.message ?? "").toLowerCase().includes("invite"));
check("guild 401 keeps the id", String(idBody.error?.message ?? "").includes("197038439483310086"));
check("guild 401 does not hit invites", !calls.some((p) => p === "guild-aware:/invites/197038439483310086"));
const failed = results.filter(([, ok]) => !ok);
console.log(`\n${results.length - failed.length}/${results.length} assertions passed`);
if (failed.length) {
  console.log(`failed: ${failed.map(([name]) => name).join(", ")}`);
  process.exitCode = 1;
}




