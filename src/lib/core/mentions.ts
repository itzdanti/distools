/** Mention string building, shared by the Mention Generator and the API. */

import { MENTION_TYPES } from "../discordData";

export type MentionType = (typeof MENTION_TYPES)[number]["id"];

export interface MentionResult {
  type: MentionType;
  template: string;
  note: string;
  mentions: string[];
  output: string;
}

export function buildMentions(type: string, ids: string): MentionResult {
  const config = MENTION_TYPES.find((entry) => entry.id === type) ?? MENTION_TYPES[0];

  const mentions = ids
    .split(/[\s,]+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      if (type === "everyone" || type === "here" || type === "slash") {
        return `${config.template.split("_")[0]}${value || ""}`;
      }
      const clean = /^\d{17,20}$/.test(value) ? value : "";
      return config.template.replace(/_?[A-Z_]+_?/g, clean);
    })
    .filter(Boolean);

  return {
    type: config.id,
    template: config.template,
    note: config.note,
    mentions,
    output: mentions.join("\n"),
  };
}

export function mentionTypes() {
  return MENTION_TYPES.map((entry) => ({
    id: entry.id,
    label: entry.label,
    template: entry.template,
    note: entry.note,
  }));
}
