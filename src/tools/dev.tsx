import { useMemo, useState } from "react";
import {
  Checkbox,
  CopyButton,
  Field,
  Icon,
  Notice,
  Output,
  Panel,
  Rows,
  Row,
  Slider,
  StatTile,
  Tabs,
  TextArea,
  TextInput,
  useToast,
} from "../components/ui";
import {
  decodeBase64,
  decodeBase64Url,
  decodeUrl,
  encodeBase64,
  encodeBase64Url,
  encodeUrl,
  encodeUrlComponentSafe,
} from "../lib/codecs";
import {
  contrastAgainst,
  hexToRgb,
  hslToRgb,
  isHex,
  luminanceLabel,
  parseHslString,
  parseRgbString,
  randomHex,
  rgbToHex,
  rgbToHsl,
  toDecimal,
} from "../lib/color";
import {
  DEFAULT_PASSWORD,
  UUID_BATCH,
  estimateStrength,
  generatePassword,
  type PasswordOptions,
} from "../lib/generators";
import { formatStamp, MARKDOWN_ROWS, relativeFrom } from "../lib/discordData";
import { copyText, downloadText } from "../lib/clipboard";
import { parseJson, runJsonMode } from "../lib/core/json";
import { inspectToken, maskToken, type TokenShape } from "../lib/core/token";

/* ------------------------------- base64 ---------------------------------- */

