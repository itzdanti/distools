import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CONFIG_KEYS,
  deployOrigin,
  hrefFor,
  isEmail,
  parseDistoolsConfig,
} from "../../src/lib/core/config";

/**
 * Tests the `DISTOOLS_CONFIG` parser against the file this repo actually ships.
 *
 * The parser is the seam every other feature reads from, and its format is hand-written, so the
 * cases that matter are the ugly ones: comments, unmatched bracing, a value that contains `==`,
 * and a missing key. Parsing the real file as well means a typo in it fails here rather than in a
 * puzzled fork six months later.
 */

const failures: string[] = [];
let passed = 0;

function check(label: string, run: () => void): void {
  try {
    run();
    passed += 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${label}: ${message}`);
    process.stdout.write(`FAIL ${label}\n      ${message}\n`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function equals(actual: unknown, expected: unknown, label: string): void {
  assert(actual === expected, `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function throws(run: () => unknown, matcher: RegExp): void {
  try {
    run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    assert(matcher.test(message), `threw the wrong error: ${message}`);
    return;
  }
  throw new Error("expected the call to throw, but it did not");
}

const SHIPPED = readFileSync(resolve(process.cwd(), "DISTOOLS_CONFIG"), "utf8");

check("the shipped file parses", () => {
  const config = parseDistoolsConfig(SHIPPED);
  equals(config.service_name, "aki's Discord Tools", "service_name");
  equals(config.service_deploy_domain, "distools.itzdanti.dev", "service_deploy_domain");
  equals(config.service_support, "distools@itzdanti.dev", "service_support");
  equals(config.takedown_email, "legal@itzdanti.dev", "takedown_email");
});

check("every declared key is present and named", () => {
  const config = parseDistoolsConfig(SHIPPED) as Record<string, unknown>;
  for (const key of CONFIG_KEYS) {
    assert(key in config, `missing ${key}`);
    assert(typeof config[key] === "string", `${key} is not a string`);
  }
});

function substitute(source: string, key: string, line: string): string {
  const pattern = new RegExp(`^${key}:.*$`, "m");
  assert(pattern.test(source), `the shipped file has no ${key} line to replace`);
  return source.replace(pattern, line);
}

check("inline comments are stripped leaving the value intact", () => {
  const source = substitute(SHIPPED, "service_name", 'service_name: "Test" == this is a comment');
  equals(parseDistoolsConfig(source).service_name, "Test", "service_name");
});

check("full-line comments are ignored", () => {
  const config = parseDistoolsConfig(`== a note\n${SHIPPED}`);
  equals(config.service_name, "aki's Discord Tools", "service_name");
});

check("== inside a quoted value survives", () => {
  const source = substitute(
    SHIPPED,
    "service_support",
    'service_support: "https://example.com/?token=a==b" == comment',
  );
  equals(parseDistoolsConfig(source).service_support, "https://example.com/?token=a==b", "service_support");
});

check("values may be unquoted", () => {
  const source = substitute(SHIPPED, "service_name", "service_name: Bare Value");
  equals(parseDistoolsConfig(source).service_name, "Bare Value", "service_name");
});

check("{service_deploy_domain} is interpolated", () => {
  const source = substitute(
    SHIPPED,
    "service_docs_link",
    'service_docs_link: "https://{service_deploy_domain}/docs"',
  );
  const config = parseDistoolsConfig(source);
  equals(config.service_docs_link, "https://distools.itzdanti.dev/docs", "service_docs_link");
});

check("a missing key is an error", () => {
  const source = SHIPPED.replace(/^short_service_name:.*\n/m, "");
  throws(() => parseDistoolsConfig(source), /missing: short_service_name/);
});

check("a bad takedown_email is an error", () => {
  const source = SHIPPED.replace(/^takedown_email:.*$/m, 'takedown_email: "not-an-email"');
  throws(() => parseDistoolsConfig(source), /takedown_email must be an email/);
});

check("an empty privacy and terms policy is allowed", () => {
  const source = SHIPPED.replace(/^privacy_policy:.*$/m, 'privacy_policy: ""').replace(
    /^terms_of_service:.*$/m,
    'terms_of_service: ""',
  );
  const config = parseDistoolsConfig(source);
  equals(config.privacy_policy, "", "privacy_policy");
  equals(config.terms_of_service, "", "terms_of_service");
});

check("isEmail", () => {
  assert(isEmail("a@b.co"), "simple address should be an email");
  assert(!isEmail("https://example.com"), "a URL is not an email");
  assert(!isEmail("a@b"), "an address without a dot is not an email");
});

check("hrefFor turns emails into mailto and leaves URLs alone", () => {
  equals(hrefFor("a@b.co"), "mailto:a@b.co", "email");
  equals(hrefFor("https://example.com/help"), "https://example.com/help", "url");
  equals(hrefFor("/docs"), "/docs", "relative path");
  equals(hrefFor(""), "", "empty");
});

check("deployOrigin normalises a bare domain", () => {
  equals(deployOrigin("distools.itzdanti.dev"), "https://distools.itzdanti.dev", "bare");
  equals(deployOrigin("https://distools.itzdanti.dev/"), "https://distools.itzdanti.dev", "trailing slash");
  equals(deployOrigin(""), "", "empty");
});

process.stdout.write(`\nconfig: ${passed}/${passed + failures.length} checks passed\n`);
if (failures.length > 0) {
  process.stdout.write(`\n${failures.length} failure(s)\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("all config checks passed\n");
}
