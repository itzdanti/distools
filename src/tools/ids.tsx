import { useCallback, useMemo, useState } from "react";
import {
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
  TextArea,
  TextInput,
  useToast,
} from "../components/ui";
import {
  decodeSnowflake,
  createSnowflake,
  describeAge,
  isSnowflake,
} from "../lib/snowflake";
import { discordFetch, extractId, DiscordApiError } from "../lib/discordApi";
import { BADGES } from "../lib/discordData";

const CDN = "https://cdn.discordapp.com";

export interface DiscordUser {
  id: string;
  username: string;
  discriminator?: string;
  global_name?: string | null;
  display_name?: string | null;
  avatar?: string | null;
  banner?: string | null;
  accent_color?: number | null;
  bot?: boolean;
  system?: boolean;
  public_flags?: number;
  created_at: string;
  banner_color?: string | null;
}

export function avatarUrl(user: DiscordUser, size = 1024): string {
  if (user.avatar) {
    const ext = user.avatar.startsWith("a_") ? "gif" : "png";
    return `${CDN}/avatars/${user.id}/${user.avatar}.${ext}?size=${size}`;
  }
  const index = Number((BigInt(user.id) >> 22n) % 6n);
  return `${CDN}/embed/avatars/${index}.png?size=${size}`;
}

export function bannerUrl(user: DiscordUser, size = 1024): string {
  if (user.banner) {
    const ext = user.banner.startsWith("a_") ? "gif" : "png";
    return `${CDN}/banners/${user.id}/${user.banner}.${ext}?size=${size}`;
  }
  if (user.accent_color) {
    const hex = user.accent_color.toString(16).padStart(6, "0");
    return `${CDN}/banners/${user.id}/00000000000000000000000000000000.png?size=${size}&color=${hex}`;
  }
  return "";
}

export function displayName(user: DiscordUser): string {
  return user.global_name || user.display_name || user.username;
}

