import { useMemo, useState } from "react";
import {
  Checkbox,
  Chips,
  CopyButton,
  Field,
  Icon,
  Notice,
  Output,
  Panel,
  ResultList,
  Rows,
  Row,
  Select,
  Slider,
  StatTile,
  Tabs,
  TextArea,
  TextInput,
} from "../components/ui";
import {
  DIVIDERS,
  STYLE_OPTIONS,
  applyFont,
  analyzeText,
  buildDivider,
  escapeSpoiler,
  reverseText,
  spoilerEachChar,
  spoilerEachLine,
  toAccents,
  toOutline,
  toSmallCaps,
  toSpaced,
  toSubscript,
  toSuperscript,
  zalgo,
  type StyleName,
  type ZalgoMode,
} from "../lib/text";
import {
  CUSTOM_STATUS_EMOJI,
  CUSTOM_STATUS_PRESETS,
  RULE_TEMPLATES,
  buildRules,
  buildWelcome,
  generateBio,
  generateChannelSet,
  generateRole,
  generateServerName,
  generateUsernames,
  generateNicknames,
  type UsernameStyle,
} from "../lib/generators";
import { MENTION_TYPES } from "../lib/discordData";
import { buildMentions } from "../lib/core/mentions";

/* ------------------------------ fancy text ------------------------------- */

const STYLE_CHOICES = STYLE_OPTIONS.map((option) => ({
  value: option.id,
  label: option.label,
}));

export function FancyText() {
  const [input, setInput] = useState("hello there");
  const [styles, setStyles] = useState<StyleName[]>(["bold"]);
  const [effects, setEffects] = useState<string[]>([]);
  const [preview, setPreview] = useState(true);

  let styled = input;
  for (const style of styles) styled = applyFont(styled, style);
  if (effects.includes("outline")) styled = toOutline(styled);
  if (effects.includes("accent")) styled = toAccents(styled);
  if (effects.includes("spaced")) styled = toSpaced(styled);

  const effectOptions = [
    { value: "outline", label: "Outline" },
    { value: "accent", label: "Diacritics" },
    { value: "spaced", label: "Letter spaced" },
  ];

  return (
    <div className="stack">
      <Panel title="Input" icon="type">
        <TextArea value={input} onChange={setInput} rows={2} placeholder="Type anything" />
      </Panel>

      <Panel title="Styles" icon="wand">
        <Field label="Unicode fonts" hint="Stack them for combined results. Some fonts lack digits.">
          <Chips value={styles} onChange={setStyles} options={STYLE_CHOICES} />
        </Field>
        <Field label="Effects" hint="Outline adds a combining stroke, which reads as hollow text.">
          <Chips value={effects} onChange={setEffects} options={effectOptions} allowEmpty />
        </Field>
        <Checkbox checked={preview} onChange={setPreview} label="Show live preview" />
      </Panel>

      <Panel
        title="Result"
        icon="check"
        action={<CopyButton value={styled} label="Copy" />}
      >
        {preview ? (
          <div className="preview-frame" style={{ textAlign: "center", fontSize: 26 }}>
            {styled || <span className="faint">Preview</span>}
          </div>
        ) : null}
        <Output>{styled}</Output>
        {styles.includes("circled") && /[0-9]/.test(input) ? (
          <Notice variant="warn">
            The circled font has no numbers, so digits are left as plain characters.
          </Notice>
        ) : null}
      </Panel>
    </div>
  );
}

/* -------------------------- small caps & script ------------------------- */

