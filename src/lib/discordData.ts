export interface Badge {
  id: string;
  name: string;
  group: "Early Access" | "Community" | "Bug Hunter" | "HypeSquad" | "Partner" | "Developer" | "Moderation";
  description: string;
  howToGet: string;
}

export const BADGES: Badge[] = [
  {
    id: "early_supporter",
    name: "Early Supporter",
    group: "Early Access",
    description: "Was on Discord during the first year of Nitro early access.",
    howToGet: "Not obtainable anymore.",
  },
  {
    id: "early_verified_bot_dev",
    name: "Early Verified Bot Developer",
    group: "Early Access",
    description: "Verified bot developer during the first year of early access.",
    howToGet: "Not obtainable anymore.",
  },
  {
    id: "verified_bot_dev",
    name: "Verified Bot Developer",
    group: "Developer",
    description: "Owner of a bot verified under Discord's developer programme.",
    howToGet: "Apply for verification with a bot that passes the review criteria.",
  },
  {
    id: "certified_moderator",
    name: "Certified Moderator",
    group: "Moderation",
    description: "Active in Discord Moderator, the official community support programme.",
    howToGet: "Join the Discord Moderator programme and complete the training.",
  },
  {
    id: "bug_hunter_1",
    name: "Bug Hunter Level 1",
    group: "Bug Hunter",
    description: "Reward for reporting bugs or helping on Discord's bug bounty.",
    howToGet: "Report a bug that gets accepted on the bug bounty.",
  },
  {
    id: "bug_hunter_2",
    name: "Bug Hunter Level 2",
    group: "Bug Hunter",
    description: "Higher tier of the bug bounty reward.",
    howToGet: "Submit a high-quality bug report.",
  },
  {
    id: "hypesquad_events",
    name: "HypeSquad Events",
    group: "HypeSquad",
    description: "Attended a HypeSquad event in person or online.",
    howToGet: "Join a HypeSquad event.",
  },
  {
    id: "hypesquad_bravery",
    name: "HypeSquad Bravery",
    group: "HypeSquad",
    description: "Member of the HypeSquad Bravery house.",
    howToGet: "Apply to join a HypeSquad house.",
  },
  {
    id: "hypesquad_brilliance",
    name: "HypeSquad Brilliance",
    group: "HypeSquad",
    description: "Member of the HypeSquad Brilliance house.",
    howToGet: "Apply to join a HypeSquad house.",
  },
  {
    id: "hypesquad_balance",
    name: "HypeSquad Balance",
    group: "HypeSquad",
    description: "Member of the HypeSquad Balance house.",
    howToGet: "Apply to join a HypeSquad house.",
  },
  {
    id: "premium_early_supporter",
    name: "Premium Early Supporter",
    group: "Early Access",
    description: "Has had Discord Nitro since the first year it existed.",
    howToGet: "Not obtainable anymore.",
  },
  {
    id: "active_developer",
    name: "Active Developer",
    group: "Developer",
    description: "Developer of an active application over the last month.",
    howToGet: "Have an app with a published command over the past month.",
  },
  {
    id: "http_interactions_bot",
    name: "Bot HTTP Interactions",
    group: "Developer",
    description: "Early reward for bots using HTTP interactions instead of a gateway connection.",
    howToGet: "Not obtainable anymore.",
  },
];

export const BADGE_GROUPS = ["All", "Early Access", "Community", "Bug Hunter", "HypeSquad", "Partner", "Developer", "Moderation"] as const;

export interface PermissionDef {
  name: string;
  bit: bigint;
  category: "General" | "Membership" | "Text" | "Voice" | "Apps" | "Advanced";
  description: string;
  note?: string;
}

