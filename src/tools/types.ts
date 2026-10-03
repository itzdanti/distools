import type { ComponentType } from "react";
import type { IconName } from "../components/ui";

export type Category =
  | "text"
  | "ids"
  | "invite"
  | "webhook"
  | "emoji"
  | "dev"
  | "misc";

export interface CategoryMeta {
  id: Category;
  label: string;
  description: string;
  icon: IconName;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "text",
    label: "Text & Styling",
    description: "Fancy text, dividers, spoilers, formatting and generators.",
    icon: "type",
  },
  {
    id: "ids",
    label: "IDs & Lookups",
    description: "Snowflake decoding, account age, avatars, badges, profile lookups.",
    icon: "hash",
  },
  {
    id: "invite",
    label: "Invites & Servers",
    description: "Invite info, server lookups, invite and server name builders.",
    icon: "link",
  },
  {
    id: "webhook",
    label: "Webhooks & Embeds",
    description: "Embed builder, webhook sender and cleaner, permissions.",
    icon: "code",
  },
  {
    id: "emoji",
    label: "Emoji & Images",
    description: "Emoji library and downloaders, resizing, cropping, colours.",
    icon: "image",
  },
  {
    id: "dev",
    label: "Developer Utilities",
    description: "Encoding, JSON, UUIDs, colours, passwords, tokens, timestamps.",
    icon: "tool",
  },
  {
    id: "misc",
    label: "Sound & Time",
    description: "Synthesised soundboard, countdowns, notifications.",
    icon: "volume",
  },
];

export const CATEGORY_MAP = new Map(CATEGORIES.map((category) => [category.id, category]));

export interface ToolDef {
  slug: string;
  name: string;
  description: string;
  category: Category;
  icon: IconName;
  keywords: string[];
  component: ComponentType;
  featured?: boolean;
  needsNetwork?: boolean;
}