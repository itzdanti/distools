import { Suspense, lazy, useMemo } from "react";
import { Link } from "react-router";
import { ToolCard } from "../App";
import { Icon } from "../components/ui";
import { TOOLS } from "../tools/registry";
import { CATEGORY_MAP, type ToolDef } from "../tools/types";
import { NotFoundPage } from "./NotFound";

/**
 * The reference panel is built from the same registry the Worker serves, which drags in the
 * emoji, sound and generator data. None of that is needed to use a tool, so it loads on
 * demand rather than sitting in the main bundle.
 */
const ApiReference = lazy(() =>
  import("../components/ApiReference").then((module) => ({ default: module.ApiReference })),
);

export function ToolPage({ tool }: { tool: ToolDef | undefined }) {
  const related = useMemo(() => {
    if (!tool) return [];
    const scored = TOOLS.filter((entry) => entry.slug !== tool.slug).map((entry) => ({
      entry,
      score:
        (entry.category === tool.category ? 2 : 0) +
        entry.keywords.filter((word) => tool.keywords.includes(word)).length,
    }));
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((item) => item.entry);
  }, [tool]);

  if (!tool) return <NotFoundPage />;

  const category = CATEGORY_MAP.get(tool.category);
  const ToolComponent = tool.component;

  return (
    <div className="fade-in">
      <div className="tool-header">
        <div className="breadcrumbs">
          <Link to="/">Home</Link>
          <Icon name="chevron" size={11} />
          {category ? (
            <Link to={`/?q=${encodeURIComponent(category.label)}`}>{category.label}</Link>
          ) : null}
          <Icon name="chevron" size={11} />
          <span>{tool.name}</span>
        </div>
        <div className="tool-header__top">
          <span className="tool-header__icon">
            <Icon name={tool.icon} size={19} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h1>{tool.name}</h1>
            <p className="page-sub" style={{ marginTop: 4 }}>
              {tool.description}
            </p>
          </div>
        </div>
      </div>

      <ToolComponent />

      <Suspense fallback={null}>
        <ApiReference slug={tool.slug} />
      </Suspense>

      {related.length > 0 ? (
        <div className="related">
          <h2 className="section-title">Related tools</h2>
          <div className="grid">
            {related.map((entry) => (
              <ToolCard key={entry.slug} tool={entry} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}