export const PERMISSIONS: PermissionDef[] = [
  { name: "Create Invite", bit: 1n << 0n, category: "General", description: "Invite people to the server." },
  { name: "Kick Members", bit: 1n << 1n, category: "General", description: "Remove members from the server." },
  { name: "Ban Members", bit: 1n << 2n, category: "General", description: "Permanently ban members." },
  { name: "Administrator", bit: 1n << 3n, category: "Advanced", description: "Grants every permission and bypasses channel overwrites.", note: "This one permission overrides all others." },
  { name: "Manage Channels", bit: 1n << 4n, category: "General", description: "Create, edit, and delete channels." },
  { name: "Manage Server", bit: 1n << 5n, category: "General", description: "Change server name, region, icon, and owner." },
  { name: "Add Reactions", bit: 1n << 6n, category: "Text", description: "Add new reactions to messages." },
  { name: "View Audit Log", bit: 1n << 7n, category: "Advanced", description: "See a record of who did what." },
  { name: "Priority Speaker", bit: 1n << 8n, category: "Voice", description: "Lower everyone else's volume." },
  { name: "Video", bit: 1n << 9n, category: "Voice", description: "Share video, screen, and stream." },
  { name: "View Channels", bit: 1n << 10n, category: "Membership", description: "See channels by default." },
  { name: "Send Messages", bit: 1n << 11n, category: "Text", description: "Post messages in text channels." },
  { name: "Send TTS Messages", bit: 1n << 12n, category: "Text", description: "Send text-to-speech messages." },
  { name: "Manage Messages", bit: 1n << 13n, category: "Text", description: "Delete and pin any message." },
  { name: "Embed Links", bit: 1n << 14n, category: "Text", description: "Links you post show a preview card." },
  { name: "Attach Files", bit: 1n << 15n, category: "Text", description: "Upload images and files." },
  { name: "Read Message History", bit: 1n << 16n, category: "Text", description: "See messages sent before you joined." },
  { name: "Mention @everyone", bit: 1n << 17n, category: "Text", description: "Ping the whole server.", note: "Also needs permission on the specific channel." },
  { name: "Use External Emoji", bit: 1n << 18n, category: "Text", description: "Use emoji from other servers." },
  { name: "View Server Insights", bit: 1n << 19n, category: "Advanced", description: "See growth and engagement stats." },
  { name: "Connect", bit: 1n << 20n, category: "Voice", description: "Join voice channels." },
  { name: "Speak", bit: 1n << 21n, category: "Voice", description: "Talk in voice channels." },
  { name: "Mute Members", bit: 1n << 22n, category: "Voice", description: "Server-mute other members." },
  { name: "Deafen Members", bit: 1n << 23n, category: "Voice", description: "Server-deafen other members." },
  { name: "Move Members", bit: 1n << 24n, category: "Voice", description: "Move members between voice channels." },
  { name: "Use Voice Activity", bit: 1n << 25n, category: "Voice", description: "Show speaking indicator without speaking." },
  { name: "Change Nickname", bit: 1n << 26n, category: "Membership", description: "Change your own nickname." },
  { name: "Manage Nicknames", bit: 1n << 27n, category: "Membership", description: "Change anyone else's nickname." },
  { name: "Manage Roles", bit: 1n << 28n, category: "General", description: "Create and assign roles below their highest role." },
  { name: "Manage Webhooks", bit: 1n << 29n, category: "Apps", description: "Create and manage webhooks." },
  { name: "Manage Emojis and Stickers", bit: 1n << 30n, category: "Apps", description: "Add and remove emojis and stickers." },
  { name: "Use Application Commands", bit: 1n << 31n, category: "Apps", description: "Run slash commands." },
  { name: "Request to Speak", bit: 1n << 32n, category: "Voice", description: "Request permission to talk in a stage." },
  { name: "Manage Events", bit: 1n << 33n, category: "General", description: "Create and manage scheduled events." },
  { name: "Manage Threads", bit: 1n << 34n, category: "Text", description: "Create, rename, and delete threads." },
  { name: "Create Public Threads", bit: 1n << 35n, category: "Text", description: "Create threads anyone can view." },
  { name: "Create Private Threads", bit: 1n << 36n, category: "Text", description: "Create invite-only threads." },
  { name: "Use External Stickers", bit: 1n << 37n, category: "Apps", description: "Send stickers from other servers." },
  { name: "Send Messages in Threads", bit: 1n << 38n, category: "Text", description: "Post inside threads." },
  { name: "Use Emoji Picker", bit: 1n << 39n, category: "Apps", description: "Use the built-in emoji picker." },
  { name: "Moderate Members", bit: 1n << 40n, category: "Advanced", description: "Timeout members and dismiss warnings." },
];

export const PERMISSION_CATEGORIES = ["General", "Membership", "Text", "Voice", "Apps", "Advanced"] as const;

export function permissionToHex(bits: bigint): string {
  return "0x" + bits.toString(16).toUpperCase();
}

export function permissionToDecimal(bits: bigint): string {
  return bits.toString(10);
}

export function permissionToBinary(bits: bigint): string {
  return bits.toString(2).padStart(41, "0");
}

/* ------------------------------- timestamps ------------------------------ */

export const TIMESTAMP_STYLES = {
  t: "Short time - 16:20",
  T: "Long time - 4:20:00 PM",
  d: "Short date - 17/10/2016",
  D: "Long date - 17 October 2016",
  f: "Short date and time - 17 October 2016 16:20",
  F: "Long date and time - Tuesday, 17 October 2016 16:20",
  R: "Relative - 2 days ago",
} as const;

export type TimestampStyle = keyof typeof TIMESTAMP_STYLES;

export interface StampResult {
  shortTime: string;
  longTime: string;
  shortDate: string;
  longDate: string;
  relative: string;
  unix: string;
  iso: string;
  tags: string;
}

export function formatStamp(date: Date): StampResult {
  const unixSeconds = Math.floor(date.getTime() / 1000);
  const iso = date.toISOString().replace(".000Z", "Z");

  const shortTime = `<t:${unixSeconds}:t>`;
  const longTime = `<t:${unixSeconds}:T>`;
  const shortDate = `<t:${unixSeconds}:d>`;
  const longDate = `<t:${unixSeconds}:D>`;
  const full = `<t:${unixSeconds}:F>`;
  const relative = `<t:${unixSeconds}:R>`;

  return {
    shortTime,
    longTime,
    shortDate,
    longDate,
    relative,
    unix: String(unixSeconds),
    iso,
    tags: [shortTime, longTime, shortDate, longDate, full, relative].join("\n"),
  };
}