export function SmallCaps() {
  const [input, setInput] = useState("discord formatting");
  const [mode, setMode] = useState<"small" | "super" | "sub" | "both">("small");

  let result = input;
  if (mode === "small" || mode === "both") result = toSmallCaps(result);
  if (mode === "super") result = toSuperscript(input);
  if (mode === "sub") result = toSubscript(input);
  if (mode === "both") result = toSuperscript(toSmallCaps(result));

  const missing = Array.from(input).filter(
    (char) => /[a-z]/i.test(char) && !/[a-z]/i.test(result),
  );

  return (
    <div className="stack">
      <Panel title="Input" icon="type">
        <TextArea value={input} onChange={setInput} rows={2} />
      </Panel>
      <Panel title="Mode" icon="wand">
        <Tabs
          value={mode}
          onChange={setMode}
          options={[
            { value: "small", label: "Small caps" },
            { value: "super", label: "Superscript" },
            { value: "sub", label: "Subscript" },
            { value: "both", label: "Both" },
          ]}
        />
      </Panel>
      <Panel title="Result" icon="check" action={<CopyButton value={result} label="Copy" />}>
        <div className="preview-frame" style={{ textAlign: "center", fontSize: 24 }}>
          {result}
        </div>
        <Output>{result}</Output>
        {missing.length > 0 ? (
          <Notice>
            No glyph exists for {Array.from(new Set(missing)).join(", ")} in this script, so
            those characters pass through unchanged.
          </Notice>
        ) : null}
      </Panel>
    </div>
  );
}

/* --------------------------------- zalgo --------------------------------- */

export function Zalgo() {
  const [input, setInput] = useState("discord");
  const [mode, setMode] = useState<ZalgoMode>("random");
  const [amount, setAmount] = useState(2);
  const [result, setResult] = useState(() => zalgo("discord", "random", 2));

  return (
    <div className="stack">
      <Panel title="Input" icon="type">
        <TextArea value={input} onChange={setInput} rows={2} />
        <div className="btn-row">
          <button
            className="btn btn--primary"
            onClick={() => setResult(zalgo(input, mode, amount))}
          >
            <Icon name="zap" size={15} /> Generate
          </button>
          <button
            className="btn"
            onClick={() => {
              setInput("");
              setResult("");
            }}
          >
            Clear
          </button>
        </div>
      </Panel>

      <Panel title="Settings" icon="tool">
        <Field label="Direction">
          <Select
            value={mode}
            onChange={setMode}
            options={[
              { value: "random", label: "Random" },
              { value: "up", label: "Up" },
              { value: "down", label: "Down" },
              { value: "middle", label: "Middle" },
              { value: "all", label: "Everywhere" },
            ]}
          />
        </Field>
        <Slider label="Intensity" value={amount} onChange={setAmount} min={1} max={8} />
      </Panel>

      <Panel title="Result" icon="check" action={<CopyButton value={result} label="Copy" />}>
        <div className="preview-frame" style={{ textAlign: "center", fontSize: 30 }}>
          {result || <span className="faint">Glitched text</span>}
        </div>
        <Output>{result}</Output>
        <Notice variant="warn">
          Combining marks render inconsistently across fonts and devices. If it looks plain
          for you, the person you send it to may still see the effect, and vice versa.
        </Notice>
      </Panel>
    </div>
  );
}

/* -------------------------------- spoilers ------------------------------ */

export function SpoilerTool() {
  const [input, setInput] = useState("The butler did it.");
  const [mode, setMode] = useState<"lines" | "chars" | "block">("lines");
  const [reveal, setReveal] = useState(false);
  const [nested, setNested] = useState("");

  const result =
    mode === "lines"
      ? spoilerEachLine(input)
      : mode === "chars"
        ? spoilerEachChar(input)
        : `||${input}||`;

  return (
    <div className="stack">
      <Panel title="Message" icon="eye">
        <TextArea value={input} onChange={setInput} rows={3} />
        <Tabs
          value={mode}
          onChange={setMode}
          options={[
            { value: "lines", label: "Per line" },
            { value: "chars", label: "Per character" },
            { value: "block", label: "Whole message" },
          ]}
        />
      </Panel>

      <Panel title="Preview" icon="eye">
        <div className="preview-frame">
          <span
            className={reveal ? undefined : "spoiler-blur"}
            style={reveal ? undefined : { filter: "blur(5px)" }}
            onClick={() => setReveal(true)}
          >
            {result.replaceAll("||", "")}
          </span>
        </div>
        <div className="btn-row">
          <button className="btn" onClick={() => setReveal((value) => !value)}>
            <Icon name="eye" size={15} /> {reveal ? "Hide" : "Reveal"}
          </button>
        </div>
      </Panel>

      <Panel title="Formatted" icon="check" action={<CopyButton value={result} label="Copy" />}>
        <Output>{result}</Output>
        <Notice>
          Spoiler tags cannot nest. Two pipes inside a spoiler close it early, which is why
          the escape helper exists.
        </Notice>
      </Panel>

      <Panel
        title="Fix nested pipes"
        icon="shield"
        action={<CopyButton value={escapeSpoiler(nested)} label="Copy" />}
        hint="Replaces every bare || with |||| so it stops acting as a spoiler tag."
      >
        <TextArea
          value={nested}
          onChange={setNested}
          rows={3}
          mono
          placeholder="Paste text that already contains ||"
        />
        {nested ? <Output>{escapeSpoiler(nested)}</Output> : null}
      </Panel>
    </div>
  );
}

