import { createOpenAPIPage } from "fumadocs-openapi/ui";
import spec from "../../openapi.json";

/**
 * The API reference, generated from the OpenAPI document that `npm run docs:openapi` writes.
 *
 * The document is imported rather than fetched. Fumadocs' own loader reads the file from disk,
 * which is the right thing on a server and the wrong thing inside a bundle, so the spec is
 * handed over preloaded instead. The page and its interactive request console are otherwise
 * stock Fumadocs.
 */
const ApiPage = createOpenAPIPage();

// The spec is generated data, so it arrives as plain JSON rather than as a typed object.
const documents = { openapi: spec as never };

export function ApiReference() {
  return <ApiPage document="openapi" preloaded={{ docs: documents }} />;
}

