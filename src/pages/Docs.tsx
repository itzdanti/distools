import { DocsLayout } from "fumadocs-ui/layouts/docs";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { RootProvider } from "fumadocs-ui/provider/react-router";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { useMemo, type ComponentProps, type FC, type ReactElement } from "react";
import { Link, useLocation } from "react-router";
import { getDocsPage, getDocsTree } from "../../lib/source";
import { SITE_NAME } from "../App";

/**
 * Renders the documentation at `/docs`.
 *
 * `getDocsPage` and `getDocsTree` read from the content registry the Fumadocs Vite plugin
 * collects at build time, so both are plain synchronous lookups against data baked into the
 * bundle. Nothing is read from disk or fetched in the browser, which is what lets this live on
 * a file host.
 *
 * The Fumadocs provider is scoped to this subtree rather than wrapped around the whole app: only
 * the docs need its theme, search and framework contexts, and putting it at the root would pull
 * the Fumadocs UI into the bundle for visitors who only ever open a tool.
 */
function DocsLayoutRoute(): ReactElement {
  return (
    <RootProvider
      // The docs are dark-only. The `dark` class is set statically in `index.html`, so Fumadocs'
      // theme provider is switched off: it exists to toggle themes, and leaving it on makes it
      // inject an anti-FOUC `<script>`, which React warns about (and never runs) on the client.
      theme={{ enabled: false }}
      // Search needs an endpoint to query. There is no server here, so it stays off rather than
      // shipping a search box that cannot work. The sidebar carries the whole page tree anyway.
      search={{ enabled: false }}
    >
      <DocsPageFrame />
    </RootProvider>
  );
}

function DocsPageFrame(): ReactElement {
  const location = useLocation();
  const slugs = useMemo(
    () => location.pathname.replace(/^\/docs/, "").split("/").filter(Boolean),
    [location.pathname],
  );

  const page = getDocsPage(slugs);
  const tree = useMemo(() => getDocsTree(), []);
  const MDX = page?.data.body;

  // `docs-container` is the hook `docs.css` uses to hide the tools chrome (its header and tool
  // sidebar) while the docs are open. Fumadocs does not emit a class of its own to target, so
  // this wrapper is what makes the `:has()` rule work.
  if (!MDX) {
    return (
      <div className="docs-container">
        <DocsLayout tree={tree} {...baseOptions()}>
          <DocsPage>
            <DocsTitle>Not found</DocsTitle>
            <DocsDescription>No documentation page at {location.pathname}.</DocsDescription>
            <DocsBody>
              <p>
                <Link to="/docs">Back to the documentation</Link>
              </p>
            </DocsBody>
          </DocsPage>
        </DocsLayout>
      </div>
    );
  }

  return (
    <div className="docs-container">
      <DocsLayout tree={tree} {...baseOptions()}>
        <DocsPage toc={page.data.toc} full={page.data.full}>
          <DocsTitle>{page.data.title}</DocsTitle>
          {page.data.description ? <DocsDescription>{page.data.description}</DocsDescription> : null}
          <DocsBody>
            <MDX components={{ ...defaultMdxComponents, a: FumadocsLink, Steps, Step }} />
          </DocsBody>
        </DocsPage>
      </DocsLayout>
    </div>
  );
}

/**
 * Fumadocs emits `next/link` anchors. Rewriting them to react-router keeps navigation inside the
 * single page bundle instead of triggering a full document load.
 */
const FumadocsLink: FC<ComponentProps<"a">> = ({ href = "", children, ...rest }) => {
  const target = href.replace(/^\/docs/, "");
  if (href.startsWith("/docs")) {
    return (
      <Link to={target || "/docs"} {...rest}>
        {children}
      </Link>
    );
  }
  if (href.startsWith("/")) {
    return (
      <Link to={href} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
};

function baseOptions() {
  return {
    nav: {
      // Fumadocs already wraps `nav.title` in its own link to `/`, so this must not be an anchor:
      // nesting one produces `<a>` inside `<a>`, which React reports as a hydration error.
      title: (
        <span className="docs-nav-title">
          <img
            className="brand__mark"
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt=""
            width={22}
            height={22}
          />
          {SITE_NAME}
        </span>
      ),
    },
    sidebar: {
      collapsible: true,
    },
  } as const;
}

export { DocsLayoutRoute };

