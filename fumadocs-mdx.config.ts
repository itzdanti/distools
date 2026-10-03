import { defineConfig } from "fumadocs-mdx/config";

/**
 * Fumadocs MDX pipeline options.
 *
 * `rehypeCodeOptions` is set here rather than passed to the Vite plugin because the plugin's
 * `globalOptions` are merged into a global default, and collections created with `defineDocs`
 * do not pick that default up. A config file is the supported place for it.
 *
 * Without `langs`, Shiki emits a lazily fetched chunk for every one of the 346 grammars it
 * knows. They cost a visitor nothing, since they load on demand, but they came to roughly 11 MB
 * and 400 files in `dist/assets` for languages nothing on this site is written in. This is the
 * set the documentation and the API's request generators actually use.
 */
export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      langs: [
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
        "php",
        "python",
        "ruby",
        "rust",
        "shell",
        "ts",
        "tsx",
        "yaml",
        "console",
      ],
      // One dark theme to match the site. Without this the light theme is emitted too and every
      // code block carries two themes' worth of CSS variables.
      themes: { light: "github-dark", dark: "github-dark" },
    },
  },
});
