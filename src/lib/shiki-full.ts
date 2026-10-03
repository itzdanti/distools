import { createShikiFactory } from "fumadocs-core/highlight/shiki";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

/**
 * Drop-in replacement for `fumadocs-core/highlight/shiki/full`.
 *
 * That module registers all 346 bundled Shiki grammars eagerly, which is roughly 11 MB across
 * 400 files in `dist/assets`. `fumadocs-openapi/ui` imports it directly, so passing a different
 * factory to `createOpenAPIPage` is not enough; `vite.config.ts` aliases that specifier here
 * instead.
 *
 * The list covers the documentation plus every language the API's request generators can emit.
 * Anything else falls back to plain text rather than failing.
 */
const LANGUAGES = [
  "bash",
  "c",
  "cpp",
  "csharp",
  "css",
  "diff",
  "go",
  "html",
  "http",
  "java",
  "javascript",
  "json",
  "jsx",
  "kotlin",
  "php",
  "python",
  "ruby",
  "rust",
  "shell",
  "swift",
  "ts",
  "tsx",
  "yaml",
] as const;

function build() {
  return createHighlighterCore({
    themes: [import("shiki/themes/github-dark.mjs")],
    langs: LANGUAGES.map((language) => import(`shiki/langs/${language}.mjs`)),
    // The JavaScript regex engine, so the WASM build is not shipped as well.
    engine: createJavaScriptRegexEngine(),
  });
}

export const defaultShikiFactory = createShikiFactory({ init: build });

/** The WASM engine is deliberately not provided; see the note above. */
export const wasmShikiFactory = defaultShikiFactory;
