/**
 * Finishes the `dist/` tree after `vite build` for static hosting.
 *
 * GitHub Pages has no SPA fallback: a request for `/tool/fancy-text` or `/docs` finds no file and
 * returns the Pages 404. Copying the built `index.html` to `404.html` makes Pages serve the shell
 * for those paths, and the client router takes over. `.nojekyll` stops Jekyll from processing the
 * output (and from dropping anything it treats as special).
 *
 * Run automatically as the `postbuild` script, so `npm run build` and `npm run verify` both
 * produce a complete tree.
 */
import { copyFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const dist = resolve(process.cwd(), "dist");
const index = resolve(dist, "index.html");

if (!existsSync(index)) {
  process.stderr.write("postbuild: dist/index.html is missing, run the build first\n");
  process.exit(1);
}

copyFileSync(index, resolve(dist, "404.html"));
writeFileSync(resolve(dist, ".nojekyll"), "");
process.stdout.write("postbuild: wrote dist/404.html and dist/.nojekyll\n");