function useLookup() {
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (raw: string) => {
    const id = extractId(raw);
    if (!id) {
      setUser(null);
      setError("That does not contain a Discord ID. Paste a user ID or a profile link.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = (await discordFetch(`/users/${id}`)) as DiscordUser;
      setUser(data);
    } catch (caught) {
      setUser(null);
      setError(
        caught instanceof DiscordApiError
          ? caught.message
          : "Could not reach Discord. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, loading, error, lookup };
}

function IdInput({
  value,
  onChange,
  onSubmit,
  loading,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  autoFocus?: boolean;
}) {
  return (
    <>
      <Field label="User ID or profile link" hint="Paste an ID, or a link like discord.com/users/1234. Also accepts a message link.">
        <TextInput
          value={value}
          onChange={onChange}
          mono
          placeholder="81384788765712384"
          autoFocus={autoFocus}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSubmit();
          }}
        />
      </Field>
      <div className="btn-row">
        <button
          className="btn btn--primary"
          onClick={onSubmit}
          disabled={loading || !value.trim()}
        >
          {loading ? (
            <Icon name="refresh" size={15} className="spin" />
          ) : (
            <Icon name="search" size={15} />
          )}
          {loading ? "Looking up" : "Look up"}
        </button>
        <button className="btn" onClick={() => onChange("")} disabled={!value}>
          Clear
        </button>
      </div>
    </>
  );
}

function ErrorNotice({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <Notice variant="danger">
      {error}
      <div style={{ marginTop: 6, opacity: 0.85 }}>
        Discord blocks direct browser requests, so this goes through a public CORS proxy.
        Those can be slow or rate limited, which is the most common cause of a failure
        here.
      </div>
    </Notice>
  );
}

function ImageResults({
  user,
  kind,
}: {
  user: DiscordUser;
  kind: "avatar" | "banner";
}) {
  const url = kind === "avatar" ? avatarUrl(user) : bannerUrl(user);
  const fallback = kind === "banner" && !url;
  const toast = useToast();

  const sizes = [128, 256, 512, 1024, 2048];

  return (
    <>
      <Panel title="Preview" icon="image">
        {fallback ? (
          <Notice>
            This account has no {kind === "banner" ? "banner" : "avatar"} and no accent
            colour, so there is nothing to download.
          </Notice>
        ) : (
          <>
            <div className="img-stage">
              <img
                src={url}
                alt={`${displayName(user)} ${kind}`}
                className="img-preview"
                style={
                  kind === "avatar"
                    ? { width: 200, height: 200, borderRadius: "50%" }
                    : { width: "100%", maxWidth: 520, aspectRatio: "16 / 6" }
                }
                onError={() => toast("Discord's CDN did not return that image", "error")}
              />
            </div>
            <Output>{url}</Output>
          </>
        )}
      </Panel>

      {!fallback ? (
        <Panel
          title="Sizes"
          icon="download"
          action={<CopyButton value={url} label="Copy URL" />}
          hint="Change the size parameter to request a different resolution. Discord serves 128, 256, 512, 1024 and 2048."
        >
          <div className="chip-row">
            {sizes.map((size) => (
              <a
                key={size}
                className="chip"
                href={url.replace(/size=\d+/, `size=${size}`)}
                target="_blank"
                rel="noreferrer noopener"
                download={`${user.id}-${kind}-${size}.png`}
              >
                <Icon name="download" size={13} /> {size}px
              </a>
            ))}
          </div>
        </Panel>
      ) : null}
    </>
  );
}

/* --------------------------- avatar / pfp grab -------------------------- */

export function AvatarGrabber() {
  const [id, setId] = useState("");
  const { user, loading, error, lookup } = useLookup();

  return (
    <div className="stack">
      <Panel title="Lookup" icon="user">
        <IdInput value={id} onChange={setId} onSubmit={() => lookup(id)} loading={loading} />
      </Panel>
      <ErrorNotice error={error} />
      {user ? <ImageResults user={user} kind="avatar" /> : null}
    </div>
  );
}

/* ---------------------------- banner grabber ---------------------------- */

export function BannerGrabber() {
  const [id, setId] = useState("");
  const { user, loading, error, lookup } = useLookup();

  return (
    <div className="stack">
      <Panel title="Lookup" icon="image">
        <IdInput value={id} onChange={setId} onSubmit={() => lookup(id)} loading={loading} />
        <Notice>
          Banners are a Nitro feature. A server or user without one will show an accent
          colour instead, or nothing at all.
        </Notice>
      </Panel>
      <ErrorNotice error={error} />
      {user ? <ImageResults user={user} kind="banner" /> : null}
    </div>
  );
}

/* --------------------------- profile viewer ----------------------------- */

export function ProfileViewer() {
  const [id, setId] = useState("");
  const { user, loading, error, lookup } = useLookup();

  const created = user ? new Date(user.created_at) : null;

  return (
    <div className="stack">
      <Panel title="Lookup" icon="user">
        <IdInput
          value={id}
          onChange={setId}
          onSubmit={() => lookup(id)}
          loading={loading}
          autoFocus
        />
      </Panel>

      <ErrorNotice error={error} />

      {user && created ? (
        <>
          <Panel title="Profile" icon="eye">
            <div style={{ position: "relative" }}>
              {bannerUrl(user) ? (
                <img
                  src={bannerUrl(user)}
                  alt=""
                  style={{
                    width: "100%",
                    aspectRatio: "16 / 6",
                    objectFit: "cover",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                  }}
                />
              ) : (
                <div
                  style={{
                    height: 90,
                    borderRadius: 10,
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                  }}
                />
              )}
              <img
                src={avatarUrl(user, 256)}
                alt=""
                style={{
                  position: "absolute",
                  bottom: -32,
                  left: 18,
                  width: 74,
                  height: 74,
                  borderRadius: "50%",
                  border: "4px solid var(--surface)",
                }}
              />
            </div>

            <div style={{ height: 34 }} />
            <div style={{ fontSize: 19, fontWeight: 620 }}>
              {displayName(user)}
              {user.bot ? <span className="badge" style={{ marginLeft: 8 }}>Bot</span> : null}
              {user.system ? <span className="badge" style={{ marginLeft: 8 }}>System</span> : null}
            </div>
            <div className="faint mono small">
              @{user.username}
              {user.discriminator && user.discriminator !== "0"
                ? `#${user.discriminator}`
                : ""}
            </div>
          </Panel>

          <Panel title="Details" icon="info">
            <Rows>
              <Row k="User ID" v={user.id} copyable />
              <Row k="Created" v={created.toISOString()} copyable />
              <Row k="Account age" v={describeAge(created)} />
              <Row k="Avatar hash" v={user.avatar ?? "default"} copyable={Boolean(user.avatar)} />
              <Row k="Banner hash" v={user.banner ?? "none"} copyable={Boolean(user.banner)} />
              <Row
                k="Accent colour"
                v={
                  user.accent_color
                    ? `#${user.accent_color.toString(16).padStart(6, "0")}`
                    : "none"
                }
                copyable={Boolean(user.accent_color)}
              />
              <Row k="Public flags" v={String(user.public_flags ?? 0)} copyable />
            </Rows>
          </Panel>

          <Panel title="Badges" icon="star">
            <BadgeList user={user} />
          </Panel>

          <Panel title="Links" icon="link">
            <div className="chip-row">
              <a
                className="chip"
                href={avatarUrl(user)}
                target="_blank"
                rel="noreferrer noopener"
              >
                <Icon name="image" size={13} /> Avatar
              </a>
              {bannerUrl(user) ? (
                <a
                  className="chip"
                  href={bannerUrl(user)}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Icon name="image" size={13} /> Banner
                </a>
              ) : null}
              <CopyButton
                value={`https://discord.com/users/${user.id}`}
                label="Copy profile link"
              />
            </div>
          </Panel>
        </>
      ) : null}
    </div>
  );
}

/* ----------------------------- badge checker ---------------------------- */

const FLAG_DEFS: { flag: number; badgeId: string }[] = [
  { flag: 1 << 0, badgeId: "early_supporter" },
  { flag: 1 << 1, badgeId: "early_verified_bot_dev" },
  { flag: 1 << 2, badgeId: "verified_bot_dev" },
  { flag: 1 << 3, badgeId: "certified_moderator" },
  { flag: 1 << 6, badgeId: "bug_hunter_1" },
  { flag: 1 << 7, badgeId: "bug_hunter_2" },
  { flag: 1 << 8, badgeId: "hypesquad_events" },
  { flag: 1 << 9, badgeId: "hypesquad_bravery" },
  { flag: 1 << 10, badgeId: "hypesquad_brilliance" },
  { flag: 1 << 11, badgeId: "hypesquad_balance" },
  { flag: 1 << 14, badgeId: "premium_early_supporter" },
  { flag: 1 << 17, badgeId: "active_developer" },
  { flag: 1 << 19, badgeId: "http_interactions_bot" },
];

function BadgeList({ user }: { user: DiscordUser }) {
  const flags = user.public_flags ?? 0;
  const earned = BADGES.filter((badge) => {
    const def = FLAG_DEFS.find((entry) => entry.badgeId === badge.id);
    return def ? (flags & def.flag) === def.flag : false;
  });

  if (earned.length === 0) {
    return (
      <Notice>
        No public badges. Public flags are {flags}. Most people have none, which is normal.
      </Notice>
    );
  }

  return (
    <div className="stack stack--sm">
      {earned.map((badge) => (
        <div key={badge.id} className="row" style={{ alignItems: "flex-start" }}>
          <Icon name="star" size={15} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 550 }}>{badge.name}</div>
            <div className="faint small">{badge.description}</div>
          </div>
          <span className="badge">{badge.group}</span>
        </div>
      ))}
    </div>
  );
}

