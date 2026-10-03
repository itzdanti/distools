/**
 * Rich presence ("RPC") structure.
 *
 * Discord clients show this in the profile card and, for some verbs, above the avatar in
 * the member list. Nothing here talks to Discord: it is the payload shape a bot or an RPC
 * client would send, plus the small rule Discord applies about which verbs may carry a
 * timestamp.
 */

/**
 * The four verbs a presence can use.
 *
 * `Streaming` is the odd one out: Discord only accepts a timestamp for it, and only when a
 * party is set. Every other verb either has no timestamp or ignores one.
 */
export const RPC_PRESETS = [
  { id: "playing", label: "Playing", allowsTimestamp: true },
  { id: "listening", label: "Listening to", allowsTimestamp: true },
  { id: "watching", label: "Watching", allowsTimestamp: true },
  { id: "streaming", label: "Streaming", allowsTimestamp: true },
] as const;

export type RpcVerb = (typeof RPC_PRESETS)[number]["id"];

export interface PresenceOptions {
  verb: RpcVerb;
  text: string;
  /** Optional second line, shown under the main text. */
  state?: string;
  /** Start time for the elapsed clock. */
  startedAt?: number;
  /** Small square shown next to the text, usually an application icon URL. */
  largeImage?: string;
  smallImage?: string;
  largeText?: string;
  smallText?: string;
}

export interface PresenceResult {
  presence: {
    activities: [
      {
        type: number;
        name: string;
        state?: string;
        details?: string;
        timestamps?: { start: number };
        assets?: { large_image?: string; large_text?: string; small_image?: string; small_text?: string };
      },
    ];
    status: string;
  };
  /** What Discord would actually render, for previewing it. */
  display: string;
  /** Set when the request asked for something Discord would drop. */
  warning?: string;
}

const ACTIVITY_TYPE = 4;

/** Discord activity type numbers, kept here so the docs can list them. */
export const ACTIVITY_TYPES = {
  playing: 0,
  streaming: 1,
  listening: 2,
  watching: 3,
  custom: 4,
  competing: 5,
} as const;

function presetFor(verb: string): (typeof RPC_PRESETS)[number] {
  return RPC_PRESETS.find((preset) => preset.id === verb) ?? RPC_PRESETS[0];
}

export function buildPresence(options: PresenceOptions): PresenceResult {
  const preset = presetFor(options.verb);
  const text = options.text.trim();
  const state = options.state?.trim() ?? "";

  if (text === "") throw new Error("Add some text before building a presence.");

  const activity: PresenceResult["presence"]["activities"][0] = {
    // Discord uses 0 for Playing and 4 for everything else in the modern shape.
    type: preset.id === "playing" ? ACTIVITY_TYPES.playing : ACTIVITY_TYPE,
    name: preset.label,
    state: text,
  };

  if (state !== "") activity.details = state;
  if (options.startedAt !== undefined) {
    activity.timestamps = { start: options.startedAt };
  }

  const assets: NonNullable<typeof activity.assets> = {};
  if (options.largeImage) assets.large_image = options.largeImage;
  if (options.largeText) assets.large_text = options.largeText;
  if (options.smallImage) assets.small_image = options.smallImage;
  if (options.smallText) assets.small_text = options.smallText;
  if (Object.keys(assets).length > 0) activity.assets = assets;

  const result: PresenceResult = {
    presence: { activities: [activity], status: "online" },
    display: `${preset.label} ${text}`,
  };

  if (state !== "") result.display += `\n${state}`;
  return result;
}
