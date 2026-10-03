/**
 * Writes `public/llms-full.txt`, the single-file version of the documentation.
 *
 * The convention (llmstxt.org) is that `llms.txt` is an index and `llms-full.txt` is everything
 * in one place, for a model to read top to bottom. Generating it means the text cannot drift
 * away from the MDX the site actually renders, and the endpoint list comes from the registry
 * rather than from a hand-kept table.
 *
 * Run through `npm run docs:llms`, which compiles this file and then runs it.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { DEFAULT_ORIGIN, ENDPOINTS, createApi } from "../src/lib/core/api";

const ROOT = process.cwd();
const DOCS_DIR = resolve(ROOT, "content/docs");

/** Collects `.mdx` files, so a new docs page is picked up without editing this script. */
function collect(dir: string, base = ""): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    const slug = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return collect(path, slug);
    return entry.name.endsWith(".mdx") ? [path] : [];
  });
}

/** Strips the frontmatter block and the import statements MDX allows but prose does not. */
function toProse(source: string): string {
  return source
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
    .replace(/^import\s+.*?from\s+["'][^"']+["'];?\s*$/gm, "")
    .replace(/<\/?(?:ApiReference|Callout|Steps|Step|Card|Cards)[^>]*>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const sections: string[] = [];

for (const path of collect(DOCS_DIR).sort()) {
  const source = readFileSync(path, "utf8");
  const title = /^---\r?\n[\s\S]*?^title:\s*(.+)$/m.exec(source)?.[1]?.trim();
  const slug = path
    .slice(DOCS_DIR.length + 1)
    .replace(/\\/g, "/")
    .replace(/\.mdx$/, "")
    .replace(/\/index$/, "");
  const prose = toProse(source);
  if (!prose) continue;
  sections.push(`## ${title ?? slug}\n\nSource: ${DEFAULT_ORIGIN}/docs/${slug}\n\n${prose}`);
}

const api = createApi({ origin: DEFAULT_ORIGIN });
const indexResponse = await api.handle(new Request(`${DEFAULT_ORIGIN}/api/v1`));
const index = (await indexResponse.json()) as {
  groups: { name: string; endpoints: { id: string; method: string; path: string; summary: string; params: { name: string; required?: boolean; description: string }[] }[] }[];
};

const endpointLines: string[] = [];
for (const group of index.groups) {
  endpointLines.push(`### ${group.name}`, "");
  for (const endpoint of group.endpoints) {
    const params = endpoint.params
      .map((param) => `      - ${param.name}${param.required ? " (required)" : ""}: ${param.description}`)
      .join("\n");
    endpointLines.push(
      `- ${endpoint.method} ${endpoint.path}`,
      `  id: ${endpoint.id}`,
      `  ${endpoint.summary}`,
      ...(params ? [params] : []),
      "",
    );
  }
}

const header = `# aki's Discord Tools — full documentation

Everything on one page. Generated from the documentation sources and the endpoint registry, so it
matches the site.

Site: ${DEFAULT_ORIGIN}
API base: ${DEFAULT_ORIGIN}/api/v1
Client module: ${DEFAULT_ORIGIN}/api/v1/client.js
Repository: https://github.com/itzdanti/distools

---

`;

const body = `${header}
# Tools

Every tool is at ${DEFAULT_ORIGIN}/tool/<slug> and runs entirely in the browser. Only tools that
fetch something from Discord make a network request, and those send nothing but the identifier
you typed.

Webhooks are the exception worth naming: the webhook tools post directly to Discord from your
browser, because a webhook URL is a password and must not touch a third party.

---

# API reference

${ENDPOINTS.length} endpoints across ${index.groups.length} groups.

Every endpoint accepts GET with query parameters. That is the form that survives being served as
a static file. A POST with a JSON body works against a self-hosted copy of the handler, but
GitHub Pages only serves files, so it never reaches one.

Three ways to call it:

1. Open the URL in a browser. The site computes and renders the answer.
2. Import the client module. This is the supported way to call it from code.
3. curl the pre-baked discovery JSON, which are real files.

A plain fetch() of a parameterised endpoint from another origin returns the HTML shell, because
there is no server to run the handler. That is a property of static hosting, not a defect.

${endpointLines.join("\n")}
---

# Licence

Custom. You may use, modify, copy, merge, publish, distribute and sublicense this, including
commercially. You may not sell it. Keep the copyright notice.

https://github.com/itzdanti/distools/blob/main/LICENSE
`;

const full = `${body}
---

# Documentation

${sections.join("\n\n---\n\n")}
`;

writeFileSync(resolve(ROOT, "public/llms-full.txt"), full, "utf8");
process.stdout.write(
  `llms-full.txt: ${sections.length} docs pages, ${ENDPOINTS.length} endpoints, ${full.length} bytes\n`,
);
