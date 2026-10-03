/**
 * The `DISTOOLS_CONFIG` format and its parser.
 *
 * This is deliberately its own tiny format rather than JSON or YAML. The file is the one place a
 * person forking the project is meant to edit, so it has to survive being opened by someone who
 * has never seen it: flat `key: "value"` lines, `==` for comments, nothing nested. The format is
 * close enough to a shell script to read at a glance and strict enough to parse without a
 * dependency.
 *
 * Parsing happens at build time (`build/distools-config.ts` reads the file and Vite substitutes
 * the result for `__DISTOOLS_CONFIG__`), so the browser never fetches the file and the values
 * cannot drift between the app, the docs and the release workflow.
 */

/** Every setting the rest of the project reads. All keys must be present in the file. */
export interface DistoolsConfig {
  /** Full name of the service, shown in titles and metadata. */
  service_name: string;
  /** Short name used where space is tight. */
  short_service_name: string;
  /** Host this is deployed to. May be an `*.github.io` subdomain; used to build links. */
  service_deploy_domain: string;
  /** Repository URL. */
  service_repo_link: string;
  /** Documentation URL. May reference `{service_deploy_domain}`. */
  service_docs_link: string;
  /** Support contact. An email becomes a `mailto:` link; anything URL-like is used as-is. */
  service_support: string;
  /** Human-readable licence name. */
  license: string;
  /** Privacy policy URL. Empty means no privacy button is shown. */
  privacy_policy: string;
  /** Terms of service URL. Empty means no terms button is shown. */
  terms_of_service: string;
  /** Contact for takedown requests. Must be an email. */
  takedown_email: string;
}

/** The keys every config file has to define, in the order they appear in the shipped file. */
export const CONFIG_KEYS = [
  "service_name",
  "short_service_name",
  "service_deploy_domain",
  "service_repo_link",
  "service_docs_link",
  "service_support",
  "license",
  "privacy_policy",
  "terms_of_service",
  "takedown_email",
] as const satisfies readonly (keyof DistoolsConfig)[];

/**
 * Removes a trailing `== comment`.
 *
 * Only an `==` at the start of a line or after whitespace counts, so a URL that legitimately
 * contains `==` (a base64 query parameter, say) is left alone.
 */
function stripComment(line: string): string {
  return line.replace(/(^|[ \t])==.*$/, "");
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

/** True for something that should become a `mailto:` link. */
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Turns a support value into an `href`.
 *
 * A bare email becomes `mailto:`; a URL is passed through; a site-relative path is passed
 * through so it can be handled by the router. This is the "emails are automatically converted"
 * behaviour the config advertises.
 */
export function hrefFor(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (isEmail(trimmed)) return `mailto:${trimmed}`;
  return trimmed;
}

/** `distools.itzdanti.dev` (or a full URL) to `https://distools.itzdanti.dev`, without a slash. */
export function deployOrigin(domain: string): string {
  const trimmed = domain.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * Parses the file's text into a config object.
 *
 * References like `{service_deploy_domain}` are substituted from the file's own values, which is
 * what lets the shipped `service_docs_link` be written either as a literal URL or in terms of the
 * deploy domain. Unknown keys are ignored; missing keys are an error, because a half-filled file
 * fails in confusing ways later.
 */
export function parseDistoolsConfig(text: string): DistoolsConfig {
  const raw = new Map<string, string>();

  for (const line of text.split(/\r?\n/)) {
    const content = stripComment(line).trim();
    if (!content) continue;

    const separator = content.indexOf(":");
    if (separator === -1) continue;

    const key = content.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    raw.set(key, unquote(content.slice(separator + 1)));
  }

  const interpolate = (value: string): string =>
    value.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (whole, key: string) => raw.get(key) ?? whole);

  const missing = CONFIG_KEYS.filter((key) => !raw.has(key));
  if (missing.length > 0) {
    throw new Error(`DISTOOLS_CONFIG is missing: ${missing.join(", ")}`);
  }

  const config = Object.fromEntries(
    CONFIG_KEYS.map((key) => [key, interpolate(raw.get(key) ?? "")]),
  ) as unknown as DistoolsConfig;

  const takedown = config.takedown_email.trim();
  if (takedown && !isEmail(takedown)) {
    throw new Error(`DISTOOLS_CONFIG: takedown_email must be an email, got "${takedown}"`);
  }

  return config;
}
