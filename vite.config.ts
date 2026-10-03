// The site is published at a custom domain, distools.itzdanti.dev, which GitHub Pages serves
// from the root. Assets are therefore referenced from "/" and not from a repository sub-path.
//
// GitHub Pages serves 404.html for any path it does not recognise, so copying the built
// index.html there lets the client side router handle deep links like /tool/snowflake and
// lets /api/v1/... URLs be answered by the app instead of a bare 404.
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fumadocsMdx } from "fumadocs-mdx/vite";
import { deployOrigin } from "./src/lib/core/config.ts";
import { distoolsDefine, loadDistoolsConfig } from "./build/distools-config.ts";
import { distoolsApi } from "./build/api-middleware.ts";

/** Escapes a value for use inside a double-quoted HTML attribute. */
function attribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Substitutes `DISTOOLS_CONFIG` values into `index.html`, so the page title, description and
 * canonical URL describe whichever service this repo was configured to be, without anyone having
 * to keep `index.html` in sync by hand.
 */
function injectServiceConfig(): Plugin {
  return {
    name: "inject-service-config",
    transformIndexHtml(html) {
      const config = loadDistoolsConfig();
      return html
        .replaceAll("%SERVICE_NAME%", attribute(config.service_name))
        .replaceAll("%SERVICE_DOMAIN%", attribute(deployOrigin(config.service_deploy_domain)))
        .replaceAll("%SERVICE_DOCS_URL%", attribute(config.service_docs_link))
        .replaceAll("%SERVICE_REPO_URL%", attribute(config.service_repo_link));
    },
  };
}

export default defineConfig({
  base: "/",
  define: distoolsDefine(),
  optimizeDeps: {
    // `cookie` and `set-cookie-parser` ship CommonJS with no `exports` map, so Vite can serve the
    // raw file to the browser and it has no named ESM exports. Pre-bundling them makes
    // `parse`/`stringify`/`splitCookiesString` importable. Seen as
    // "does not provide an export named 'parse'".
    include: ["cookie", "set-cookie-parser", "react-router"],
  },
  resolve: {
    // Fumadocs' React Router provider imports `react-router`, so the app must too; otherwise the
    // dev server pre-bundles two react-router copies and the Router context is not shared
    // ("useLocation() may be used only in the context of a <Router> component").
    dedupe: ["react-router"],
    // `fumadocs-openapi/ui` imports Shiki's full grammar bundle directly, so passing a different
    // factory to `createOpenAPIPage` is not enough. Aliasing the module keeps the dependency
    // working while cutting about 11 MB of lazy chunks out of the build. See src/lib/shiki-full.ts.
    alias: {
      "fumadocs-core/highlight/shiki/full": resolve(import.meta.dirname, "src/lib/shiki-full.ts"),
    },
    // Fumadocs ships ESM that Vite's dependency pre-bundling mangles; it has to be part of the
    // module graph instead.
    noExternal: [
      "fumadocs-core",
      "fumadocs-ui",
      "fumadocs-openapi",
      "fumadocs-mdx",
      "@fumadocs/base-ui",
      "@fumadocs/tailwind",
    ],
  },
  build: {
    // One bundle is intentional here. Every tool is small, they share the same design
    // system, and lazy loading them individually would cost more round trips than it saves.
    // Fumadocs (the docs renderer) is the one heavy dependency and rides along in this bundle.
    chunkSizeWarningLimit: 1100,
  },
  plugins: [
    distoolsApi(),
    injectServiceConfig(),
    react(),
    tailwindcss(),
    fumadocsMdx(),
    {
      name: "pages-404",
      closeBundle() {
        const index = resolve(import.meta.dirname, "dist/index.html");
        if (existsSync(index)) {
          copyFileSync(index, resolve(import.meta.dirname, "dist/404.html"));
        }
      },
    },
  ],
});
