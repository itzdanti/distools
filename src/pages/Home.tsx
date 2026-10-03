import { useEffect, useMemo, useRef, useState } from "react";
import { ToolCard, SITE_NAME } from "../App";
import { Icon } from "../components/ui";
import { TOOLS } from "../tools/registry";
import { CATEGORIES } from "../tools/types";

function useQuery(): [string, (value: string) => void] {
  const [query, setQuery] = useState(
    () => new URLSearchParams(window.location.search).get("q") ?? "",
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (query) params.set("q", query);
      else params.delete("q");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState(null, "", next);
    }, 220);
    return () => clearTimeout(timer);
  }, [query]);

  return [query, setQuery];
}

export function HomePage() {
  const [query, setQuery] = useQuery();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "/" && !isTyping(event.target)) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return null;
    return TOOLS.filter((tool) =>
      [tool.name, tool.description, tool.slug, ...tool.keywords]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query]);

  const featured = TOOLS.filter((tool) => tool.featured);
  const offlineCount = TOOLS.filter((tool) => !tool.needsNetwork).length;

  return (
    <>
      <section className="hero">
        <h1>
          Everything you need
          <br />
          to run a Discord server.
        </h1>
        <p>
          {SITE_NAME} is a growing set of small, focused utilities for Discord. Text
          formatters, snowflake and ID tools, invite lookups, an embed builder, image
          resizing, and more. Everything runs client side, so whatever you paste stays on
          your machine.
        </p>

        <div className="search-bar">
          <Icon name="search" size={17} />
          <input
            ref={searchRef}
            type="search"
            value={query}
            placeholder="Search tools, try “snowflake” or “embed”"
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search tools"
          />
          <span className="search-bar__kbd">
            <span className="kbd">/</span>
          </span>
        </div>

        <div className="hero__stats">
          <div className="hero__stat">
            <b>{TOOLS.length}</b>
            <span>tools</span>
          </div>
          <div className="hero__stat">
            <b>{CATEGORIES.length}</b>
            <span>categories</span>
          </div>
          <div className="hero__stat">
            <b>{offlineCount}</b>
            <span>work offline</span>
          </div>
          <div className="hero__stat">
            <b>0</b>
            <span>accounts needed</span>
          </div>
        </div>
      </section>

      {results ? (
        <section>
          <h2 className="section-title">
            {results.length} result{results.length === 1 ? "" : "s"}
          </h2>
          {results.length === 0 ? (
            <div className="empty-state">
              Nothing matched <b>{query}</b>. Try a broader term.
            </div>
          ) : (
            <div className="grid grid--wide">
              {results.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {featured.length > 0 ? (
            <section style={{ marginBottom: 40 }}>
              <h2 className="section-title">Popular</h2>
              <div className="grid grid--wide">
                {featured.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          ) : null}

          {CATEGORIES.map((category) => {
            const tools = TOOLS.filter((tool) => tool.category === category.id);
            if (tools.length === 0) return null;
            return (
              <section key={category.id} style={{ marginBottom: 40 }}>
                <h2 className="section-title">{category.label}</h2>
                <p className="muted small" style={{ marginTop: -8, marginBottom: 14 }}>
                  {category.description}
                </p>
                <div className="grid">
                  {tools.map((tool) => (
                    <ToolCard key={tool.slug} tool={tool} />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </>
  );
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}