export function relativeFrom(date: Date, from = new Date()): string {
  const diff = Math.round((date.getTime() - from.getTime()) / 1000);
  const abs = Math.abs(diff);

  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
    [1, "second"],
  ];

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  for (const [seconds, unit] of units) {
    if (abs >= seconds) {
      return formatter.format(Math.round(diff / seconds), unit);
    }
  }
  return "just now";
}

/* ------------------------------- markdown ------------------------------- */

export interface MarkdownRow {
  syntax: string;
  result: string;
  note: string;
  preview?: boolean;
}

export const MARKDOWN_ROWS: MarkdownRow[] = [
  { syntax: "**bold**", result: "bold", note: "Bold text." },
  { syntax: "*italic*", result: "italic", note: "Italic text." },
  { syntax: "_italic_", result: "italic", note: "Underscores work too, but not inside words." },
  { syntax: "~~strikethrough~~", result: "strikethrough", note: "Needs two tildes on each side." },
  { syntax: "__underline__", result: "underline", note: "Discord specific, not standard Markdown." },
  { syntax: "||spoiler||", result: "spoiler", note: "Click or tap to reveal. Spoilers can span lines.", preview: true },
  { syntax: "> quote", result: "quote", note: "Put it at the start of the line." },
  { syntax: "# heading 1", result: "heading 1", note: "Type # then a space, up to # for smaller." },
  { syntax: "###### heading 6", result: "heading 6", note: "Six levels, then it stops being a heading." },
  { syntax: "-# heading", result: "sub-heading", note: "H1 to H3 only. Shown in the member list." },
  { syntax: "```code block```", result: "code block", note: "Set a language for highlighting.", preview: true },
  { syntax: "```-no language", result: "no syntax highlight", note: "Wrap a language in minus signs to disable highlighting.", preview: true },
  { syntax: "```diff\n- removed\n+ added\n```", result: "diff block", note: "Minus lines are red, plus lines are green.", preview: true },
  { syntax: "inline `code`", result: "inline code", note: "One backtick each side, no line breaks inside." },
  { syntax: "[text](https://url)", result: "link", note: "Link text can be anything." },
  { syntax: "[](https://url)", result: "embed-less link", note: "Empty text, hides the link preview." },
  { syntax: "> # heading\n> ## next line", result: "heading, not quote", note: "Anything after the first blank quote line is a normal heading.", preview: true },
  { syntax: "\\*escape\\*", result: "*escape*", note: "Backslash stops formatting." },
  { syntax: "# heading\n-# sub", result: "escaped heading", note: "Zero-width space after # hides a heading.", preview: true },
  { syntax: "-# not a heading", result: "literal heading", note: "Dash before the hash stops the heading." },
  { syntax: "<t:1700000000:R>", result: "relative timestamp", note: "R for relative, F for full, t for time only." },
  { syntax: "<t:1700000000:F>", result: "absolute timestamp", note: "Follows each user's timezone." },
  { syntax: "<@123456789>", result: "user mention", note: "Notifies the user." },
  { syntax: "<@!123456789>", result: "nickname mention", note: "Shows their current nickname." },
  { syntax: "<@&123456789>", result: "role mention", note: "Pings everyone with that role." },
  { syntax: "#channel", result: "channel link", note: "Pastes a clickable channel reference." },
  { syntax: "```\n# not a heading\n```", result: "safe heading", note: "Inside a code block nothing is formatted.", preview: true },
];

export const MENTION_TYPES = [
  { id: "user", label: "User", template: "<@USER_ID>", note: "Pings the user and shows their avatar." },
  { id: "nickname", label: "Nickname", template: "<@!USER_ID>", note: "Shows their nickname instead of username." },
  { id: "role", label: "Role", template: "<@&ROLE_ID>", note: "Pings everyone with that role." },
  { id: "channel", label: "Channel", template: "<#CHANNEL_ID>", note: "Renders as a clickable channel name." },
  { id: "everyone", label: "Everyone", template: "@everyone", note: "Needs permission to ping it." },
  { id: "here", label: "Here", template: "@here", note: "Pings only members who are online." },
  { id: "stage", label: "Stage host", template: "<@&STAGE_ROLE_ID>", note: "Mentioning the stage host role." },
  { id: "command", label: "Slash command", template: "</COMMAND_ID:COMMAND_ID>", note: "Built-in command, e.g. </shuffle:0>." },
  { id: "thread", label: "Thread starter", template: "<#THREAD_ID>", note: "Same syntax as a channel." },
  { id: "slash", label: "Slash command chat", template: "/COMMAND", note: "Commands you have installed." },
] as const;