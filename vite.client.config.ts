/**
 * Second build pass: the public API client and the pre-baked discovery documents.
 *
 * The app itself is built by `vite.config.ts`. This produces the two things that have to exist
 * as real files on disk rather than as JavaScript that runs on arrival:
 *
 * - `dist/api/v1/client.js`, an importable ES module wrapping the same request handler.
 * - `dist/api/v1/*.json`, the discovery documents, so a plain `curl` of them returns JSON with
 *   the right content type instead of the HTML shell.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { deployOrigin } from "./src/lib/core/config.ts";
import { distoolsDefine, loadDistoolsConfig } from "./build/distools-config.ts";

/** Discovery paths that are worth having on disk, keyed by the file they are written to. */
const BAKED = [
  { file: "index.json", path: "/api/v1" },
  { file: "health.json", path: "/api/v1/health" },
  { file: "openapi.json", path: "/api/v1/openapi.json" },
  { file: "tools.json", path: "/api/v1/tools" },
] as const;

function bakeDiscoveryFiles(): Plugin {
  return {
    name: "bake-api-discovery",
    async closeBundle() {
      // Read the config inside the hook: the config loader evaluates this file in a wrapper where
      // top-level side effects other than `defineConfig` are not guaranteed to run only once.
      const config = loadDistoolsConfig();
      const origin = deployOrigin(config.service_deploy_domain);
      const { API_PREFIX, createApi } = await import("./src/lib/core/api");

      const outDir = resolve(import.meta.dirname, "dist/api/v1");
      mkdirSync(outDir, { recursive: true });

      const api = createApi({ origin, config });

      for (const { file, path } of BAKED) {
        const response = await api.handle(new Request(`${origin}${path}`));
        const body = await response.text();
        writeFileSync(resolve(outDir, file), `${body}\n`, "utf8");
        process.stdout.write(`  api   ${API_PREFIX}/${file} (${response.status})\n`);
      }

      // A copy of the spec under the conventional OpenAPI filename, for tooling that looks for
      // it at the site root.
      const spec = await api.handle(new Request(`${origin}/api/v1/openapi.json`));
      writeFileSync(resolve(import.meta.dirname, "dist/openapi.json"), `${await spec.text()}\n`, "utf8");
    },
  };
}

export default defineConfig({
  base: "/",
  define: distoolsDefine(),
  // The app build already copies `public/` to the site root. Without this, Vite's default public
  // directory handling copies the whole folder a second time into `dist/api/v1/`.
  publicDir: false,
  plugins: [bakeDiscoveryFiles()],
  build: {
    outDir: "dist/api/v1",
    emptyOutDir: false,
    target: "es2022",
    lib: {
      entry: resolve(import.meta.dirname, "src/lib/core/client.ts"),
      formats: ["es"],
      fileName: () => "client.js",
    },
  },
});
