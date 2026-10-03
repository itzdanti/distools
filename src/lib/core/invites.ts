/** Message link parsing, shared by the tool and `GET /api/v1/message-links`. */

export interface MessageLinkParts {
  guildId: string;
  channelId: string;
  messageId: string;
}

const PATTERNS = [
  /channels\/(\d{17,20})\/(\d{17,20})\/(\d{17,20})/,
  /@me\/(\d{17,20})\/(\d{17,20})/,
  /channels\/(\d{17,20})\/(\d{17,20})/,
];

export function parseMessageLink(input: string): MessageLinkParts | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const three = /\/channels\/(\d{17,20})\/(\d{17,20})\/(\d{17,20})/.exec(trimmed);
  if (three) {
    return { guildId: three[1], channelId: three[2], messageId: three[3] };
  }

  const dm = /\/channels\/(\d{17,20})\/(\d{17,20})/.exec(trimmed);
  if (dm) {
    return { guildId: "", channelId: dm[1], messageId: dm[2] };
  }

  for (const pattern of PATTERNS) {
    const match = pattern.exec(trimmed);
    if (match) {
      return { guildId: match[1] ?? "", channelId: match[2] ?? "", messageId: match[3] ?? "" };
    }
  }

  return null;
}

/** Invite builder options, mirrored by `POST /api/v1/invites/build`. */
export interface InviteOptions {
  channelId: string;
  guildId?: string;
  maxAge?: number;
  maxUses?: number;
  temporary?: boolean;
  unique?: boolean;
  targetType?: number;
  targetId?: string;
}

export interface InviteOptionsValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  query: Record<string, string | number>;
}

const TARGET_TYPES: Record<number, string> = {
  1: "stream",
  2: "embedded-application",
};

export function validateInviteOptions(options: InviteOptions): InviteOptionsValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const query: Record<string, string | number> = {};

  if (!/^\d{17,20}$/.test(options.channelId)) {
    errors.push("Channel ID must be a 17-20 digit snowflake.");
  } else {
    query.channel_id = options.channelId;
  }

  if (options.guildId) {
    if (!/^\d{17,20}$/.test(options.guildId)) {
      errors.push("Guild ID must be a 17-20 digit snowflake.");
    } else {
      query.guild_id = options.guildId;
    }
  }

  const maxAge = options.maxAge ?? 86400;
  if (!Number.isInteger(maxAge) || maxAge < 0 || maxAge > 604800) {
    errors.push("max_age is in seconds and must be between 0 and 604800 (7 days).");
  } else {
    query.max_age = maxAge;
  }

  const maxUses = options.maxUses ?? 0;
  if (!Number.isInteger(maxUses) || maxUses < 0 || maxUses > 1000) {
    errors.push("max_uses must be between 0 (unlimited) and 1000.");
  } else {
    query.max_uses = maxUses;
  }

  if (options.unique) query.unique = 1;
  if (options.temporary) query.temporary = 1;

  if (options.targetType !== undefined) {
    if (!TARGET_TYPES[options.targetType]) {
      errors.push(`target_type must be 1 (${TARGET_TYPES[1]}) or 2 (${TARGET_TYPES[2]}).`);
    } else if (!/^\d{17,20}$/.test(options.targetId ?? "")) {
      errors.push("A target application or stream ID is required when target_type is set.");
    } else {
      query.target_type = options.targetType;
      query.target_application_id = options.targetId as string;
    }
  }

  if (maxAge === 0) warnings.push("max_age 0 means the invite never expires.");
  if (maxAge > 604800) warnings.push("Discord will clamp anything above 7 days.");

  return { valid: errors.length === 0, errors, warnings, query };
}