/* -------------------------------- dividers ------------------------------- */

export function DividerMaker() {
  const [preset, setPreset] = useState("Thin");
  const [char, setChar] = useState("\u2500");
  const [length, setLength] = useState(40);

  const result = buildDivider(char, length);
  const active = DIVIDERS.find((entry) => entry.label === preset);

  const applyPreset = (label: string, value: string) => {
    setPreset(label);
    setChar(value.trimStart()[0] ?? "\u2500");
    setLength(value.replace(/\s+$/, "").length);
  };

  return (
    <div className="stack">
      <Panel title="Presets" icon="grid">
        <div className="chip-row">
          {DIVIDERS.map((divider) => (
            <button
              key={divider.label}
              type="button"
              className={`chip ${preset === divider.label ? "is-active" : ""}`}
              onClick={() => applyPreset(divider.label, divider.value)}
            >
              {divider.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Custom" icon="tool">
        <Field label="Character">
          <TextInput value={char} onChange={setChar} placeholder="Paste any symbol" mono />
        </Field>
        <Slider label="Length" value={length} onChange={setLength} min={2} max={100} />
        {active ? (
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => applyPreset(active.label, active.value)}
          >
            <Icon name="refresh" size={13} /> Reset to {active.label}
          </button>
        ) : null}
      </Panel>

      <Panel title="Result" icon="check" action={<CopyButton value={result} label="Copy" />}>
        <div className="preview-frame" style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
          {result}
        </div>
        <Output>{result}</Output>
        <Notice>
          Discord collapses repeated spaces, so pick a character that reads well without
          relying on spacing. Code blocks also work well for dividers that need alignment.
        </Notice>
      </Panel>
    </div>
  );
}

/* ------------------------------ mentions -------------------------------- */

export function MentionGenerator() {
  const [type, setType] = useState<string>("user");
  const [ids, setIds] = useState("");

  const config = MENTION_TYPES.find((entry) => entry.id === type) ?? MENTION_TYPES[0];
  const { output: result } = useMemo(() => buildMentions(type, ids), [type, ids]);

  return (
    <div className="stack">
      <Panel title="Mention type" icon="user">
        <div className="chip-row">
          {MENTION_TYPES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`chip ${type === entry.id ? "is-active" : ""}`}
              onClick={() => setType(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <Notice>{config.note}</Notice>
      </Panel>

      <Panel title="IDs" icon="hash" hint="One per line, or separated by spaces or commas.">
        <TextArea value={ids} onChange={setIds} rows={4} mono placeholder="123456789012345678" />
      </Panel>

      <Panel title="Result" icon="check" action={<CopyButton value={result} label="Copy" />}>
        <Output>{result}</Output>
        <Notice variant="warn">
          Mentions only resolve if the user, role or channel is in the same server as where
          you send the message. Unknown IDs render as plain text.
        </Notice>
      </Panel>
    </div>
  );
}

/* ----------------------------- word counter ----------------------------- */

export function WordCounter() {
  const [text, setText] = useState("");
  const stats = analyzeText(text);

  return (
    <div className="stack">
      <Panel title="Text" icon="type">
        <TextArea value={text} onChange={setText} rows={8} placeholder="Paste anything" />
      </Panel>

      <div className="grid-3">
        <StatTile label="Characters" value={stats.characters.toLocaleString()} />
        <StatTile label="No spaces" value={stats.charactersNoSpaces.toLocaleString()} />
        <StatTile label="Words" value={stats.words.toLocaleString()} />
        <StatTile label="Unique words" value={stats.uniqueWords.toLocaleString()} />
        <StatTile label="Sentences" value={stats.sentences.toLocaleString()} />
        <StatTile label="Paragraphs" value={stats.paragraphs.toLocaleString()} />
        <StatTile label="Lines" value={stats.lines.toLocaleString()} />
        <StatTile label="Read time" value={`${stats.readingSeconds}s`} />
        <StatTile label="Speak time" value={`${stats.speakingSeconds}s`} />
      </div>

      <Panel title="Discord limits" icon="info">
        <Rows>
          <Row k="Message characters used" v={`${stats.characters} / 2000`} />
          <Row
            k="Status after this message"
            v={
              stats.characters > 2000
                ? `${stats.characters - 2000} over`
                : `${2000 - stats.characters} left`
            }
          />
          <Row k="Nitro nickname limit" v={`${Math.min(stats.characters, 32)} / 32`} />
        </Rows>
        <Notice>
          Standard messages cap at 2000 characters. Nitro raises that to 4000, and bots can
          send up to 4000 too.
        </Notice>
      </Panel>
    </div>
  );
}

/* ---------------------------- text transforms --------------------------- */

export function TextTransform() {
  const [input, setInput] = useState("discord tools are neat");

  const transforms: Record<string, string> = {
    UPPERCASE: input.toUpperCase(),
    lowercase: input.toLowerCase(),
    "Title Case": input.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase()),
    camelCase: input
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map((word, index) =>
        index === 0
          ? word.toLowerCase()
          : word[0].toUpperCase() + word.slice(1).toLowerCase(),
      )
      .join(""),
    PascalCase: input
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
      .join(""),
    snake_case: input
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .join("_")
      .toLowerCase(),
    kebab_case: input
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .join("-")
      .toLowerCase(),
    CONSTANT_CASE: input
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .join("_")
      .toUpperCase(),
    "dot.case": input
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .join(".")
      .toLowerCase(),
    "Reverse": reverseText(input),
    "Reverse words": input.split(/\s+/).reverse().join(" "),
    "Strip newlines": input.replace(/\n+/g, " "),
    "Double spaces": input.replace(/[^\S\n]/g, "  "),
    "Strip markdown": input.replace(/[*_~`>|]/g, ""),
  };

  return (
    <div className="stack">
      <Panel title="Input" icon="type">
        <TextArea value={input} onChange={setInput} rows={4} />
      </Panel>

      <Panel title="Transform" icon="wand">
        <div className="rows">
          {Object.entries(transforms).map(([label, value]) => (
            <div className="row" key={label}>
              <span className="row__key" style={{ minWidth: 130 }}>
                {label}
              </span>
              <span
                className="row__val"
                style={{ textAlign: "left", fontFamily: "var(--font)", fontSize: 13.5 }}
              >
                {value || <span className="faint">&mdash;</span>}
              </span>
              <CopyButton value={value} iconOnly silent />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* --------------------------- username generator ------------------------- */

const USERNAME_STYLES: { value: UsernameStyle; label: string }[] = [
  { value: "aesthetic", label: "Aesthetic" },
  { value: "minimal", label: "Minimal" },
  { value: "gamer", label: "Gamer tag" },
  { value: "leetspeak", label: "Leetspeak" },
  { value: "twoWord", label: "Two word" },
  { value: "symbolic", label: "Symbolic" },
];

export function UsernameGenerator() {
  const [style, setStyle] = useState<UsernameStyle>("aesthetic");
  const [count, setCount] = useState(12);
  const [results, setResults] = useState<string[]>([]);

  const roll = () => setResults(generateUsernames(style, count));

  return (
    <div className="stack">
      <Panel title="Settings" icon="tool">
        <Field label="Style">
          <Chips
            value={[style]}
            onChange={(value) => setStyle((value[0] ?? "aesthetic") as UsernameStyle)}
            options={USERNAME_STYLES}
          />
        </Field>
        <Slider label="How many" value={count} onChange={setCount} min={1} max={50} />
        <div className="btn-row">
          <button className="btn btn--primary" onClick={roll}>
            <Icon name="refresh" size={15} /> Generate
          </button>
          {results.length > 0 ? (
            <button className="btn" onClick={roll}>
              <Icon name="dice" size={15} /> Shuffle again
            </button>
          ) : null}
        </div>
      </Panel>

      <Panel title={`Results${results.length ? ` (${results.length})` : ""}`} icon="user">
        {results.length === 0 ? (
          <div className="empty-state">Hit generate to roll some names.</div>
        ) : (
          <ResultList items={results} />
        )}
        <Notice>
          A new username needs to be at least two characters and unique across all of
          Discord. Usernames from retired accounts may be unavailable for a while.
        </Notice>
      </Panel>
    </div>
  );
}

/* --------------------------- nickname generator ------------------------- */

export function NicknameGenerator() {
  const [count, setCount] = useState(12);
  const [results, setResults] = useState<string[]>([]);

  return (
    <div className="stack">
      <Panel title="Settings" icon="tool">
        <Slider label="How many" value={count} onChange={setCount} min={1} max={50} />
        <div className="btn-row">
          <button className="btn btn--primary" onClick={() => setResults(generateNicknames(count))}>
            <Icon name="refresh" size={15} /> Generate
          </button>
        </div>
      </Panel>
      <Panel title="Results" icon="user">
        {results.length === 0 ? (
          <div className="empty-state">Nothing generated yet.</div>
        ) : (
          <ResultList items={results} />
        )}
        <Notice>
          Server nicknames are limited to 32 characters and can be anything, unlike
          usernames, which must be lowercase and unique.
        </Notice>
      </Panel>
    </div>
  );
}

/* ------------------------------ bio generator --------------------------- */

export function BioGenerator() {
  const [count, setCount] = useState(6);
  const [results, setResults] = useState<string[]>([]);

  return (
    <div className="stack">
      <Panel title="Settings" icon="tool">
        <Slider label="How many" value={count} onChange={setCount} min={1} max={25} />
        <div className="btn-row">
          <button
            className="btn btn--primary"
            onClick={() => setResults(Array.from({ length: count }, () => generateBio()))}
          >
            <Icon name="refresh" size={15} /> Generate
          </button>
        </div>
      </Panel>
      <Panel title="Bios" icon="user">
        {results.length === 0 ? (
          <div className="empty-state">Hit generate.</div>
        ) : (
          <ResultList items={results} />
        )}
        <Notice>
          Profile "About Me" accepts up to 190 characters. Keep it under that and it will
          display fully on desktop and mobile.
        </Notice>
      </Panel>
    </div>
  );
}

/* ------------------------ server / channel / role names ----------------- */

function NameGenerator({
  title,
  icon,
  roll,
  extra,
  empty,
  note,
}: {
  title: string;
  icon: "users" | "hash" | "shield";
  roll: () => string | string[];
  extra?: React.ReactNode;
  empty: string;
  note: string;
}) {
  const [results, setResults] = useState<string[]>([]);

  const run = () => {
    const value = roll();
    setResults(Array.isArray(value) ? value : [value]);
  };

  return (
    <div className="stack">
      <Panel title="Settings" icon="tool">
        {extra}
        <div className="btn-row">
          <button className="btn btn--primary" onClick={run}>
            <Icon name="refresh" size={15} /> Generate
          </button>
        </div>
      </Panel>
      <Panel title={title} icon={icon}>
        {results.length === 0 ? (
          <div className="empty-state">{empty}</div>
        ) : (
          <ResultList items={results} />
        )}
        <Notice>{note}</Notice>
      </Panel>
    </div>
  );
}

export function ServerNameGenerator() {
  const [count, setCount] = useState(10);
  return (
    <NameGenerator
      title="Server names"
      icon="users"
      extra={<Slider label="How many" value={count} onChange={setCount} min={1} max={30} />}
      roll={() => Array.from({ length: count }, () => generateServerName())}
      empty="Hit generate for server name ideas."
      note="Server names can be up to 100 characters. Names with the word Discord or impersonating other servers can get your server actioned, so avoid those."
    />
  );
}

export function ChannelNameGenerator() {
  const [count, setCount] = useState(8);
  return (
    <NameGenerator
      title="Channel names"
      icon="hash"
      extra={<Slider label="How many" value={count} onChange={setCount} min={1} max={20} />}
      roll={() => generateChannelSet(count)}
      empty="Hit generate for a channel set."
      note="Each result is a coherent set of channel names for one category, which keeps a fresh server tidy."
    />
  );
}

export function RoleNameGenerator() {
  const [count, setCount] = useState(8);
  const [roles, setRoles] = useState<ReturnType<typeof generateRole>[]>([]);

  return (
    <div className="stack">
      <Panel title="Settings" icon="tool">
        <Slider label="How many" value={count} onChange={setCount} min={1} max={30} />
        <div className="btn-row">
          <button
            className="btn btn--primary"
            onClick={() => setRoles(Array.from({ length: count }, generateRole))}
          >
            <Icon name="refresh" size={15} /> Generate roles
          </button>
        </div>
      </Panel>
      <Panel title="Roles" icon="shield">
        {roles.length === 0 ? (
          <div className="empty-state">Hit generate to build a role list with colours.</div>
        ) : (
          <Rows>
            {roles.map((role, index) => (
              <div className="row" key={`${role.name}-${index}`}>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    background: role.color,
                    flexShrink: 0,
                  }}
                />
                <span>{role.name}</span>
                <span className="faint small mono" style={{ marginLeft: 8 }}>
                  {role.color}
                </span>
                <span className="spacer" style={{ flex: 1 }} />
                <CopyButton value={role.name} iconOnly silent />
              </div>
            ))}
          </Rows>
        )}
        <Notice>
          Role colours only apply to names and the member list, not to messages. That is a
          deliberate Discord choice, since message colour is how bots mark embeds.
        </Notice>
      </Panel>
    </div>
  );
}

/* ----------------------------- rules generator -------------------------- */

export function RulesGenerator() {
  const [serverName, setServerName] = useState("Our Server");
  const [selected, setSelected] = useState<string[]>(
    RULE_TEMPLATES.slice(0, 6).map((rule) => rule.id),
  );
  const [tone, setTone] = useState<"friendly" | "strict" | "minimal">("friendly");
  const [numbering, setNumbering] = useState<"numbers" | "bullets">("numbers");

  const result = buildRules(
    RULE_TEMPLATES.filter((rule) => selected.includes(rule.id)),
    { serverName, tone, numbering },
  ).join("\n");

  const chars = result.length;

  return (
    <div className="stack">
      <Panel title="Server" icon="users">
        <Field label="Server name">
          <TextInput value={serverName} onChange={setServerName} placeholder="Our Server" />
        </Field>
        <Field label="Tone">
          <Tabs
            value={tone}
            onChange={setTone}
            options={[
              { value: "friendly", label: "Friendly" },
              { value: "strict", label: "Strict" },
              { value: "minimal", label: "Minimal" },
            ]}
          />
        </Field>
        <Field label="Numbering">
          <Tabs
            value={numbering}
            onChange={setNumbering}
            options={[
              { value: "numbers", label: "1. 2. 3." },
              { value: "bullets", label: "Bullets" },
            ]}
          />
        </Field>
      </Panel>

      <Panel title={`Rules to include (${selected.length})`} icon="shield">
        <div className="stack stack--sm">
          {RULE_TEMPLATES.map((rule) => (
            <Checkbox
              key={rule.id}
              checked={selected.includes(rule.id)}
              onChange={(checked) =>
                setSelected((prev) =>
                  checked ? [...prev, rule.id] : prev.filter((id) => id !== rule.id),
                )
              }
              label={rule.name}
            />
          ))}
        </div>
      </Panel>

      <Panel
        title="Output"
        icon="check"
        action={
          <>
            <CopyButton value={result} label="Copy" />
          </>
        }
      >
        <Output>{result}</Output>
        <div className="row-flex">
          <span className="faint small">{chars} characters</span>
          <span className="faint small">&middot;</span>
          <span className="faint small">
            {chars > 2000 ? "Too long for one message" : "Fits in one message"}
          </span>
        </div>
        <Notice>
          Discord has no native rules feature. The usual setup is a #rules channel plus a
          rules channel or role that everyone must accept.
        </Notice>
      </Panel>
    </div>
  );
}

/* ---------------------------- welcome generator ------------------------- */

export function WelcomeGenerator() {
  const [serverName, setServerName] = useState("Our Server");
  const [userName, setUserName] = useState("there");
  const [memberCount, setMemberCount] = useState(1284);
  const [channelName, setChannelName] = useState("general");
  const [rulesUrl, setRulesUrl] = useState("");
  const [accent, setAccent] = useState("#d4d4d8");
  const [style, setStyle] = useState<"embed" | "plain" | "image">("embed");

  const result = buildWelcome({
    serverName,
    userName,
    memberCount,
    channelName,
    rulesUrl,
    style,
    accent,
  });

  return (
    <div className="stack">
      <Panel title="Details" icon="users">
        <div className="grid-2">
          <Field label="Server name">
            <TextInput value={serverName} onChange={setServerName} />
          </Field>
          <Field label="User name">
            <TextInput value={userName} onChange={setUserName} />
          </Field>
          <Field label="Member count">
            <TextInput
              value={String(memberCount)}
              onChange={(value) => setMemberCount(Number(value.replace(/\D/g, "")) || 0)}
              mono
            />
          </Field>
          <Field label="Welcome channel">
            <TextInput value={channelName} onChange={setChannelName} />
          </Field>
          <Field label="Rules link (optional)">
            <TextInput value={rulesUrl} onChange={setRulesUrl} placeholder="https://discord.gg/..." />
          </Field>
          <Field label="Embed colour">
            <div className="field__row">
              <input
                type="color"
                value={accent}
                onChange={(event) => setAccent(event.target.value)}
                style={{
                  width: 40,
                  height: 36,
                  padding: 2,
                  borderRadius: 6,
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg-elev)",
                }}
              />
              <TextInput value={accent} onChange={setAccent} mono />
            </div>
          </Field>
        </div>
        <Field label="Output style">
          <Tabs
            value={style}
            onChange={setStyle}
            options={[
              { value: "embed", label: "Formatted message" },
              { value: "plain", label: "Plain text" },
              { value: "image", label: "Webhook JSON" },
            ]}
          />
        </Field>
      </Panel>

      <Panel title="Preview" icon="eye">
        {style === "image" ? (
          <div className="preview-frame">
            <div style={{ borderLeft: `4px solid ${accent}`, paddingLeft: 12 }}>
              <div style={{ fontWeight: 600 }}>Welcome to {serverName}</div>
              <div className="muted small" style={{ marginTop: 4 }}>
                Hey {userName}, glad you made it. You are member{" "}
                <b>#{memberCount.toLocaleString("en-US")}</b>.
              </div>
            </div>
          </div>
        ) : (
          <div className="preview-frame" style={{ whiteSpace: "pre-wrap" }}>
            {result.replaceAll("**", "").replace(/<\/?t:[^>]*>/g, "")}
          </div>
        )}
      </Panel>

      <Panel title="Output" icon="check" action={<CopyButton value={result} label="Copy" />}>
        <Output>{result}</Output>
        <Notice>
          Real welcomes usually use a bot. Carl-bot, MEE6 and Sapphire all have welcome
          channels, and this text drops straight into their templates.
        </Notice>
      </Panel>
    </div>
  );
}

/* ---------------------------- custom status ----------------------------- */

export function CustomStatus() {
  const [status, setStatus] = useState("focus mode");

  const withEmoji = (emoji: string, text: string) =>
    text.startsWith(emoji) ? text : `${emoji} ${text}`;

  return (
    <div className="stack">
      <Panel title="Your status" icon="user">
        <Field label="Custom status text" hint="Up to 128 characters.">
          <TextInput value={status} onChange={setStatus} placeholder="focus mode" />
        </Field>
        <Field label="Add an emoji">
          <div className="chip-row">
            {CUSTOM_STATUS_EMOJI.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="chip"
                style={{ fontSize: 16 }}
                onClick={() => setStatus(withEmoji(emoji, status))}
                title={`Use ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </Field>
      </Panel>

      <Panel title="Presets" icon="zap">
        <div className="chip-row">
          {CUSTOM_STATUS_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`chip ${preset === status ? "is-active" : ""}`}
              onClick={() => setStatus(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Output" icon="check" action={<CopyButton value={status} label="Copy" />}>
        <Output>{status}</Output>
        <Notice>
          Custom status requires Nitro. Presence (online, idle, do not disturb) works on
          every account and is set from the status picker, not a text field.
        </Notice>
      </Panel>
    </div>
  );
}