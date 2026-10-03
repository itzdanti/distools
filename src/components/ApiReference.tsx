/**
 * Per-tool API reference.
 *
 * Every snippet here comes from the same endpoint registry that answers the API, so the
 * documentation cannot drift from the implementation: if an endpoint changes, this panel
 * changes with it.
 */

import { useState } from "react";
import {
  DEFAULT_ORIGIN,
  curlFor,
  endpointsForTool,
  fetchFor,
  urlFor,
  type ApiEndpoint,
} from "../lib/core/api";
import { TOOLS } from "../tools/registry";
import { CopyButton, Icon, Panel } from "./ui";

/**
 * Snippets point at the published origin. There is no build-time placeholder any more, because
 * the API ships with the site: the same repository serves the tools, the docs and the client
 * module, so there is only ever one host to name.
 */
const ORIGIN = DEFAULT_ORIGIN;

function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (tab: string) => void }) {
  return (
    <div className="chip-row" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={tab === active}
          className={tab === active ? "chip is-active" : "chip"}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  const [tab, setTab] = useState("JavaScript");

  const snippets: Record<string, string> = {
    URL: urlFor(endpoint, ORIGIN),
    cURL: curlFor(endpoint, ORIGIN),
    JavaScript: fetchFor(endpoint, ORIGIN),
  };
  const notes: Record<string, string> = {
    JavaScript:
      "Imports the client bundle and runs the same handler in your own runtime. This is the interface that works from the hosted GitHub Pages site.",
    URL: "Open this in a browser: the page runs the handler and prints the JSON. curl gets the HTML shell instead, because curl does not run JavaScript.",
    cURL: "Only works against a process serving the handler: `npm run serve`, `npm run dev`, or a self-hosted copy. GitHub Pages cannot run it, so curl there returns the HTML shell.",
  };
  const snippet = snippets[tab] ?? snippets.JavaScript;

  return (
    <div className="api-endpoint">
      <div className="api-endpoint__head">
        <span className="method method--get">GET</span>
        <code className="api-endpoint__path">{endpoint.path}</code>
        <span className="spacer" style={{ flex: 1 }} />
        <CopyButton value={() => snippet} label="Copy" iconOnly />
      </div>

      <p className="api-endpoint__summary">{endpoint.summary}</p>
      {endpoint.description ? (
        <p className="api-endpoint__desc">{endpoint.description}</p>
      ) : null}

      {endpoint.params.length > 0 ? (
        <details className="api-params">
          <summary>Parameters ({endpoint.params.length})</summary>
          <div className="api-params__list">
            {endpoint.params.map((param) => (
              <div key={param.name} className="api-param">
                <div className="api-param__name">
                  <code>{param.name}</code>
                  <span className="badge">{param.in === "body" ? "query" : param.in}</span>
                  {param.required ? <span className="badge badge--warn">required</span> : null}
                </div>
                <p className="api-param__desc">{param.description}</p>
                {param.default !== undefined ? (
                  <p className="api-param__example">default: {String(param.default)}</p>
                ) : null}
                {param.example !== undefined ? (
                  <p className="api-param__example">example: {param.example}</p>
                ) : null}
                {param.enum ? (
                  <p className="api-param__example">one of: {param.enum.join(", ")}</p>
                ) : null}
              </div>
            ))}
          </div>
        </details>
      ) : null}

      <Tabs tabs={["JavaScript", "URL", "cURL"]} active={tab} onChange={setTab} />
      <div className="output output--code">
        <code>{snippet}</code>
      </div>
      <p className="api-endpoint__desc api-endpoint__note">{notes[tab]}</p>
    </div>
  );
}

export function ApiReference({ slug }: { slug: string }) {
  const endpoints = endpointsForTool(slug);

  if (endpoints.length === 0) return null;

  return (
    <Panel
      title="API"
      icon="code"
      hint="The logic behind this tool, callable over HTTP or as an ES module."
      className="api-panel"
    >
      <p className="api-panel__status">
        <Icon name="info" size={13} /> Defined by this site at <code>{`${ORIGIN}/api/v1`}</code>. No
        key, no rate limit, nothing stored.
      </p>
      <div className="api-endpoints">
        {endpoints.map((endpoint) => (
          <EndpointCard key={endpoint.id} endpoint={endpoint} />
        ))}
      </div>

      <p className="api-panel__foot">
        <Icon name="info" size={13} /> GitHub Pages only serves files, so it cannot run a
        parameterised <code>curl</code>. Import <code>{`${ORIGIN}/api/v1/client.js`}</code> to run
        the handler from code, open the <strong>URL</strong> in a browser to see the answer, or run{" "}
        <code>npm run serve</code> to host the live API. Full reference under{" "}
        <a href="/docs/api">/docs/api</a>.
      </p>
    </Panel>
  );
}

/**
 * The API blurb on the About page.
 *
 * Lives here rather than in the page so it shares this module's chunk. Importing the registry
 * directly would put the emoji, sound and generator tables into the main bundle for the sake of
 * one paragraph.
 */
export function ApiAboutPanel({ toolCount }: { toolCount: number }) {
  const covered = TOOLS.filter((tool) => endpointsForTool(tool.slug).length > 0).length;

  return (
    <Panel title="There is an API too" icon="code">
      <p className="muted small">
        {covered} of the {toolCount} tools are backed by a JSON handler, which this site ships as an
        importable ES module and as JSON you can open in a browser. Each tool page has its own panel
        with copyable snippets, and the reference lives at <a href="/docs/api">/docs/api</a>.
      </p>
      <p className="muted small">
        The API is unauthenticated, stores nothing and accepts no token. It also accepts no
        webhook URL under any name, which is why the two webhook senders have no endpoint. The
        image editors do not either, since there is no useful JSON shape for a resized JPEG.
      </p>
    </Panel>
  );
}
