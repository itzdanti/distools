import { defineDocs } from "fumadocs-mdx/macro";
import { loader } from "fumadocs-core/source";

/**
 * The documentation content source.
 *
 * `defineDocs` is a compile-time macro from the Fumadocs Vite plugin: it hands back the set of
 * MDX files it found at build time, so the page tree below is baked into the bundle rather than
 * read from disk in the reader's browser. That is what lets the docs be a static site.
 */
const docs = defineDocs({
  dir: "content/docs",
});

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});

export function getDocsPage(slugs: string[]) {
  return source.getPage(slugs);
}

export function getDocsTree() {
  return source.getPageTree();
}