export function BadgeChecker() {
  const [id, setId] = useState("");
  const { user, loading, error, lookup } = useLookup();

  return (
    <div className="stack">
      <Panel title="Check an account" icon="star">
        <IdInput value={id} onChange={setId} onSubmit={() => lookup(id)} loading={loading} />
      </Panel>
      <ErrorNotice error={error} />
      {user ? (
        <Panel title={`Badges for ${displayName(user)}`} icon="star">
          <BadgeList user={user} />
        </Panel>
      ) : null}
    </div>
  );
}

export function BadgeLibrary() {
  const groups = Array.from(new Set(BADGES.map((badge) => badge.group)));

  return (
    <div className="stack">
      <Panel title="Every badge Discord has issued" icon="star">
        <div className="stack">
          {groups.map((group) => (
            <div key={group}>
              <div className="section-title" style={{ marginBottom: 8 }}>
                {group}
              </div>
              <Rows>
                {BADGES.filter((badge) => badge.group === group).map((badge) => (
                  <div className="row" key={badge.id} style={{ alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 550 }}>{badge.name}</div>
                      <div className="faint small">{badge.description}</div>
                      <div className="small" style={{ marginTop: 3, color: "var(--text-muted)" }}>
                        {badge.howToGet}
                      </div>
                    </div>
                  </div>
                ))}
              </Rows>
            </div>
          ))}
        </div>
      </Panel>
      <Notice>
        Badges are purely decorative. They have no effect on permissions, and most are
        permanently unobtainable.
      </Notice>
    </div>
  );
}