export function Base64Tool() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [urlSafe, setUrlSafe] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (value = input) => {
    try {
      if (!value.trim()) {
        setOutput("");
        setError(null);
        return;
      }
      if (mode === "encode") {
        setOutput(urlSafe ? encodeBase64Url(value) : encodeBase64(value));
      } else {
        setOutput(urlSafe ? decodeBase64Url(value) : decodeBase64(value));
      }
      setError(null);
    } catch (caught) {
      setOutput("");
      setError(caught instanceof Error ? caught.message : "That input could not be processed.");
    }
  };

  return (
    <div className="stack">
      <Panel title="Mode" icon="code">
        <Tabs
          value={mode}
          onChange={(value) => {
            setMode(value);
            setOutput("");
            setError(null);
          }}
          options={[
            { value: "encode", label: "Text to Base64" },
            { value: "decode", label: "Base64 to text" },
          ]}
        />
        <Checkbox
          checked={urlSafe}
          onChange={setUrlSafe}
          label="URL-safe variant (- and _ instead of + and /, no padding)"
        />
      </Panel>

      <Panel title="Input" icon="type">
        <TextArea value={input} onChange={setInput} rows={5} mono placeholder="Paste here" />
        <div className="btn-row">
          <button className="btn btn--primary" onClick={() => run()}>
            <Icon name="zap" size={15} /> Convert
          </button>
          <button className="btn" onClick={() => run(input)}>
            <Icon name="refresh" size={15} /> Re-run
          </button>
          <button
            className="btn"
            onClick={() => {
              setInput("");
              setOutput("");
              setError(null);
            }}
          >
            Clear
          </button>
        </div>
      </Panel>

      {error ? <Notice variant="danger">{error}</Notice> : null}

      <Panel
        title="Output"
        icon="check"
        action={<CopyButton value={output} label="Copy" />}
      >
        <Output>{output}</Output>
        {output ? (
          <div className="row-flex">
            <span className="faint small">{output.length} characters</span>
            <span className="faint small">&middot;</span>
            <span className="faint small">
              {new TextEncoder().encode(output).length} bytes UTF-8
            </span>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}

/* --------------------------------- url ----------------------------------- */

export function UrlTool() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [strict, setStrict] = useState(true);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (value = input) => {
    try {
      if (!value.trim()) {
        setOutput("");
        setError(null);
        return;
      }
      if (mode === "encode") {
        setOutput(strict ? encodeUrlComponentSafe(value) : encodeUrl(value));
      } else {
        setOutput(decodeUrl(value.replace(/\+/g, "%20")));
      }
      setError(null);
    } catch (caught) {
      setOutput("");
      setError(caught instanceof Error ? caught.message : "Could not process that.");
    }
  };

  return (
    <div className="stack">
      <Panel title="Mode" icon="link">
        <Tabs
          value={mode}
          onChange={(value) => {
            setMode(value);
            setOutput("");
            setError(null);
          }}
          options={[
            { value: "encode", label: "Encode" },
            { value: "decode", label: "Decode" },
          ]}
        />
        {mode === "encode" ? (
          <Checkbox
            checked={strict}
            onChange={setStrict}
            label="Strict RFC 3986 (also escapes ! ' ( ) *)"
          />
        ) : null}
      </Panel>

      <Panel title="Input" icon="type">
        <TextArea
          value={input}
          onChange={setInput}
          rows={5}
          mono
          placeholder="https://example.com/a b?x=1&y=2"
        />
        <div className="btn-row">
          <button className="btn btn--primary" onClick={() => run()}>
            <Icon name="zap" size={15} /> Convert
          </button>
          <button className="btn" onClick={() => run(input)}>
            <Icon name="refresh" size={15} /> Re-run
          </button>
        </div>
      </Panel>

      {error ? <Notice variant="danger">{error}</Notice> : null}

      <Panel title="Output" icon="check" action={<CopyButton value={output} label="Copy" />}>
        <Output>{output}</Output>
      </Panel>

      <Panel title="Characters" icon="info">
        <Rows>
          {[
            ["Space", "%20", "+"],
            ["Ampersand", "%26", "&"],
            ["Hash", "%23", "#"],
            ["Question mark", "%3F", "?"],
            ["Equals", "%3D", "="],
            ["Slash", "%2F", "/"],
            ["Colon", "%3A", ":"],
            ["Plus", "%2B", "+"],
          ].map(([name, encoded, literal]) => (
            <Row key={name} k={name} v={`${encoded}  or  ${literal}`} />
          ))}
        </Rows>
        <Notice>
          In query strings, a space can be written as %20 or as +. Everywhere else, only
          %20 is valid.
        </Notice>
      </Panel>
    </div>
  );
}

/* --------------------------------- json ---------------------------------- */

type JsonMode = "pretty" | "minify" | "validate" | "escape" | "unescape";

export function JsonTool() {
  const [mode, setMode] = useState<JsonMode>("pretty");
  const [indent, setIndent] = useState(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [input, setInput] = useState('{\n  "name": "aki",\n  "tags": ["tools", "discord"]\n}');
  const toast = useToast();

  const parsed = useMemo(() => parseJson(input), [input]);

  const { output, error } = useMemo(
    () => runJsonMode(input, mode, { indent, sortKeys }),
    [mode, input, indent, sortKeys],
  );

  const depth = useMemo(() => {
    if (parsed.data === null) return 0;
    let max = 0;
    const walk = (value: unknown, level: number) => {
      max = Math.max(max, level);
      if (Array.isArray(value)) value.forEach((entry) => walk(entry, level + 1));
      else if (value && typeof value === "object") {
        Object.values(value as Record<string, unknown>).forEach((entry) => walk(entry, level + 1));
      }
    };
    walk(parsed.data, 0);
    return max;
  }, [parsed.data]);

  const keyCount = useMemo(() => {
    if (!parsed.data || typeof parsed.data !== "object" || Array.isArray(parsed.data)) return 0;
    return Object.keys(parsed.data as object).length;
  }, [parsed.data]);

  return (
    <div className="stack">
      <Panel title="Mode" icon="code">
        <Tabs
          value={mode}
          onChange={setMode}
          options={[
            { value: "pretty", label: "Pretty print" },
            { value: "minify", label: "Minify" },
            { value: "validate", label: "Validate" },
            { value: "escape", label: "Escape" },
            { value: "unescape", label: "Unescape" },
          ]}
        />
        {mode === "pretty" ? (
          <Field label="Indent">
            <Tabs
              value={String(indent)}
              onChange={(value) => setIndent(Number(value))}
              options={[
                { value: "2", label: "2 spaces" },
                { value: "4", label: "4 spaces" },
                { value: "0", label: "Tabs" },
              ]}
            />
          </Field>
        ) : null}
        {mode === "pretty" || mode === "minify" ? (
          <Checkbox checked={sortKeys} onChange={setSortKeys} label="Sort keys alphabetically" />
        ) : null}
      </Panel>

      <Panel title="Input" icon="type">
        <TextArea value={input} onChange={setInput} rows={9} mono placeholder="{ }" />
        <div className="btn-row">
          <button
            className="btn"
            onClick={async () => {
              const ok = await copyText(input);
              toast(ok ? "Input copied" : "Copy failed", ok ? "ok" : "error");
            }}
          >
            <Icon name="copy" size={15} /> Copy input
          </button>
          <button
            className="btn"
            onClick={() => {
              downloadText("payload.json", output, "application/json");
              toast("Downloaded payload.json");
            }}
            disabled={!output}
          >
            <Icon name="download" size={15} /> Download .json
          </button>
          <button className="btn" onClick={() => setInput("")}>
            Clear
          </button>
        </div>
      </Panel>

      {parsed.error ? (
        <Notice variant="danger">
          <b>Invalid JSON.</b> {parsed.error}
          {parsed.context ? (
            <>
              <div className="preview-frame" style={{ marginTop: 8, fontSize: 12 }}>
                {parsed.context}
              </div>
            </>
          ) : null}
        </Notice>
      ) : null}
      {error ? <Notice variant="danger">{error}</Notice> : null}

      {mode === "validate" && !parsed.error ? (
        <Notice variant="ok">
          Valid JSON. {Array.isArray(parsed.data) ? "Top level is an array." : "Top level is an object."}
        </Notice>
      ) : null}

      {parsed.data !== null ? (
        <div className="grid-3">
          <StatTile label="Size" value={`${parsed.size} B`} />
          <StatTile label="Top level keys" value={keyCount} />
          <StatTile label="Max depth" value={depth} />
        </div>
      ) : null}

      {mode !== "validate" ? (
        <Panel
          title="Output"
          icon="check"
          action={
            <>
              <CopyButton value={output} label="Copy" />
            </>
          }
        >
          <Output>{output}</Output>
        </Panel>
      ) : null}
    </div>
  );
}

/* --------------------------------- uuid ---------------------------------- */

export function UuidTool() {
  const [count, setCount] = useState(5);
  const [values, setValues] = useState<string[]>(() => UUID_BATCH(5));
  const [uppercase, setUppercase] = useState(false);
  const [braces, setBraces] = useState(false);

  const format = (value: string) => {
    let out = uppercase ? value.toUpperCase() : value;
    if (braces) out = `{${out}}`;
    return out;
  };

  return (
    <div className="stack">
      <Panel title="Options" icon="tool">
        <Slider label="How many" value={count} onChange={setCount} min={1} max={100} />
        <div className="chip-row">
          <Checkbox checked={uppercase} onChange={setUppercase} label="Uppercase" />
          <Checkbox checked={braces} onChange={setBraces} label="Wrap in braces" />
        </div>
        <div className="btn-row">
          <button
            className="btn btn--primary"
            onClick={() => setValues(UUID_BATCH(count))}
          >
            <Icon name="refresh" size={15} /> Generate
          </button>
          <CopyButton
            value={() => values.map(format).join("\n")}
            label="Copy all"
          />
        </div>
      </Panel>

      <Panel title={`UUIDs (${values.length})`} icon="hash">
        <Rows>
          {values.map((value, index) => (
            <Row key={value} k={`#${index + 1}`} v={format(value)} copyable />
          ))}
        </Rows>
        <Notice>
          Generated with crypto.getRandomValues when available, which makes these real
          version 4 UUIDs. Discord does not use UUIDs for user or object IDs, but plenty of
          bots and databases key on them.
        </Notice>
      </Panel>
    </div>
  );
}

/* ----------------------------- colour converter -------------------------- */

export function ColorTool() {
  const [hex, setHex] = useState("#5865f2");
  const [rgbText, setRgbText] = useState("88, 101, 242");
  const [hslText, setHslText] = useState("235, 86, 65");

  const { derived, parseError } = useMemo(() => {
    const empty = {
      hex: "",
      rgb: "",
      hsl: "",
      decimal: "",
      luminance: "",
    };
    if (!hex.trim()) return { derived: empty, parseError: null as string | null };
    if (!isHex(hex)) {
      return {
        derived: empty,
        parseError: "Enter a hex colour such as #5865f2, or 3 or 6 hex digits.",
      };
    }
    try {
      const rgb = hexToRgb(hex);
      const hsl = rgbToHsl(rgb);
      return {
        derived: {
          hex: rgbToHex(rgb),
          rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
          hsl: `${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%`,
          decimal: toDecimal(hex),
          luminance: luminanceLabel(hex),
        },
        parseError: null as string | null,
      };
    } catch (caught) {
      return {
        derived: empty,
        parseError: caught instanceof Error ? caught.message : "Invalid colour.",
      };
    }
  }, [hex]);

  const applyRgb = (value: string) => {
    setRgbText(value);
    try {
      setHex(rgbToHex(parseRgbString(value)).slice(0, 7));
    } catch {
      /* keep the previous colour until the value parses */
    }
  };

  const applyHsl = (value: string) => {
    setHslText(value);
    try {
      const rgb = hslToRgb(parseHslString(value));
      setHex(rgbToHex(rgb).slice(0, 7));
    } catch {
      /* ditto */
    }
  };

  return (
    <div className="stack">
      <Panel
        title="Colour"
        icon="palette"
        action={
          <button className="btn btn--sm" onClick={() => setHex(randomHex())}>
            <Icon name="dice" size={13} /> Random
          </button>
        }
      >
        <div className="field__row" style={{ alignItems: "stretch", marginBottom: 14 }}>
          <div
            style={{
              width: 96,
              borderRadius: 10,
              border: "1px solid var(--border-strong)",
              background: isHex(hex) ? hex : "var(--surface-2)",
              flexShrink: 0,
            }}
          />
          <TextInput value={hex} onChange={setHex} mono placeholder="#5865f2" />
        </div>

        <div className="grid-2">
          <Field label="RGB">
            <TextInput value={rgbText} onChange={applyRgb} mono placeholder="88, 101, 242" />
          </Field>
          <Field label="HSL">
            <TextInput value={hslText} onChange={applyHsl} mono placeholder="235, 86, 65" />
          </Field>
        </div>
      </Panel>

      {parseError ? <Notice variant="danger">{parseError}</Notice> : null}

      {derived.hex ? (
        <>
          <Panel title="Conversions" icon="code">
            <Rows>
              <Row k="Hex" v={derived.hex} copyable />
              <Row k="RGB" v={`rgb(${derived.rgb})`} copyable />
              <Row k="HSL" v={`hsl(${derived.hsl})`} copyable />
              <Row k="Decimal" v={derived.decimal} copyable />
              <Row k="Discord embed integer" v={derived.decimal} copyable />
              <Row k="Perceived" v={derived.luminance} />
            </Rows>
          </Panel>

          {isHex(hex) ? <ContrastPanel hex={hex} /> : null}
        </>
      ) : null}
    </div>
  );
}

function ContrastPanel({ hex }: { hex: string }) {
  const verdict = contrastAgainst(hex);
  const pct = Math.min(100, (verdict.ratio / 21) * 100);
  return (
    <Panel title="Text contrast" icon="eye">
      <div className="grid-2">
        <div className="preview-frame" style={{ textAlign: "center" }}>
          <div style={{ color: "#fff", fontWeight: 600 }}>White text</div>
          <div className="faint small">{verdict.ratio.toFixed(2)}:1</div>
        </div>
        <div className="preview-frame" style={{ textAlign: "center" }}>
          <div style={{ color: "#000", fontWeight: 600 }}>Black text</div>
          <div className="faint small">{verdict.ratio.toFixed(2)}:1</div>
        </div>
      </div>

      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: "var(--surface-3)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "var(--accent-dim)",
          }}
        />
      </div>

      <div className="chip-row">
        <span className={`badge ${verdict.aaaNormal ? "badge--ok" : "badge--warn"}`}>
          AAA {verdict.aaaNormal ? "pass" : "fail"}
        </span>
        <span className={`badge ${verdict.aaNormal ? "badge--ok" : "badge--warn"}`}>
          AA {verdict.aaNormal ? "pass" : "fail"}
        </span>
        <span className="badge">Best pairing: {verdict.bestText}</span>
      </div>

      <Notice>
        Discord role colours are not guaranteed to be readable. Anything below 4.5:1 will be
        hard to read for people with low vision, so pick a darker or lighter shade if you
        can.
      </Notice>
    </Panel>
  );
}

