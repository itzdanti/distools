/**
 * Webhook payload construction and validation.
 *
 * The Embed Builder tool and `POST /api/v1/webhooks/payload` both call `buildWebhookPayload`
 * so the JSON you see in the browser is byte-for-byte the JSON the API hands back.
 */

export interface EmbedFieldInput {
  name: string;
  value: string;
  inline?: boolean;
}

export interface EmbedInput {
  title?: string;
  url?: string;
  description?: string;
  color?: string;
  timestamp?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  author?: { name?: string; url?: string; iconUrl?: string };
  footer?: { text?: string; iconUrl?: string };
  fields?: EmbedFieldInput[];
}

export interface WebhookPayloadInput {
  embed?: EmbedInput;
  username?: string;
  avatarUrl?: string;
  content?: string;
  includeContent?: boolean;
  threadId?: string;
}

export interface EmbedLimits {
  title: number;
  description: number;
  fields: number;
  fieldName: number;
  fieldValue: number;
  footer: number;
  author: number;
  total: number;
  embeds: number;
}

export const EMBED_LIMITS: EmbedLimits = {
  title: 256,
  description: 4096,
  fields: 25,
  fieldName: 256,
  fieldValue: 1024,
  footer: 2048,
  author: 256,
  total: 6000,
  embeds: 10,
};

function trimmed(value: string | undefined): string {
  return (value ?? "").trim();
}

export interface BuildResult {
  payload: Record<string, unknown>;
  warnings: string[];
  errors: string[];
  characterCount: number;
}

export function buildWebhookPayload(input: WebhookPayloadInput): BuildResult {
  const embed: Record<string, unknown> = {};
  const data = input.embed ?? {};
  const warnings: string[] = [];
  const errors: string[] = [];

  if (trimmed(data.title)) embed.title = data.title;
  if (trimmed(data.url)) embed.url = data.url;
  if (trimmed(data.description)) embed.description = data.description;
  if (trimmed(data.timestamp)) embed.timestamp = data.timestamp;
  if (trimmed(data.imageUrl)) embed.image = { url: data.imageUrl };
  if (trimmed(data.thumbnailUrl)) embed.thumbnail = { url: data.thumbnailUrl };

  if (/^#[0-9a-f]{6}$/i.test(trimmed(data.color))) {
    embed.color = parseInt(trimmed(data.color).slice(1), 16);
  } else if (trimmed(data.color)) {
    warnings.push("Colour is not a #rrggbb value, so it was left out of the payload.");
  }

  if (trimmed(data.author?.name) || trimmed(data.author?.iconUrl)) {
    embed.author = {
      ...(trimmed(data.author?.name) ? { name: trimmed(data.author?.name) } : {}),
      ...(trimmed(data.author?.url) ? { url: trimmed(data.author?.url) } : {}),
      ...(trimmed(data.author?.iconUrl) ? { icon_url: trimmed(data.author?.iconUrl) } : {}),
    };
  }

  if (trimmed(data.footer?.text)) {
    embed.footer = {
      text: trimmed(data.footer?.text),
      ...(trimmed(data.footer?.iconUrl) ? { icon_url: trimmed(data.footer?.iconUrl) } : {}),
    };
  }

  const fields = (data.fields ?? []).filter(
    (field) => trimmed(field.name) || trimmed(field.value),
  );
  if (fields.length) {
    embed.fields = fields.map((field) => ({
      name: field.name || "",
      value: field.value || "",
      inline: Boolean(field.inline),
    }));
  }

  const body: Record<string, unknown> = {};
  if (input.includeContent || trimmed(input.content)) body.content = input.content ?? "";
  if (trimmed(input.username)) body.username = trimmed(input.username);
  if (trimmed(input.avatarUrl)) body.avatar_url = trimmed(input.avatarUrl);
  if (trimmed(input.threadId)) body.thread_id = trimmed(input.threadId);
  if (Object.keys(embed).length) body.embeds = [embed];

  const payload = Object.keys(body).length ? body : { embeds: [{}] };
  const characterCount = JSON.stringify(payload).length;

  if (trimmed(data.title).length > EMBED_LIMITS.title) {
    warnings.push(`Title is over ${EMBED_LIMITS.title} characters and will be rejected.`);
  }
  if (trimmed(data.description).length > EMBED_LIMITS.description) {
    warnings.push(`Description is over ${EMBED_LIMITS.description} characters.`);
  }
  if (characterCount > EMBED_LIMITS.total) {
    warnings.push(`Total payload is over ${EMBED_LIMITS.total} characters.`);
  }
  if (fields.length > EMBED_LIMITS.fields) {
    warnings.push(`Over ${EMBED_LIMITS.fields} fields, which is the limit.`);
  }
  for (const field of fields) {
    if (field.name.length > EMBED_LIMITS.fieldName) {
      warnings.push(`Field name "${field.name.slice(0, 20)}…" is over ${EMBED_LIMITS.fieldName} characters.`);
    }
    if (field.value.length > EMBED_LIMITS.fieldValue) {
      warnings.push(`Field value "${field.name.slice(0, 20)}…" is over ${EMBED_LIMITS.fieldValue} characters.`);
    }
  }
  if (trimmed(data.footer?.text).length > EMBED_LIMITS.footer) {
    warnings.push(`Footer is over ${EMBED_LIMITS.footer} characters.`);
  }
  if (trimmed(data.author?.name).length > EMBED_LIMITS.author) {
    warnings.push(`Author name is over ${EMBED_LIMITS.author} characters.`);
  }

  return { payload, warnings, errors, characterCount };
}

/** Convenience for the API: just the payload plus limits. */
export function embedSummary(input: WebhookPayloadInput) {
  const result = buildWebhookPayload(input);
  return {
    ...result,
    limits: EMBED_LIMITS,
    valid: result.warnings.length === 0 && result.errors.length === 0,
  };
}
