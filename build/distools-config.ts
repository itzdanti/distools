/**
 * Reads `DISTOOLS_CONFIG` and turns it into the value Vite substitutes for `__DISTOOLS_CONFIG__`.
 *
 * Both Vite builds import this, so the app bundle and the standalone API client agree on the
 * configured service name, licence and links. Reading a plain file here instead of importing it
 * per-module means the config is parsed once per build and a malformed file fails the build
 * rather than one page at runtime.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseDistoolsConfig, type DistoolsConfig } from "../src/lib/core/config.ts";

export const CONFIG_PATH = resolve(import.meta.dirname, "..", "DISTOOLS_CONFIG");

export function loadDistoolsConfig(): DistoolsConfig {
  return parseDistoolsConfig(readFileSync(CONFIG_PATH, "utf8"));
}

/** The `define` map every Vite config passes to `defineConfig`. */
export function distoolsDefine(): Record<string, string> {
  return { __DISTOOLS_CONFIG__: JSON.stringify(loadDistoolsConfig()) };
}