/* ----------------------------- password gen ----------------------------- */

export function PasswordTool() {
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_PASSWORD);
  const [count, setCount] = useState(5);
  const [values, setValues] = useState<string[]>([]);

  const roll = () => {
    const out: string[] = [];
    const seen = new Set<string>();
    let guard = 0;
    while (out.length < count && guard < count * 20) {
      guard++;
      const value = generatePassword(options);
      if (seen.has(value)) continue;
      seen.add(value);
      out.push(value);
    }
    setValues(out);
  };

  const patch = (change: Partial<PasswordOptions>) =>
    setOptions((prev) => ({ ...prev, ...change }));

  return (
    <div className="stack">
      <Panel
        title="Settings"
        icon="tool"
        action={
          <button className="btn btn--sm" onClick={roll}>
            <Icon name="refresh" size={13} /> Roll
          </button>
        }
      >
        <Slider
          label="Length"
          value={options.length}
          onChange={(length) => patch({ length })}
          min={4}
          max={128}
        />
        <Slider label="How many" value={count} onChange={setCount} min={1} max={25} />
        <div className="grid-2" style={{ marginTop: 14 }}>
          <Checkbox
            checked={options.lowercase}
            onChange={(lowercase) => patch({ lowercase })}
            label="Lowercase a-z"
          />
          <Checkbox
            checked={options.uppercase}
            onChange={(uppercase) => patch({ uppercase })}
            label="Uppercase A-Z"
          />
          <Checkbox
            checked={options.digits}
            onChange={(digits) => patch({ digits })}
            label="Digits 0-9"
          />
          <Checkbox
            checked={options.symbols}
            onChange={(symbols) => patch({ symbols })}
            label="Symbols"
          />
          <Checkbox
            checked={options.avoidAmbiguous}
            onChange={(avoidAmbiguous) => patch({ avoidAmbiguous })}
            label="Skip lookalikes (l, 1, O, 0)"
          />
        </div>
      </Panel>

      <Panel title={`Passwords (${values.length})`} icon="lock">
        {values.length === 0 ? (
          <div className="empty-state">Hit Roll to generate.</div>
        ) : (
          <Rows>
            {values.map((value) => {
              const strength = estimateStrength(value);
              return (
                <div className="row" key={value}>
                  <span className="mono" style={{ wordBreak: "break-all", minWidth: 0 }}>
                    {value}
                  </span>
                  <span className="spacer" style={{ flex: 1 }} />
                  <span
                    className={`badge ${
                      strength.score >= 4
                        ? "badge--ok"
                        : strength.score >= 2
                          ? "badge--warn"
                          : "badge--danger"
                    }`}
                    title={`${strength.bits} bits of entropy`}
                  >
                    {strength.label}
                  </span>
                  <CopyButton value={value} iconOnly silent />
                </div>
              );
            })}
          </Rows>
        )}
        <Notice variant="warn">
          Generated in your browser with crypto.getRandomValues and never transmitted. Still
          use a password manager rather than reusing anything you find here.
        </Notice>
      </Panel>

      <Panel title="Why length wins" icon="shield">
        <Rows>
          <Row k="This generator, 20 chars" v="about 130 bits" />
          <Row k="Pinned diceware, 6 words" v="about 77 bits" />
          <Row k="8 random alphanumeric" v="about 47 bits" />
          <Row k="Human pattern like Pass1234" v="under 20 bits" />
        </Rows>
        <Notice>
          Length matters far more than symbol variety. Five long random words beat a short
          scramble of special characters every time, because they also survive form rules.
        </Notice>
      </Panel>
    </div>
  );
}

