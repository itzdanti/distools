import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import App from "../../src/App";
import { ToastProvider } from "../../src/components/ui";
import { TOOLS } from "../../src/tools/registry";
import { source } from "../../lib/source";

/**
 * Renders every page the site can show, server-side, and fails if any of them throws.
 *
 * This is the broadest check available without a browser. `renderToStaticMarkup` runs the same
 * component code and the same routing the real app runs; it simply skips effects, which are the
 * parts that talk to the network and the clipboard. A component that throws during render here
 * would also throw in a visitor's tab, so a green run means every route has a working first
 * paint.
 *
 * Browser globals are stubbed because the app is written for a browser and reads
 * `window.location` while it renders. Effects never run under `renderToStaticMarkup`, so the
 * stubs only need to be present, not functional.
 */

function installBrowserStubs(): void {
  const define = (name: string, value: unknown): void => {
    // Some of these — `navigator` on Node 24, for instance — are already defined as getter-only
    // globals, so a plain assignment throws. Redefining the property is the portable way in.
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  };

  const store = new Map<string, string>();
  const location = {
    href: "https://distools.itzdanti.dev/",
    origin: "https://distools.itzdanti.dev",
    pathname: "/",
    search: "",
    hash: "",
    toString: () => "https://distools.itzdanti.dev/",
  };

  const window = {
    location,
    history: {
      replaceState: (_state: unknown, _title: string, next: string) => {
        const url = new URL(next, location.origin);
        location.pathname = url.pathname;
        location.search = url.search;
      },
      pushState: () => {},
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    }),
    getComputedStyle: () => ({ getPropertyValue: () => "" }),
    requestAnimationFrame: (callback: (time: number) => void) => setTimeout(() => callback(0), 0),
    cancelAnimationFrame: (handle: ReturnType<typeof setTimeout>) => clearTimeout(handle),
    scrollTo: () => {},
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    isSecureContext: false,
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    },
  };

  const document = {
    title: "",
    createElement: () => ({
      style: {},
      setAttribute: () => {},
      appendChild: () => {},
      removeChild: () => {},
      click: () => {},
    }),
    getElementById: () => null,
    body: { appendChild: () => {}, removeChild: () => {} },
    documentElement: { style: { setProperty: () => {} } },
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  define("window", window);
  define("document", document);
  define("navigator", { clipboard: undefined, userAgent: "node" });
}

installBrowserStubs();

const failures: string[] = [];
let passed = 0;

function check(label: string, run: () => void): void {
  try {
    run();
    passed += 1;
  } catch (error) {
    const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
    failures.push(`${label}: ${message}`);
    process.stdout.write(`FAIL ${label}\n      ${message}\n`);
  }
}

function renderAt(path: string): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

// Every tool, rendered directly rather than through its route, so the tool's own component is
// what gets exercised. The route only ever renders the component indirectly behind Suspense.
for (const tool of TOOLS) {
  check(`tool ${tool.slug}`, () => {
    const Component = tool.component;
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ToastProvider>
          <Component />
        </ToastProvider>
      </MemoryRouter>,
    );
    if (html.length < 80) throw new Error(`rendered only ${html.length} characters`);
  });
}

// Every documentation page, discovered from the same source the sidebar is built from, so a new
// MDX file is covered automatically.
const docsPages = source.getPages();
if (docsPages.length === 0) failures.push("docs: no pages found");
for (const page of docsPages) {
  check(`docs ${page.url}`, () => {
    const html = renderAt(page.url);
    if (html.length < 300) throw new Error(`rendered only ${html.length} characters`);
    const title = page.data.title;
    if (title && !html.includes(title)) throw new Error(`missing title "${title}"`);
  });
}

// The rest of the routes, including the not-found fallback.
const routes: [string, string | null][] = [
  ["/", 'class="card"'],
  ["/about", null],
  ["/api/v1", "API response"],
  ["/api/v1/tools", "API response"],
  ["/docs", null],
  ["/docs/definitely-not-a-page", "Not found"],
  ["/no-such-route", null],
];

for (const [path, marker] of routes) {
  check(`route ${path}`, () => {
    const html = renderAt(path);
    if (html.length < 200) throw new Error(`rendered only ${html.length} characters`);
    if (marker && !html.includes(marker)) throw new Error(`missing "${marker}"`);
  });
}

process.stdout.write(`\nroutes: ${passed}/${passed + failures.length} rendered\n`);
if (failures.length > 0) {
  process.stdout.write(`\n${failures.length} failure(s)\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`all ${passed} route renders passed\n`);
}
