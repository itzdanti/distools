export type Pick = <T>(arr: readonly T[]) => T;

export function makePick(rng: () => number = Math.random): Pick {
  return <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
}

export const pick = makePick();

export function shuffle<T>(arr: readonly T[], rng: () => number = Math.random): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function sample<T>(arr: readonly T[], count: number): T[] {
  return shuffle(arr).slice(0, Math.min(count, arr.length));
}

export function join(parts: (string | number)[], sep = ""): string {
  return parts.filter((part) => part !== "" && part !== undefined).join(sep);
}

/* ------------------------------- usernames ------------------------------- */

const ADJECTIVES = [
  "silent", "crimson", "velvet", "hollow", "neon", "quiet", "iron", "lunar",
  "frozen", "wild", "hidden", "electric", "broken", "golden", "restless",
  "pale", "burnt", "sacred", "distant", "endless", "gentle", "bitter",
  "shattered", "marble", "sober", "amber", "stormy", "humble", "fatal",
  "polar", "static", "eager", "hollowed", "wander", "salt", "onyx",
];

const NOUNS = [
  "raven", "cipher", "lantern", "harbor", "ember", "monolith", "drift",
  "signal", "prism", "atlas", "echo", "cinder", "meridian", "quartz",
  "vulture", "anthem", "basalt", "comet", "dagger", "ember", "fathom",
  "glacier", "harrow", "ivory", "juniper", "kestrel", "lantern", "monsoon",
  "nimbus", "onyx", "pylon", "ridge", "summit", "tundra", "vector", "willow",
  "zephyr", "cobalt", "delta", "ember",
];

const SUFFIXES = [
  "xo", "zz", "0x", "_dev", "png", "mp4", "irl", "irl", "smp", "tv",
  "404", "911", "101", "13", "2000", "2077", "07", "99", "01", "2k",
  "vx", "ex", "ox", "uu", "ii", "ae", "0o", "1x",
];

export type UsernameStyle = "aesthetic" | "minimal" | "gamer" | "leetspeak" | "twoWord" | "symbolic";

const AESTHETIC_SYMBOLS = ["", "", "", ".", "˙", "-", "_", "~", "°", "˚"];

const LEET: Record<string, string> = {
  a: "4", e: "3", i: "1", o: "0", s: "5", t: "7", b: "8", g: "9", l: "1", z: "2",
};

export function generateUsername(style: UsernameStyle, rng: () => number = Math.random): string {
  const p = makePick(rng);
  const adj = p(ADJECTIVES);
  const noun = p(NOUNS);

  switch (style) {
    case "aesthetic": {
      const sym = p(AESTHETIC_SYMBOLS);
      const sep = p([".", "_", "-", ""]);
      const cap = rng() > 0.5;
      const base = `${adj}${sep}${noun}`;
      return `${sym}${cap ? base[0].toUpperCase() + base.slice(1) : base}${sym}`;
    }
    case "minimal":
      return rng() > 0.5 ? noun : `${adj}${noun}`;
    case "gamer":
      return `${noun}${p(SUFFIXES)}`;
    case "leetspeak": {
      const convert = (s: string) =>
        Array.from(s).map((c) => (rng() > 0.35 ? (LEET[c] ?? c) : c)).join("");
      return `${convert(adj)}${convert(noun)}`;
    }
    case "twoWord":
      return `${adj}-${noun}-${Math.floor(rng() * 900 + 100)}`;
    case "symbolic":
      return `${adj}${p(["", "", "", "⩊", "⁺", "˚", "ᶦ", "☾"])}${noun}`;
  }
}