/* ---------------------------- token inspector ---------------------------- */

export function TokenInspector() {
  const [token, setToken] = useState("");
  const [revealed, setRevealed] = useState(false);

  const shape: TokenShape = useMemo(() => inspectToken(token), [token]);

  const masked = maskToken(token);
  const maskedFull = token.trim() ? masked : "";

  return (
    <div className="stack">
      <Notice variant="warn">
        <b>Everything here happens on your machine.</b> Nothing you paste is sent anywhere.
        If you did not initiate this yourself, close the tab, change your password, and
        enable two-factor authentication. Never share a token, with anyone, ever.
      </Notice>

      <Panel title="Token" icon="key">
        <TextArea
          value={token}
          onChange={setToken}
          rows={4}
          mono
          placeholder="Paste a token you own to inspect its structure"
        />
        <div className="btn-row">
          <button className="btn" onClick={() => setToken("")}>
            Clear
          </button>
          {maskedFull ? (
            <CopyButton value={maskedFull} label="Copy masked" />
          ) : null}
        </div>
      </Panel>

      {token.trim() ? (
        <>
          <Panel title="Structure" icon="code">
            <Rows>
              <Row k="Segments" v={`${shape.segments.length} / 3`} />
              <Row
                k="First segment (user ID)"
                v={shape.userId || "could not decode"}
                copyable={Boolean(shape.userId)}
              />
              <Row
                k="Issued"
                v={shape.issuedAt ? shape.issuedAt.toISOString() : "could not decode"}
              />
              <Row
                k="Signature"
                v={`${shape.segments[2]?.length ?? 0} chars (not decoded)`}
              />
            </Rows>
          </Panel>

          <Panel title="Masked" icon="shield">
            <Output>{masked}</Output>
            <div className="btn-row">
              <button className="btn" onClick={() => setRevealed((value) => !value)}>
                <Icon name="eye" size={15} /> {revealed ? "Hide" : "Show"} full token
              </button>
            </div>
            {revealed ? (
              <>
                <Output>{token}</Output>
                <Notice variant="danger">
                  You just revealed a credential on screen. If this ever leaves your
                  machine, treat the account as compromised.
                </Notice>
              </>
            ) : null}
          </Panel>

          <Panel title="How a token is built" icon="info">
            <p className="muted small">
              The first two segments are Base64url of your user ID and the time the token
              was issued. The third is an HMAC signed with Discord's rotating key, which is
              why it cannot be verified here and why it changes whenever your password does.
            </p>
            <Output>{`${shape.segments[0] ?? "<userId>"}.<issuedAt>.<hmac>`}</Output>
          </Panel>
        </>
      ) : null}

      {shape.error ? <Notice variant="danger">{shape.error}</Notice> : null}
    </div>
  );
}

