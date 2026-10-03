import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import { API_PREFIX, DEFAULT_ORIGIN, createApi } from "../lib/core/api";
import { CopyButton, Icon, Panel } from "../components/ui";

/**
 * Renders the answer to an `/api/v1/...` URL.
 *
 * GitHub Pages has no process behind it, so a parameterised endpoint cannot be answered by the
 * file host. What it can do is ship this page and let the same handler that documents the
 * endpoint run here, in the reader's browser. Opening the URL shows the JSON; nothing leaves
 * the machine and no server is involved.
 */
export function ApiResponsePage() {
  const location = useLocation();
  const [state, setState] = useState<"loading" | "done">("loading");
  const [result, setResult] = useState<{ ok: boolean; body: string; status: number } | null>(null);

  const search = location.search;

  useEffect(() => {
    let cancelled = false;
    setState("loading");

    const run = async () => {
      const api = createApi({ origin: DEFAULT_ORIGIN, discord: browserDiscordGateway() });
      try {
        const response = await api.handle(new Request(`${DEFAULT_ORIGIN}${location.pathname}${search}`, {
          method: "GET",
        }));
        const body = await response.text();
        if (cancelled) return;
        setResult({ ok: response.ok, body: pretty(body), status: response.status });
      } catch (error) {
        if (cancelled) return;
        setResult({
          ok: false,
          status: 500,
          body: pretty(JSON.stringify({ error: { message: String(error), status: 500 } }, null, 2)),
        });
      } finally {
        if (!cancelled) setState("done");
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, search]);

  const pretty_ = useMemo(() => (result ? tryFormat(result.body) : ""), [result]);

  useEffect(() => {
    document.title = `${result?.status ?? "…"} ${location.pathname.replace(API_PREFIX, "")} · API`;
  }, [result, location.pathname]);

  return (
    <div className="container fade-in api-response">
      <div className="tool-header">
        <div className="breadcrumbs">
          <Link to="/">Home</Link>
          <Icon name="chevron" size={11} />
          <Link to="/docs/api">API</Link>
          <Icon name="chevron" size={11} />
          <span>{location.pathname.replace(API_PREFIX, "") || "/"}</span>
        </div>
        <h1>
          <Icon name="code" size={20} />
          API response
        </h1>
        <p className="muted">
          {location.pathname}
          {search}
        </p>
      </div>

      {state === "loading" ? (
        <Panel title="Working">
          <p className="muted small">Running the endpoint in your browser.</p>
        </Panel>
      ) : (
        <Panel
          title={`${result?.status} ${result?.ok ? "OK" : "Error"}`}
          icon={result?.ok ? "check" : "alert"}
          action={
            <CopyButton value={pretty_} label="Copy JSON" />
          }
        >
          <p className="muted small">
            Computed in your browser by the same handler that serves{" "}
            <a href={`${API_PREFIX}/client.js`}>{API_PREFIX}/client.js</a>. Nothing was sent to a
            server.
          </p>
          <pre className="code-block api-response__body">{pretty_}</pre>
        </Panel>
      )}

      <Panel title="Try it from code" icon="code">
        <p className="muted small">
          Real JSON files (<code>index.json</code>, <code>openapi.json</code>) answer a plain{" "}
          <code>curl</code>. GitHub Pages cannot run the handler, so for a parameterised call import
          the client (it runs the handler in your own runtime) or run <code>npm run serve</code>:
        </p>
        <pre className="code-block">{`curl "${DEFAULT_ORIGIN}${API_PREFIX}/openapi.json"

import { api } from "${DEFAULT_ORIGIN}${API_PREFIX}/client.js";
const { data } = await api.get("${location.pathname.replace(API_PREFIX, "") || "/"}"${
          search ? `, Object.fromEntries(new URLSearchParams(${JSON.stringify(search)}))` : ""
        });`}</pre>
      </Panel>
    </div>
  );
}

function pretty(body: string): string {
  return tryFormat(body);
}

function tryFormat(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

/**
 * Discord lookups, straight to Discord. Only the invite routes send CORS headers, so this
 * succeeds for those and raises Discord's own 401 for the rest.
 */
function browserDiscordGateway() {
  return {
    async get(path: string, signal?: AbortSignal): Promise<unknown> {
      const response = await fetch(`https://discord.com/api/v10${path}`, {
        ...(signal ? { signal } : {}),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`Discord answered ${response.status} for ${path}.`);
      }
      return response.json();
    },
  };
}