export function generateUsernames(
  style: UsernameStyle,
  count: number,
  rng: () => number = Math.random,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  let guard = 0;
  while (out.length < count && guard < count * 40) {
    guard++;
    const name = generateUsername(style, rng);
    if (name.length > 32) continue;
    if (seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    out.push(name);
  }
  return out;
}

/* ------------------------- server / channel / role ------------------------ */

const SERVER_ADJ = [
  "Midnight", "Crimson", "Silent", "Iron", "Lunar", "Static", "Golden",
  "Hollow", "Frozen", "Neon", "Broken", "Velvet", "Amber", "Storm",
  "Shadow", "Crystal", "Ember", "Quiet", "Hidden", "Wild", "Northern",
  "Ancient", "Modern", "Royal", "Deep", "Bright", "Cosmic", "Royal",
];

const SERVER_NOUN = [
  "Haven", "Vault", "Guild", "Circle", "Union", "Collective", "Society",
  "Commons", "Sanctuary", "Outpost", "Hangar", "Archive", "Garden", "Depot",
  "District", "Guildhall", "Workshop", "Observatory", "Library", "Grounds",
  "Base", "Station", "Club", "Union", "Sector", "Concord", "Bastion",
];

const CHANNEL_CATEGORIES = [
  ["general", "staff", "support", "bot-cmds", "media", "voice", "staff-chat"],
  ["info", "rules", "faq", "roles", "welcome", "announcements", "staff-chat", "showcase"],
  ["general", "random", "memes", "games", "music", "movies", "suggestions", "clips"],
  ["coding", "dev", "help", "project", "snippet", "review", "deploys", "off-topic"],
];

const ROLE_PREFIX = [
  "Head", "Deputy", "Lead", "Senior", "Junior", "Trial", "Head", "Veteran",
  "Elite", "Chief", "Grand", "Prime", "Apex", "Supreme",
];

const ROLE_NOUN = [
  "Admin", "Moderator", "Owner", "Helper", "Guardian", "Sentinel", "Curator",
  "Architect", "Strategist", "Warden", "Keeper", "Overseer", "Director",
  "Handler", "Enforcer", "Advisor", "Steward", "Marshal",
];

const ROLE_COLORS = [
  "#5865f2", "#3ba55c", "#faa61a", "#ed4245", "#eb459e", "#9b59b6",
  "#1abc9c", "#e67e22", "#f1c40f", "#e74c3c", "#3498db", "#2ecc71",
];

export function generateServerName(rng: () => number = Math.random): string {
  const p = makePick(rng);
  const pattern = Math.floor(rng() * 4);
  if (pattern === 0) return `${p(SERVER_ADJ)} ${p(SERVER_NOUN)}`;
  if (pattern === 1) return `The ${p(SERVER_ADJ)} ${p(SERVER_NOUN)}`;
  if (pattern === 2) return `${p(SERVER_ADJ)}${p(SERVER_NOUN)}`;
  return `${p(SERVER_ADJ)} ${p(SERVER_NOUN)}s`;
}

export function generateChannelName(rng: () => number = Math.random): string {
  const p = makePick(rng);
  const set = p(CHANNEL_CATEGORIES);
  const count = Math.floor(rng() * 4) + 2;
  return shuffle(set, rng).slice(0, Math.min(count, set.length)).join("-");
}

export function generateRoleName(rng: () => number = Math.random): string {
  const p = makePick(rng);
  const pattern = Math.floor(rng() * 3);
  if (pattern === 0) return `${p(ROLE_PREFIX)} ${p(ROLE_NOUN)}`;
  if (pattern === 1) return p(ROLE_NOUN);
  return `${p(ROLE_PREFIX)}${p(ROLE_NOUN)}`;
}

export function generateRole(): { name: string; color: string; hoist: boolean; mentionable: boolean } {
  return {
    name: generateRoleName(),
    color: pick(ROLE_COLORS),
    hoist: Math.random() > 0.5,
    mentionable: Math.random() > 0.4,
  };
}

export function generateChannelSet(count: number): string[] {
  const out: string[] = [];
  const used = new Set<string>();
  let guard = 0;
  while (out.length < count && guard < count * 30) {
    guard++;
    const name = generateChannelName();
    if (used.has(name)) continue;
    used.add(name);
    out.push(name);
  }
  return out;
}

/* -------------------------------- bios ---------------------------------- */

const BIO_TEMPLATES = [
  "{adj} {noun} | {stack}",
  "{noun} enthusiast. {tagline}",
  "just here for the {noun}. {tagline}",
  "{stack} · {timezone} · {status}",
  "{adj} {noun} in the {place} | {stack}",
];

const BIO_ADJ = [
  "sleep-deprived", "overthinking", "caffeinated", "midnight", "quietly",
  "chronically", "annoyingly", "recovering", "professional", "part-time",
];

const BIO_NOUN = [
  "overthinker", "daydreamer", "night owl", "home cook", "trail runner",
  "film hoarder", "coffee snob", "plant parent", "cyclist", "baker",
  "photographer", "mechanic", "listener", "collector", "tinkerer",
];

const BIO_STACK = [
  "TS · Rust · Postgres", "Python · Docker · GCP", "design · Figma · motion",
  "Linux · Neovim · tmux", "Unity · C# · Blender", "Excel · VBA · Pain",
  "JS · React · Node", "writing · editing · caffeine",
];

const BIO_TAGLINE = [
  "ask me anything", "probably sleeping", "will fix it later",
  "down for anything", "not a morning person", "always listening",
  "currently learning Rust", "no spoilers please",
  "here for the music", "building things",
];

const BIO_STATUS = [
  "do not disturb", "open to collabs", "busy but responsive", "brb, rebooting",
  "reading, probably", "in the zone", "coffee #3",
];

const BIO_TZ = [
  "UTC+0", "UTC+1", "UTC-5", "UTC-8", "UTC+5:30", "UTC+9", "UTC-3",
  "somewhere in Europe", "the wrong side of the planet",
];

const BIO_PLACE = ["Lisbon", "Osaka", "Reykjavik", "Toronto", "Nairobi", "Perth", "Bogota"];

export function generateBio(rng: () => number = Math.random): string {
  const p = makePick(rng);
  return p(BIO_TEMPLATES)
    .replace("{adj}", () => p(BIO_ADJ))
    .replace("{noun}", () => p(BIO_NOUN))
    .replace("{stack}", () => p(BIO_STACK))
    .replace("{tagline}", () => p(BIO_TAGLINE))
    .replace("{timezone}", () => p(BIO_TZ))
    .replace("{status}", () => p(BIO_STATUS))
    .replace("{place}", () => p(BIO_PLACE))
    .replace(/\s*\|\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/* ------------------------------- nicknames ------------------------------- */

const NICK_PREFIX = ["lil", "big", "silly", "neo", "ultra", "mega", "lmao", "ok", "not", "very", "so", "the"];
const NICK_CORE = [
  "cat", "fox", "wolf", "bunny", "bird", "shark", "rat", "frog", "bee",
  "panda", "otter", "crab", "goat", "moose", "newt", "moth", "crow",
];

export function generateNickname(rng: () => number = Math.random): string {
  const p = makePick(rng);
  const core = p(NICK_CORE);
  const pattern = Math.floor(rng() * 5);
  if (pattern === 0) return `${p(NICK_PREFIX)} ${core}`;
  if (pattern === 1) return `${p(NICK_PREFIX)}${core}`;
  if (pattern === 2) return `${core}${Math.floor(rng() * 900 + 100)}`;
  if (pattern === 3) return `${core}_${core}`;
  return `${p(NICK_PREFIX)} ${core}${Math.floor(rng() * 90 + 10)}`;
}

export function generateNicknames(count: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  let guard = 0;
  while (out.length < count && guard < count * 40) {
    guard++;
    const nick = generateNickname();
    if (seen.has(nick.toLowerCase())) continue;
    seen.add(nick.toLowerCase());
    out.push(nick);
  }
  return out;
}

/* ------------------------------ custom status ---------------------------- */

export const CUSTOM_STATUS_PRESETS = [
  "online", "idle", "do not disturb", "invisible",
  "focus mode", "brb, coffee", "coding", "listening to music",
  "watching something", "reading", "gaming", "in a meeting",
  "on a walk", "eating", "commuting", "sleeping",
  "at the gym", "in the zone", "deep work", "afk",
  "just vibing", "thinking", "recharging",
];

export const CUSTOM_STATUS_EMOJI = [
  "\u{1f4bb}", "\u{1f3a8}", "\u{1f3b8}", "\u{2615}", "\u{1f634}",
  "\u{1f9d8}", "\u{1f977}", "\u{1f331}", "\u{1f340}", "\u{1f31b}",
  "\u{1f984}", "\u{1f408}", "\u{1f419}", "\u{1f41b}", "\u{26a1}",
  "\u{1f525}", "\u{2728}", "\u{1f6b6}", "\u{1f3c3}", "\u{1f9f3}",
  "\u{1f4bb}", "\u{270f}", "\u{1f4da}", "\u{1f5a5}",
];

/* --------------------------------- rules --------------------------------- */

export interface RuleTemplate {
  id: string;
  name: string;
  body: string;
}

export const RULE_TEMPLATES: RuleTemplate[] = [
  {
    id: "respect",
    name: "Be respectful",
    body: "Treat everyone here with respect. Harassment, hate speech, slurs, and personal attacks have no place here, and neither do bullying or unwanted DMs.",
  },
  {
    id: "nospam",
    name: "No spam or advertising",
    body: "Do not post ads, server invites, self-promotion, or repetitive messages. Unsolicited mentions and mass DMs are not allowed.",
  },
  {
    id: "nsfw",
    name: "Keep NSFW in marked channels",
    body: "Explicit or violent content is only allowed in channels clearly marked for it. Anything posted outside those channels gets removed.",
  },
  {
    id: "nudity",
    name: "No nudity or sexual content",
    body: "Nudity, sexual content, and suggestive material are not allowed anywhere in this server.",
  },
  {
    id: "gore",
    name: "No graphic violence",
    body: "Graphic images, gore, and self-harm content are not allowed. If you need to discuss something heavy, use the appropriate support channel.",
  },
  {
    id: "staff",
    name: "Follow the staff",
    body: "Decisions made by staff are final. Do not argue with or harass moderators. Open a ticket if you think something was handled unfairly.",
  },
  {
    id: "channel",
    name: "Use the right channel",
    body: "Post in the channel that fits the topic. If a channel is locked or read-only, do not try to work around it. Ask a staff member if you are stuck.",
  },
  {
    id: "pics",
    name: "Credit your sources",
    body: "Repost anything you did not make and credit the original creator. Do not claim work that is not yours.",
  },
  {
    id: "noimpersonation",
    name: "No impersonation",
    body: "Do not impersonate other users, staff, bots, or other servers. This includes fake names, avatars, and profile descriptions.",
  },
  {
    id: "bot",
    name: "No abusing bots",
    body: "Do not use bots to spam, raid, or automate messages. If you want to add a bot, ask a staff member first.",
  },
  {
    id: "hate",
    name: "Zero tolerance for hate",
    body: "Racist, sexist, homophobic, transphobic, ableist, or otherwise hateful behaviour results in an immediate ban. There is no warning for this one.",
  },
  {
    id: "sensitive",
    name: "No personal information",
    body: "Do not share private information, addresses, phone numbers, passwords, or personal photos of anyone without their explicit permission.",
  },
  {
    id: "language",
    name: "Keep it English",
    body: "Use English in the main channels so everyone can take part. Other language channels are fine.",
  },
  {
    id: "political",
    name: "No politics or religion debates",
    body: "Political, religious, and ideological debates are not allowed in this server. Keep that off the platform.",
  },
  {
    id: "links",
    name: "Link safety",
    body: "Do not post suspicious links, free Nitro codes, or anything that asks for your login. Staff will never DM you asking for your password or token.",
  },
];

export interface RuleSetOptions {
  serverName: string;
  tone: "friendly" | "strict" | "minimal";
  numbering: "numbers" | "bullets";
}

export function buildRules(templates: RuleTemplate[], opts: RuleSetOptions): string[] {
  const header: Record<RuleSetOptions["tone"], string> = {
    friendly: `# Welcome to ${opts.serverName}\n\nA few things to keep in mind so everyone has a good time:`,
    strict: `# ${opts.serverName} — Rules\n\nThese are not optional. Read them before posting.`,
    minimal: `# ${opts.serverName} rules`,
  };

  const lines = [header[opts.tone], ""];

  templates.forEach((template, index) => {
    const marker =
      opts.numbering === "numbers"
        ? `${index + 1}. **${template.name}**`
        : `${["-", "*", "\u2022", "\u25aa"][index % 4]} **${template.name}**`;
    lines.push(marker);
    lines.push(template.body);
    lines.push("");
  });

  if (opts.tone !== "minimal") {
    lines.push(
      "---",
      "",
      opts.tone === "friendly"
        ? "Thanks for reading. If anything here is unclear, just ask a staff member."
        : "Breaking these rules may get you muted, removed, or banned. No appeals on repeat offences.",
    );
  }

  return lines;
}

/* -------------------------------- welcome -------------------------------- */

export interface WelcomeOptions {
  serverName: string;
  userName: string;
  memberCount: number;
  rulesUrl?: string;
  channelName?: string;
  style: "embed" | "plain" | "image";
  accent: string;
}

export function buildWelcome(opts: WelcomeOptions): string {
  const count = opts.memberCount.toLocaleString("en-US");
  const channel = opts.channelName ? `#${opts.channelName}` : "this channel";

  if (opts.style === "plain") {
    return [
      `Welcome to ${opts.serverName}, ${opts.userName}!`,
      "",
      `You are member #${count}.`,
      "Say hello in " + channel + " and take a look at the rules when you get a chance.",
    ].join("\n");
  }

  if (opts.style === "image") {
    return JSON.stringify(
      {
        content: `Welcome to ${opts.serverName}, ${opts.userName}!`,
        embeds: [
          {
            title: `Welcome to ${opts.serverName}`,
            description: `Hey ${opts.userName}, glad you made it.\nYou are member **#${count}**.`,
            color: parseInt(opts.accent.replace("#", ""), 16),
            fields: [
              { name: "Members", value: count, inline: true },
              {
                name: "Next step",
                value: `Head to ${channel} and say hello.`,
                inline: true,
              },
            ],
            footer: { text: opts.serverName },
            timestamp: new Date().toISOString(),
          },
        ],
      },
      null,
      2,
    );
  }

  return [
    `Welcome to **${opts.serverName}**, ${opts.userName} \u{1f44b}`,
    "",
    `You are member **#${count}**.`,
    "",
    `Say hello in ${channel}.`,
    opts.rulesUrl ? `Read the rules: ${opts.rulesUrl}` : "Read the rules in the rules channel.",
  ].join("\n");
}

/* ------------------------------- passwords ------------------------------- */

const LOWER = "abcdefghijkmnopqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/";
const AMBIGUOUS = "l1IO0";

function secureRandom(max: number): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function pickFrom(pool: string, avoidAmbiguous: boolean): string {
  const source = avoidAmbiguous
    ? pool.replace(new RegExp(`[${AMBIGUOUS.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]`, "g"), "")
    : pool;
  return source[secureRandom(source.length)];
}

export interface PasswordOptions {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  digits: boolean;
  symbols: boolean;
  avoidAmbiguous: boolean;
}

export const DEFAULT_PASSWORD: PasswordOptions = {
  length: 20,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: true,
  avoidAmbiguous: true,
};

export function generatePassword(opts: PasswordOptions): string {
  const pools: string[] = [];
  if (opts.lowercase) pools.push(LOWER);
  if (opts.uppercase) pools.push(UPPER);
  if (opts.digits) pools.push(DIGITS);
  if (opts.symbols) pools.push(SYMBOLS);

  if (pools.length === 0) {
    throw new Error("Turn on at least one character type.");
  }

  const all = pools.join("");
  const chars = pools.map((pool) => pickFrom(pool, opts.avoidAmbiguous));

  while (chars.length < opts.length) {
    chars.push(pickFrom(all, opts.avoidAmbiguous));
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandom(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

export function estimateStrength(password: string): {
  score: number;
  label: string;
  bits: number;
  poolSize: number;
} {
  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^\w]/.test(password)) poolSize += 33;

  const bits = poolSize > 0 ? Math.log2(poolSize) * password.length : 0;

  let score = 0;
  if (bits >= 28) score = 1;
  if (bits >= 36) score = 2;
  if (bits >= 60) score = 3;
  if (bits >= 80) score = 4;
  if (bits >= 128) score = 5;

  const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong", "Excellent"];

  return { score, label: labels[score], bits: Math.round(bits), poolSize };
}

/* --------------------------------- uuid ---------------------------------- */

export function uuidV4(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const UUID_BATCH = (count: number): string[] => Array.from({ length: count }, uuidV4);