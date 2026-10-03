import { useEffect, useMemo, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router";
import { Icon, ToastProvider, type IconName } from "./components/ui";
import { TOOLS } from "./tools/registry";
import { CATEGORIES, type ToolDef } from "./tools/types";
import { config, hrefFor } from "./lib/config";
import { HomePage } from "./pages/Home";
import { ToolPage } from "./pages/ToolPage";
import { AboutPage } from "./pages/About";
import { NotFoundPage } from "./pages/NotFound";
import { ApiResponsePage } from "./pages/ApiResponse";
import { DocsLayoutRoute } from "./pages/Docs";

export const SITE_NAME = config.service_name;
export const SITE_TAGLINE = "Free Discord utilities that run in your browser";

// The header shows the configured name, with the final word styled as a subtitle. Derived rather
// than hard-coded so a fork's name appears verbatim.
const brandBreak = SITE_NAME.lastIndexOf(" ");
const brandLead = brandBreak > 0 ? SITE_NAME.slice(0, brandBreak + 1) : SITE_NAME;
const brandTail = brandBreak > 0 ? SITE_NAME.slice(brandBreak + 1) : "";

function useDocTitle(title?: string) {
  useEffect(() => {
    document.title = title
      ? `${title} \u00b7 ${SITE_NAME}`
      : `${SITE_NAME} \u00b7 ${SITE_TAGLINE}`;
  }, [title]);
}

export function ToolCard({ tool }: { tool: ToolDef }) {
  return (
    <Link to={`/tool/${tool.slug}`} className="card">
      {tool.needsNetwork ? <span className="card__tag">network</span> : null}
      <span className="card__icon">
        <Icon name={tool.icon} size={16} />
      </span>
      <span className="card__name">
        <span>{tool.name}</span>
      </span>
      <span className="card__desc">{tool.description}</span>
    </Link>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const grouped = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        tools: TOOLS.filter((tool) => tool.category === category.id),
      })),
    [],
  );

  return (
    <nav className={`sidebar ${open ? "is-open" : ""}`} aria-label="Tools">
      <div className="sidebar__inner">
        {grouped.map(({ category, tools }) => (
          <div className="sidebar__group" key={category.id}>
            <div className="sidebar__title">
              {category.label}
              <span className="faint" style={{ marginLeft: 6 }}>
                {tools.length}
              </span>
            </div>
            {tools.map((tool) => (
              <NavLink
                key={tool.slug}
                to={`/tool/${tool.slug}`}
                className={({ isActive }) => `sidebar__link ${isActive ? "is-active" : ""}`}
                onClick={onClose}
              >
                <Icon name={tool.icon} size={14} />
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tool.name}
                </span>
              </NavLink>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}

/**
 * Footer links driven by `DISTOOLS_CONFIG`.
 *
 * Privacy and terms are left out entirely when the config leaves them blank, which is what the
 * file's own comments promise. Support may be an email or a URL; `hrefFor` decides which, turning
 * an email into a `mailto:`.
 */
function ConfigFooterLinks() {
  const support = hrefFor(config.service_support);
  const links: { label: string; href: string; icon: IconName }[] = [
    { label: "Docs", href: config.service_docs_link, icon: "book" },
    { label: "Code", href: config.service_repo_link, icon: "star" },
  ];
  if (support) links.push({ label: "Support", href: support, icon: "info" });
  links.push({
    label: config.license,
    href: `${config.service_repo_link}/blob/main/LICENSE`,
    icon: "shield",
  });
  if (config.privacy_policy) {
    links.push({ label: "Privacy", href: config.privacy_policy, icon: "shield" });
  }
  if (config.terms_of_service) {
    links.push({ label: "Terms", href: config.terms_of_service, icon: "info" });
  }

  return (
    <nav className="row-flex" aria-label="Project links" style={{ gap: 4, flexWrap: "wrap" }}>
      {links.map((link) =>
        /^https?:\/\//i.test(link.href) ? (
          <a
            key={link.label}
            className="btn btn--ghost btn--sm"
            href={link.href}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name={link.icon} size={13} /> {link.label}
          </a>
        ) : (
          <Link key={link.label} className="btn btn--ghost btn--sm" to={link.href}>
            <Icon name={link.icon} size={13} /> {link.label}
          </Link>
        ),
      )}
    </nav>
  );
}

function Layout() {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="app">
      <header className="site-header">
        <div className="site-header__inner">
          <button
            type="button"
            className="nav-toggle"
            onClick={() => setNavOpen((value) => !value)}
            aria-label="Toggle navigation"
            aria-expanded={navOpen}
          >
            <Icon name={navOpen ? "close" : "menu"} size={17} />
          </button>
          <Link to="/" className="brand">
            <img
              className="brand__mark"
              src={`${import.meta.env.BASE_URL}favicon.svg`}
              alt=""
              width={26}
              height={26}
            />
            <span>
              {brandLead}
              <span className="brand__sub">{brandTail}</span>
            </span>
          </Link>
          <span className="header-spacer" />
          <Link to="/about" className="btn btn--ghost btn--sm">
            <Icon name="info" size={14} /> About
          </Link>
          <Link to="/docs" className="btn btn--ghost btn--sm">
            <Icon name="book" size={14} /> Docs
          </Link>
        </div>
      </header>

      <div className="app-body">
        <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
        <main className="main">
          <Outlet />
        </main>
      </div>

      <footer className="site-footer">
        <div className="container site-footer__inner" style={{ flexWrap: "wrap" }}>
          <span>
            Not affiliated with, endorsed by, or sponsored by Discord Inc. Trademarks belong
            to their respective owners.
          </span>
          <ConfigFooterLinks />
          <span>Nothing leaves your browser</span>
        </div>
      </footer>
    </div>
  );
}

function HomeRoute() {
  useDocTitle();
  return <HomePage />;
}

function ToolRoute() {
  const location = useLocation();
  const slug = location.pathname.split("/").filter(Boolean).pop() ?? "";
  const tool = TOOLS.find((entry) => entry.slug === slug);
  useDocTitle(tool?.name);
  return <ToolPage tool={tool} />;
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        {/*
         * Docs sit outside the tools `Layout` rather than nested inside it. Fumadocs is a
         * full-page layout with its own header, sidebar and scroll container; rendering it inside
         * the tools shell and then trying to hide that shell with CSS does not work, because the
         * element the docs render into is itself part of the shell. Being siblings keeps each
         * layout whole.
         */}
        <Route path="docs/*" element={<DocsLayoutRoute />} />
        <Route element={<Layout />}>
          <Route index element={<HomeRoute />} />
          <Route path="tool/:slug" element={<ToolRoute />} />
          <Route path="about" element={<AboutPage />} />
          {/*
           * The shipped `DISTOOLS_CONFIG` points its privacy and terms links at `/privacy` and
           * `/terms` on this domain. Those are sent into the docs so the buttons work out of the
           * box, while anyone pointing the config at an external policy keeps that behaviour.
           */}
          <Route path="privacy" element={<Navigate to="/docs/privacy" replace />} />
          <Route path="terms" element={<Navigate to="/docs/terms" replace />} />
          <Route path="api/v1/*" element={<ApiResponsePage />} />
          <Route path="api/v1" element={<ApiResponsePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}