/* --------------------------- timestamp generator ------------------------ */

export function TimestampTool() {
  const [date, setDate] = useState(() => {
    const soon = new Date(Date.now() + 60 * 60 * 1000);
    return soon.toISOString().slice(0, 16);
  });
  const [unixInput, setUnixInput] = useState("");
  const toast = useToast();

  const toLocalInput = (value: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
  };

  const applyUnix = (value: string) => {
    setUnixInput(value);
    const seconds = Number(value.replace(/\D/g, ""));
    if (seconds <= 0) return;
    const converted = new Date(seconds * 1000);
    if (Number.isNaN(converted.getTime())) {
      toast("That is not a valid Unix timestamp", "error");
      return;
    }
    setDate(toLocalInput(converted));
    toast("Converted to your local time");
  };

  const parsed = new Date(date);
  const valid = !Number.isNaN(parsed.getTime());
  const stamp = valid ? formatStamp(parsed) : null;

  const presets: { label: string; offset: () => Date }[] = [
    { label: "Now", offset: () => new Date() },
    { label: "+5 min", offset: () => new Date(Date.now() + 5 * 60_000) },
    { label: "+1 hour", offset: () => new Date(Date.now() + 60 * 60_000) },
    { label: "Midnight", offset: () => { const d = new Date(); d.setHours(24, 0, 0, 0); return d; } },
    { label: "Tomorrow 9am", offset: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d; } },
    { label: "+1 week", offset: () => new Date(Date.now() + 7 * 86_400_000) },
    { label: "+30 days", offset: () => new Date(Date.now() + 30 * 86_400_000) },
    { label: "Next month", offset: () => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d; } },
    { label: "In a year", offset: () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d; } },
  ];

  return (
    <div className="stack">
      <Panel title="Date and time" icon="clock">
        <input
          type="datetime-local"
          className="input"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <div className="chip-row">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="chip"
              onClick={() => setDate(toLocalInput(preset.offset()))}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <Field label="Or paste Unix seconds" hint="Converts to your local time as you type.">
          <TextInput
            value={unixInput}
            onChange={applyUnix}
            mono
            placeholder="1767225600"
          />
        </Field>
      </Panel>

      {!valid ? <Notice variant="danger">That date could not be read.</Notice> : null}

      {stamp ? (
        <>
          <Panel title="Discord tags" icon="code">
            <Rows>
              <Row k="Short time" v={stamp.shortTime} copyable />
              <Row k="Long time" v={stamp.longTime} copyable />
              <Row k="Short date" v={stamp.shortDate} copyable />
              <Row k="Long date" v={stamp.longDate} copyable />
              <Row k="Full" v={`<t:${stamp.unix}:F>`} copyable />
              <Row k="Relative" v={stamp.relative} copyable />
            </Rows>
          </Panel>

          <Panel title="Raw" icon="hash">
            <Rows>
              <Row k="Unix seconds" v={stamp.unix} copyable />
              <Row k="Unix milliseconds" v={String(parsed.getTime())} copyable />
              <Row k="ISO 8601" v={stamp.iso} copyable />
              <Row k="Local" v={parsed.toLocaleString()} />
              <Row k="UTC" v={parsed.toUTCString()} />
              <Row k="Relative from now" v={relativeFrom(parsed)} />
            </Rows>
          </Panel>

          <Panel
            title="All tags at once"
            icon="check"
            action={<CopyButton value={stamp.tags} label="Copy all" />}
          >
            <Output>{stamp.tags}</Output>
            <Notice>
              Each viewer sees the timestamp in their own timezone. The letter after the
              second colon picks the format, and <b>R</b> counts down while the time is in
              the future.
            </Notice>
          </Panel>
        </>
      ) : null}
    </div>
  );
}