/* ---------------------------- account age check ------------------------- */

export function AccountAge() {
  const [id, setId] = useState("");
  const [lookedUpAt] = useState(() => Date.now());
  const { user, loading, error, lookup } = useLookup();
  const created = user ? new Date(user.created_at) : null;

  return (
    <div className="stack">
      <Panel title="Lookup" icon="clock">
        <IdInput value={id} onChange={setId} onSubmit={() => lookup(id)} loading={loading} />
      </Panel>
      <ErrorNotice error={error} />

      {user && created ? (
        <>
          <div className="grid-3">
            <StatTile label="Account age" value={describeAge(created)} />
            <StatTile
              label="Days old"
              value={Math.max(
                0,
                Math.floor((lookedUpAt - created.getTime()) / 86_400_000),
              ).toLocaleString()}
            />
            <StatTile
              label="Under 18?"
              value={
                created.getTime() > lookedUpAt - 18 * 365.25 * 86_400_000 ? "Likely" : "Unlikely"
              }
            />
          </div>

          <Panel title="Created" icon="info">
            <Rows>
              <Row k="Username" v={`${displayName(user)} (@${user.username})`} />
              <Row k="UTC" v={created.toUTCString()} copyable />
              <Row k="ISO" v={created.toISOString()} copyable />
              <Row k="Your local time" v={created.toLocaleString()} />
              <Row k="Snowflake check" v={isSnowflake(user.id) ? "valid ID" : "unexpected"} />
              <Row k="ID timestamp" v={decodeSnowflake(user.id).date.toISOString()} />
            </Rows>
            <Notice variant="warn">
              This only tells you when the account was registered. It says nothing about the
              person behind it, and is not a way to verify age. Do not use it to make
              decisions about who someone is.
            </Notice>
          </Panel>
        </>
      ) : null}
    </div>
  );
}

/* --------------------------- snowflake converter ------------------------ */

