import { Suspense, lazy } from "react";
import { Link } from "react-router";
import { Icon, Panel } from "../components/ui";
import { SITE_NAME } from "../App";
import { config, hrefFor, serviceOrigin } from "../lib/config";
import { TOOLS } from "../tools/registry";
import { CATEGORIES } from "../tools/types";

/** Shares a chunk with the per-tool reference panel, so it stays out of the main bundle. */
const ApiAboutPanel = lazy(() =>
  import("../components/ApiReference").then((module) => ({ default: module.ApiAboutPanel })),
);

const PRIVACY_POINTS = [
  {
    title: "Text tools never leave the page",
    body: "Anything you type into a text, encoding, formatting or generator tool is processed with JavaScript in your own browser. There is no backend that could receive it.",
  },
  {
    title: "Image tools stay local",
    body: "Cropping and resizing read the file with the browser's File and Canvas APIs. The image is never uploaded anywhere, so there is no copy of it on a server.",
  },
  {
    title: "ID and invite lookups are the exception",
    body: "Tools marked 'network' in the corner of their card query the public Discord API to fetch a profile, avatar, banner or invite. That request contains only the ID or invite code you typed, never anything else.",
  },
  {
    title: "Lookups try Discord first, then a public proxy",
    body: "A web page cannot read most of the Discord API directly, so a lookup tries Discord first and only falls back to a public, unauthenticated proxy such as allorigins when the browser blocks it. Those proxies can technically see the request, which is why no private data should be pasted into those fields. The tool tells you which route answered.",
  },
  {
    title: "Some Discord routes now need a token",
    body: "Invite lookups still work without authentication. Server-by-ID and some profile lookups now answer 401 to anonymous callers, and Discord does not say whether that means the account is private or does not exist. Those tools report it as no public profile rather than guessing, and this site has no bot token and asks you for none.",
  },
  {
    title: "Webhooks skip the proxy entirely",
    body: "A webhook URL is a password, so nothing you type into the webhook tools is ever relayed through a third-party proxy. Those requests go straight from your browser to Discord. Anyone holding that URL can post as the webhook, so treat it like a password and delete the webhook when you are done.",
  },
  {
    title: "No accounts, no logs, no analytics",
    body: "There is no sign-in, no database and no tracking script. Clearing your browser storage removes everything this site has stored, which is nothing.",
  },
  {
    title: "Never paste a token",
    body: "The token inspector decodes a token structure entirely on your machine and never transmits it. A genuine Discord support agent will never ask you for your password, token or 2FA code.",
  },
];

export function AboutPage() {
  const networkTools = TOOLS.filter((tool) => tool.needsNetwork);

  return (
    <div className="fade-in">
      <div className="tool-header">
        <div className="breadcrumbs">
          <Link to="/">Home</Link>
          <Icon name="chevron" size={11} />
          <span>About &amp; privacy</span>
        </div>
        <h1 className="page-title">About {SITE_NAME}</h1>
        <p className="page-sub">
          A collection of {TOOLS.length} small utilities for Discord servers and users.
          Free, open to everyone, and built to stay out of the way.
        </p>
      </div>

      <div className="stack" style={{ maxWidth: 720 }}>
        <Panel title="What this is" icon="tool">
          <p className="muted">
            Everything here is a single-purpose page: one job, minimal options, a copy
            button. The goal is that you paste something in, get a result, copy it, and get
            on with your day. No dashboards, no account, no upsells.
          </p>
          <p className="muted">
            The whole site is static and hosted on GitHub Pages. If it loads, it works,
            regardless of what any server is doing.
          </p>
        </Panel>

        <Panel title="Privacy" icon="shield">
          <div className="stack">
            {PRIVACY_POINTS.map((point) => (
              <div key={point.title}>
                <div style={{ fontWeight: 560, marginBottom: 3 }}>{point.title}</div>
                <p className="muted small">{point.body}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="A note on what is deliberately missing" icon="alert">
          <p className="muted small">
            There are no tools here for logging messages, validating Nitro gift codes, or
            generating credentials that look real. Those exist to steal from people, and a
            site that hands them out is not a tool site. There are safe substitutes:
            the token inspector decodes the structure of a token you already own,
            mock ID generation gives you fake snowflakes for testing, and everything else
            here is genuinely useful.
          </p>
        </Panel>

        <Suspense fallback={null}>
          <ApiAboutPanel toolCount={TOOLS.length} />
        </Suspense>

        <Panel title={`Tools that use the network (${networkTools.length})`} icon="link">
          <p className="muted small">
            These are the only tools that make an outbound request. Everything else is
            pure client-side computation. Proxied lookups carry only the ID or code you
            typed; webhook tools connect straight to Discord.
          </p>
          <div className="chip-row">
            {networkTools.map((tool) => (
              <Link key={tool.slug} to={`/tool/${tool.slug}`} className="chip">
                <Icon name={tool.icon} size={13} />
                {tool.name}
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title="Categories" icon="grid">
          <div className="chip-row">
            {CATEGORIES.map((category) => {
              const count = TOOLS.filter((tool) => tool.category === category.id).length;
              return (
                <Link
                  key={category.id}
                  to={`/?q=${encodeURIComponent(category.label)}`}
                  className="chip"
                >
                  <Icon name={category.icon} size={13} />
                  {category.label}
                  <span className="faint">{count}</span>
                </Link>
              );
            })}
          </div>
        </Panel>

        <Panel title="Trademark notice" icon="info">
          <p className="muted small">
            Discord is a trademark of Discord Inc. This project is not affiliated with,
            endorsed by, or sponsored by Discord Inc. Names, icons and branding referenced
            in these tools belong to their respective owners and are used only to describe
            what each tool does.
          </p>
        </Panel>

        {/*
         * Everything in this panel comes from `DISTOOLS_CONFIG`. The privacy and terms buttons
         * only appear when those settings are non-empty, and the support link becomes a
         * `mailto:` when the setting is an email.
         */}
        <Panel title="Project & legal" icon="info">
          <p className="muted small">
            <strong>{config.service_name}</strong> is served at{" "}
            <a href={serviceOrigin}>{config.service_deploy_domain}</a> and its source lives in the{" "}
            <a href={config.service_repo_link} target="_blank" rel="noreferrer">
              repository
            </a>
            .
          </p>
          <div className="chip-row">
            <a className="chip" href={config.service_repo_link} target="_blank" rel="noreferrer">
              <Icon name="star" size={13} /> Repository
            </a>
            <a className="chip" href={config.service_docs_link}>
              <Icon name="book" size={13} /> Documentation
            </a>
            {config.service_support ? (
              <a className="chip" href={hrefFor(config.service_support)}>
                <Icon name="info" size={13} /> Support
              </a>
            ) : null}
            {config.privacy_policy ? (
              <a className="chip" href={config.privacy_policy}>
                <Icon name="shield" size={13} /> Privacy policy
              </a>
            ) : null}
            {config.terms_of_service ? (
              <a className="chip" href={config.terms_of_service}>
                <Icon name="info" size={13} /> Terms of service
              </a>
            ) : null}
          </div>
          <p className="muted small">
            Released under <strong>{config.license}</strong>. For legal or takedown requests,
            email{" "}
            <a href={`mailto:${config.takedown_email}`}>{config.takedown_email}</a>.
          </p>
        </Panel>
      </div>
    </div>
  );
}