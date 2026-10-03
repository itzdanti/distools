import { Link } from "react-router";
import { Icon } from "../components/ui";

export function NotFoundPage() {
  return (
    <div className="fade-in" style={{ padding: "80px 0", textAlign: "center" }}>
      <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: "-0.05em" }}>
        404
      </div>
      <h1 style={{ fontSize: 22, marginTop: 8 }}>This page does not exist</h1>
      <p className="muted" style={{ marginTop: 10, marginBottom: 24 }}>
        The link may be wrong, or the tool may have been renamed.
      </p>
      <Link to="/" className="btn btn--primary">
        <Icon name="grid" size={15} /> Back to all tools
      </Link>
    </div>
  );
}