export function SnowflakeTool() {
  const [mode, setMode] = useState<"decode" | "encode">("decode");
  const [id, setId] = useState("");
  const [encodeDate, setEncodeDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [error, setError] = useState<string | null>(null);

  let decoded: ReturnType<typeof decodeSnowflake> | null = null;
  if (mode === "decode" && id.trim()) {
    try {
      decoded = decodeSnowflake(id);
      setError(null);
    } catch (caught) {
      decoded = null;
      setError(caught instanceof Error ? caught.message : "Could not decode that.");
    }
  }

  let encoded = "";
  if (mode === "encode") {
    try {
      encoded = createSnowflake(new Date(encodeDate));
      setError(null);
    } catch (caught) {
      encoded = "";
      setError(caught instanceof Error ? caught.message : "Could not encode that.");
    }
  }

  return (
    <div className="stack">
      <Panel title="Mode" icon="hash">
        <div className="tabs">
          {(["decode", "encode"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={`tab ${mode === value ? "is-active" : ""}`}
              onClick={() => {
                setMode(value);
                setError(null);
              }}
            >
              {value === "decode" ? "ID to date" : "Date to ID"}
            </button>
          ))}
        </div>
      </Panel>

      {mode === "decode" ? (
        <Panel title="Snowflake" icon="hash" hint="Paste a user, message, channel, role or server ID.">
          <TextInput
            value={id}
            onChange={setId}
            mono
            placeholder="81384788765712384"
            autoFocus
          />
        </Panel>
      ) : (
        <Panel title="Timestamp" icon="clock">
          <input
            type="datetime-local"
            className="input"
            value={encodeDate}
            onChange={(event) => setEncodeDate(event.target.value)}
          />
          <Notice>
            Building a snowflake by hand produces a syntactically valid ID that points at
            nothing. It is useful for testing parsers and sorting, not for faking real
            accounts.
          </Notice>
        </Panel>
      )}

      {error ? <Notice variant="danger">{error}</Notice> : null}

      {mode === "decode" && decoded ? (
        <>
          <Panel title="Decoded" icon="clock">
            <Rows>
              <Row k="ID" v={decoded.id} copyable />
              <Row k="Created (UTC)" v={decoded.date.toUTCString()} copyable />
              <Row k="ISO 8601" v={decoded.date.toISOString()} copyable />
              <Row k="Unix seconds" v={String(Math.floor(decoded.timestamp / 1000))} copyable />
              <Row k="Relative" v={describeAge(decoded.date)} />
            </Rows>
          </Panel>

          <Panel title="Binary fields" icon="code">
            <p className="muted small">
              A snowflake packs several values into one 64-bit integer. These are the raw
              fields, useful if you are writing a parser.
            </p>
            <Rows>
              <Row k="Worker / process ID" v={decoded.workerId} />
              <Row k="Internal process ID" v={decoded.processId} />
              <Row k="Increment" v={decoded.increment} />
              <Row k="Binary" v={BigInt(decoded.id).toString(2)} />
            </Rows>
          </Panel>

          <Panel
            title="Message link for this ID"
            icon="link"
            hint="A jump link. Discord requires the channel ID, so fill that in."
            action={
              <CopyButton
                value={() => `https://discord.com/channels/@me/${decoded.id}`}
                label="Copy jump link"
              />
            }
          >
            <Output>{`https://discord.com/channels/@me/${decoded.id}`}</Output>
          </Panel>
        </>
      ) : null}

      {mode === "encode" && encoded ? (
        <Panel title="Generated snowflake" icon="hash" action={<CopyButton value={encoded} label="Copy" />}>
          <Output>{encoded}</Output>
          <Rows>
            <Row k="Worker / process ID" v="1" />
            <Row k="Internal process ID" v="0" />
            <Row k="Increment" v="0" />
            <Row k="Meaningful?" v="no, nothing points here" />
          </Rows>
        </Panel>
      ) : null}
    </div>
  );
}

/* ---------------------------- message links ----------------------------- */

export function MessageLink() {
  const [channel, setChannel] = useState("");
  const [message, setMessage] = useState("");

  const channelId = extractId(channel) ?? "";
  const messageId = extractId(message) ?? "";

  const link = channelId
    ? `https://discord.com/channels/${channelId}/${messageId || "MESSAGE_ID"}`
    : "";

  return (
    <div className="stack">
      <Panel title="Message link" icon="link">
        <Field label="Channel ID" hint="Or paste a channel link and the ID is pulled out.">
          <TextInput value={channel} onChange={setChannel} mono placeholder="123456789012345678" />
        </Field>
        <Field label="Message ID" hint="Turn on developer mode to copy these from Discord.">
          <TextInput value={message} onChange={setMessage} mono placeholder="123456789012345678" />
        </Field>
      </Panel>

      {channelId ? (
        <Panel title="Result" icon="check" action={<CopyButton value={link} label="Copy" />}>
          <Output>{link}</Output>
          {!messageId ? (
            <Notice variant="warn">
              A channel ID alone gives you a channel link. Add a message ID to jump straight
              to a specific message.
            </Notice>
          ) : (
            <Notice>
              Direct links only work for channels you are already in. For a DM, use the
              format <span className="mono">/channels/@me/{messageId}</span> instead.
            </Notice>
          )}
        </Panel>
      ) : null}

      <Panel title="How to get IDs" icon="info">
        <div className="stack stack--sm">
          <p className="muted small">
            <b>Turn on Developer Mode.</b> User Settings, then Advanced, then Developer Mode.
          </p>
          <p className="muted small">
            <b>User ID.</b> Right click a profile, or yourself in the member list, then Copy
            User ID.
          </p>
          <p className="muted small">
            <b>Message ID.</b> Enable developer mode, then click the timestamp under a
            message and choose Copy ID. Enable Copy Link to get the whole link at once.
          </p>
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------ ID finder ------------------------------- */

export function IdFinder() {
  const [raw, setRaw] = useState("");
  const found = extractId(raw);

  const classified = useMemo(() => {
    if (!found) return null;
    const match = raw.match(/discord(?:app)?\.com\/([a-z]+)/i)?.[1];
    return match ? match : "unknown (looks like a snowflake)";
  }, [found, raw]);

  return (
    <div className="stack">
      <Panel
        title="Paste anything"
        icon="search"
        hint="A user link, message link, invite, or a bare ID surrounded by other text."
      >
        <TextArea
          value={raw}
          onChange={setRaw}
          rows={4}
          mono
          placeholder="https://discord.com/channels/81384788765712384/920000000000000000"
          autoFocus
        />
      </Panel>

      {found ? (
        <Panel title="Found" icon="check" action={<CopyButton value={found} label="Copy ID" />}>
          <Rows>
            <Row k="ID" v={found} copyable />
            <Row k="Looks like" v={classified} />
            <Row k="Valid snowflake" v={isSnowflake(found) ? "yes" : "no"} />
          </Rows>
          {isSnowflake(found) ? (
            <Rows>
              <Row k="Created" v={decodeSnowflake(found).date.toUTCString()} copyable />
              <Row k="Age" v={describeAge(decodeSnowflake(found).date)} />
            </Rows>
          ) : null}
        </Panel>
      ) : raw.trim() ? (
        <Notice variant="warn">
          No snowflake found in that text. A Discord ID is 17 to 20 digits, all numeric.
        </Notice>
      ) : null}
    </div>
  );
}

/* ---------------------------- mock ID builder --------------------------- */

export function MockIdTool() {
  const [count, setCount] = useState(5);
  const [kind, setKind] = useState<"user" | "message" | "role">("user");
  const [values, setValues] = useState<string[]>([]);

  const label =
    kind === "user"
      ? "Fake user IDs are perfect for seeding a dev database or testing a bot that renders mentions."
      : kind === "message"
        ? "Fake message IDs let you test message-link routing without touching a real server."
        : "Fake role IDs are useful for permission logic tests and embed previews.";

  const roll = () =>
    setValues(
      Array.from({ length: count }, () =>
        createSnowflake(new Date(Date.now() + Math.random() * 86_400_000)),
      ),
    );

  return (
    <div className="stack">
      <Panel
        title="Generate"
        icon="dice"
        action={
          <button className="btn btn--sm" onClick={roll}>
            <Icon name="refresh" size={13} /> Roll
          </button>
        }
      >
        <div className="chip-row">
          {(["user", "message", "role"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={`chip ${kind === value ? "is-active" : ""}`}
              onClick={() => setKind(value)}
            >
              {value} IDs
            </button>
          ))}
        </div>
        <Slider label="How many" value={count} onChange={setCount} min={1} max={50} />
        <Notice>{label}</Notice>
      </Panel>

      <Panel title="IDs" icon="hash">
        {values.length === 0 ? (
          <div className="empty-state">Hit Roll.</div>
        ) : (
          <Rows>
            {values.map((value, index) => (
              <Row key={value} k={`#${index + 1}`} v={value} copyable />
            ))}
          </Rows>
        )}
        <Notice variant="warn">
          These are structurally valid snowflakes from the current moment. They do not
          resolve to any real account, and cannot be made to.
        </Notice>
      </Panel>
    </div>
  );
}