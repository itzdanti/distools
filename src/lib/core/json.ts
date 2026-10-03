/**
 * JSON helpers shared by the browser tools and the public API.
 *
 * Everything here is pure and environment agnostic: no DOM, no React, no Node built-ins.
 */

export type JsonMode = "pretty" | "minify" | "validate" | "escape" | "unescape";

export interface JsonParse {
  data: unknown;
  error: string | null;
  context: string | null;
  size: number;
}

export function byteLength(input: string): number {
  return new TextEncoder().encode(input).length;
}

export function deepSortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(deepSortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, deepSortKeys(entry)]),
    );
  }
  return value;
}

export function parseJson(input: string): JsonParse {
  const size = byteLength(input);
  try {
    return { data: JSON.parse(input) as unknown, error: null, context: null, size };
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Invalid JSON";
    const position = /position (\d+)/.exec(message)?.[1];
    const at = position ? Number(position) : null;
    return {
      data: null,
      error: message,
      context: at !== null && input ? input.slice(Math.max(0, at - 30), at + 30) : null,
      size,
    };
  }
}

export interface JsonStats {
  keys: number;
  depth: number;
  arrays: number;
  objects: number;
  strings: number;
  numbers: number;
  booleans: number;
  nulls: number;
}

export function jsonStats(value: unknown): JsonStats {
  const stats: JsonStats = {
    keys: 0,
    depth: 0,
    arrays: 0,
    objects: 0,
    strings: 0,
    numbers: 0,
    booleans: 0,
    nulls: 0,
  };

  const walk = (node: unknown, depth: number): void => {
    stats.depth = Math.max(stats.depth, depth);
    if (Array.isArray(node)) {
      stats.arrays += 1;
      node.forEach((entry) => walk(entry, depth + 1));
      return;
    }
    if (node && typeof node === "object") {
      stats.objects += 1;
      for (const [key, entry] of Object.entries(node as Record<string, unknown>)) {
        stats.keys += 1;
        void key;
        walk(entry, depth + 1);
      }
      return;
    }
    if (node === null) stats.nulls += 1;
    else if (typeof node === "number") stats.numbers += 1;
    else if (typeof node === "boolean") stats.booleans += 1;
    else stats.strings += 1;
  };

  walk(value, 0);
  return stats;
}

/** Runs one of the JSON tool modes and returns the output text plus any error. */
export function runJsonMode(
  input: string,
  mode: JsonMode,
  options: { indent?: number; sortKeys?: boolean } = {},
): { output: string; error: string | null } {
  const { indent = 2, sortKeys = false } = options;

  if (mode === "escape") return { output: JSON.stringify(input).slice(1, -1), error: null };
  if (mode === "unescape") {
    try {
      return { output: JSON.parse(`"${input}"`) as string, error: null };
    } catch (caught) {
      return {
        output: "",
        error: caught instanceof Error ? caught.message : "Could not unescape that string.",
      };
    }
  }

  const parsed = parseJson(input);
  if (parsed.error) return { output: "", error: parsed.error };

  const ready = sortKeys ? deepSortKeys(parsed.data) : parsed.data;
  if (mode === "validate") return { output: "Valid JSON.", error: null };
  if (mode === "minify") return { output: JSON.stringify(ready), error: null };
  return { output: JSON.stringify(ready, null, Math.max(0, Math.min(10, indent))), error: null };
}