/* ----------------------------- markdown guide --------------------------- */

export function MarkdownGuide() {
  const [query, setQuery] = useState("");

  const rows = MARKDOWN_ROWS.filter((row) =>
    [row.syntax, row.note].join(" ").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="stack">
      <Panel title="Search" icon="search">
        <TextInput value={query} onChange={setQuery} placeholder="filter by syntax or note" />
      </Panel>

      <Panel title={`Syntax (${rows.length})`} icon="book">
        {rows.length === 0 ? (
          <div className="empty-state">Nothing matched that.</div>
        ) : (
          <Rows>
            {rows.map((row) => (
              <div className="row" key={row.syntax} style={{ alignItems: "flex-start" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="mono" style={{ marginBottom: 3 }}>
                    {row.syntax.replaceAll("\n", "\\n")}
                  </div>
                  <div className="faint small">{row.note}</div>
                  {row.result !== "spoiler" && row.result !== "code block" ? (
                    <div style={{ marginTop: 5 }}>
                      <span className="preview-frame" style={{ display: "inline-block", padding: "4px 10px", fontSize: 13 }}>
                        {row.result.replaceAll("**", "").replaceAll("~~", "")}
                      </span>
                    </div>
                  ) : null}
                </div>
                <CopyButton value={row.syntax} iconOnly silent />
              </div>
            ))}
          </Rows>
        )}
      </Panel>

      <Panel title="Formatting rules" icon="info">
        <div className="stack stack--sm">
          <p className="muted small">
            <b>Escaping.</b> Put a backslash before a character to show it literally, so
            <span className="mono"> \*not italic\* </span>
            prints as <span className="mono">*not italic*</span>.
          </p>
          <p className="muted small">
            <b>Headings need a space.</b> <span className="mono">#heading</span> is just
            text. <span className="mono"># heading</span> is a heading. The space matters.
          </p>
          <p className="muted small">
            <b>Quotes end at a blank line.</b> Anything after an empty line inside a quote
            block becomes a normal paragraph again, which is how you mix a quote with a
            heading.
          </p>
          <p className="muted small">
            <b>Code blocks win.</b> Inside a triple-backtick block, nothing is formatted,
            including mentions and timestamps.
          </p>
          <p className="muted small">
            <b>Underscores ignore words.</b> <span className="mono">snake_case_word</span> is
            left alone, while <span className="mono">_word_</span> becomes italic.
          </p>
        </div>
      </Panel>
    </div>
  );
}
