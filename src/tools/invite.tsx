import { useCallback, useState } from "react";
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
  Tabs,
  TextInput,
  useToast,
} from "../components/ui";
import { copyText } from "../lib/clipboard";
import { discordFetch, extractCode, DiscordApiError } from "../lib/discordApi";
import { describeAge } from "../lib/snowflake";

const CDN = "https://cdn.discordapp.com";

interface InviteResponse {
  type: number;
  code: string;
  guild?: {
    id: string;
    name: string;
    icon?: string | null;
    splash?: string | null;
    banner?: string | null;
    description?: string | null;
    features?: string[];
    verification_level: number;
    member_count?: number;
    premium_subscription_count?: number | null;
    nsfw_level: number;
    roles?: { id: string; name: string; color: number; permissions: string; position: number }[];
    channels?: { id: string; name: string; type: number }[];
  };
  approximate_member_count?: number;
  approximate_presence_count?: number;
  expires_at?: string | null;
  max_age?: number;
  target_user?: { username: string; discriminator: string; avatar?: string | null; id: string };
  target_user_id?: string;
}

interface GuildResponse {
  id: string;
  name: string;
  icon?: string | null;
  splash?: string | null;
  banner?: string | null;
  description?: string | null;
  owner?: boolean;
  features?: string[];
  member_count?: number;
  verification_level?: number;
  premium_tier?: number;
  roles?: { id: string; name: string; color: number; permissions: string; position: number }[];
}

function useFetch<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      setData((await discordFetch(path)) as T);
    } catch (caught) {
      setError(
        caught instanceof DiscordApiError
          ? caught.message
          : "Could not reach Discord. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, run };
}

const FEATURE_LABELS: Record<string, string> = {
  ANIMATED_ICON: "Animated icon",
  BANNER: "Server banner",
  COMMERCE: "Commerce (perks store)",
  COMMUNITY: "Community server",
  DEVELOPER_PORTAL_GUILD: "Early bot access",
  DISCOVERABLE: "Discoverable",
  FEATURED: "Featured",
  INVITE_SPLASH: "Invite splash",
  MEMBER_VERIFICATION_GATE: "Membership screening",
  MORE_EMOJI: "More emoji",
  MORE_STICKERS: "More stickers",
  NEWS: "News channels",
  PARTNERED: "Partnered",
  PREVIEW_ENABLED: "Preview enabled",
  PRIVATE_THREADS: "Private threads",
  ROLE_ICONS: "Role icons",
  VANITY_URL: "Vanity URL",
  VERIFIED: "Verified",
  VIP_REGIONS: "VIP regions",
  WELCOME_SCREEN_ENABLED: "Welcome screen",
};

const VERIFICATION_LABELS = ["None", "Low", "Medium", "High", "Highest"];

const INVITE_TYPE_LABELS: Record<number, string> = {
  0: "Server invite",
  1: "Group DM",
};

function GuildIcon({ guild, size = 96 }: { guild: GuildResponse; size?: number }) {
  if (!guild.icon) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: "1px solid var(--border-strong)",
          background: "var(--surface-2)",
          display: "grid",
          placeItems: "center",
          color: "var(--text-faint)",
        }}
      >
        <Icon name="users" size={size / 3} />
      </div>
    );
  }
  const ext = guild.icon.startsWith("a_") ? "gif" : "png";
  return (
    <img
      src={`${CDN}/icons/${guild.id}/${guild.icon}.${ext}?size=256`}
      alt={`${guild.name} icon`}
      width={size}
      height={size}
      style={{ borderRadius: "50%", border: "1px solid var(--border-strong)" }}
    />
  );
}

function GuildBanner({ guild }: { guild: GuildResponse }) {
  const hash = guild.banner ?? guild.splash ?? null;
  if (!hash) return null;
  const field = guild.banner ? "banners" : "splashes";
  const ext = hash.startsWith("a_") ? "gif" : "png";
  return (
    <img
      src={`${CDN}/${field}/${guild.id}/${hash}.${ext}?size=1024`}
      alt={`${guild.name} banner`}
      style={{
        width: "100%",
        aspectRatio: guild.banner ? "16 / 6" : "16 / 5",
        objectFit: "cover",
        borderRadius: 10,
        border: "1px solid var(--border)",
      }}
    />
  );
}

function InviteForm({
  label,
  hint,
  placeholder,
  onSubmit,
  loading,
  value,
  onChange,
  children,
}: {
  label: string;
  hint?: string;
  placeholder: string;
  onSubmit: () => void;
  loading: boolean;
  value: string;
  onChange: (value: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <Panel title={label} icon="link" hint={hint}>
      <TextInput
        value={value}
        onChange={onChange}
        mono
        placeholder={placeholder}
        autoFocus
        onKeyDown={(event) => {
          if (event.key === "Enter") onSubmit();
        }}
      />
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
          {loading ? "Fetching" : "Fetch"}
        </button>
        <button className="btn" onClick={() => onChange("")} disabled={!value}>
          Clear
        </button>
      </div>
      {children}
    </Panel>
  );
}

function NetworkNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <Notice variant="danger">
      {error}
      <div style={{ marginTop: 6, opacity: 0.85 }}>
        Invite lookups go through a public CORS proxy because Discord does not allow
        browser requests. Proxies can be slow, rate limited, or occasionally offline.
      </div>
    </Notice>
  );
}

/* ---------------------------- invite info ------------------------------- */

export function InviteInfo() {
  const [code, setCode] = useState("");
  const { data, loading, error, run } = useFetch<InviteResponse>();

  return (
    <div className="stack">
      <InviteForm
        label="Invite code or link"
        hint="Paste discord.gg/xxxxx, or the full URL. It does not need to be a live invite."
        placeholder="discord.gg/aki"
        value={code}
        onChange={setCode}
        loading={loading}
        onSubmit={() => run(`/invites/${encodeURIComponent(extractCode(code))}?with_counts=true&with_expiration=true`)}
      />

      <NetworkNote error={error} />

      {data ? (
        <>
          <Panel title="Invite" icon="info">
            <Rows>
              <Row k="Code" v={data.code} copyable />
              <Row k="Type" v={INVITE_TYPE_LABELS[data.type] ?? `Other (type ${data.type})`} />
              <Row
                k="Members"
                v={
                  data.approximate_member_count !== undefined
                    ? data.approximate_member_count.toLocaleString("en-US")
                    : "not public"
                }
              />
              <Row
                k="Online"
                v={
                  data.approximate_presence_count !== undefined
                    ? data.approximate_presence_count.toLocaleString("en-US")
                    : "not public"
                }
              />
              <Row k="Link" v={`https://discord.gg/${data.code}`} copyable />
              {data.expires_at ? (
                <Row
                  k="Expires"
                  v={`${new Date(data.expires_at).toUTCString()} (${describeAge(new Date(data.expires_at))})`}
                />
              ) : null}
            </Rows>
          </Panel>

          {data.target_user ? (
            <Notice variant="warn">
              This is a friend request invite, not a server invite. It points at{" "}
              <b>{data.target_user.username}</b> and does not belong to a server.
            </Notice>
          ) : null}

          {data.approximate_member_count !== undefined ? (
            <Notice>
              Counts are approximate and come from Discord's cached invite metadata. For a
              server with member approval turned on, the invite shows roughly what it
              claims to be rather than the live number.
            </Notice>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/* ------------------------- icon and banner grab -------------------------- */

export function InviteImages() {
  const [code, setCode] = useState("");
  const [tab, setTab] = useState<"icon" | "banner" | "both">("both");
  const { data, loading, error, run } = useFetch<InviteResponse>();
  const guild = data?.guild;
  const toast = useToast();

  const iconHash = guild?.icon ?? null;
  const bannerHash = guild?.banner ?? guild?.splash ?? null;
  const iconExt = iconHash?.startsWith("a_") ? "gif" : "png";
  const bannerExt = bannerHash?.startsWith("a_") ? "gif" : "png";

  const iconUrl = guild && iconHash
    ? `${CDN}/icons/${guild.id}/${iconHash}.${iconExt}?size=1024`
    : "";
  const bannerUrl = guild && bannerHash
    ? `${CDN}/${guild?.banner ? "banners" : "splashes"}/${guild.id}/${bannerHash}.${bannerExt}?size=1024`
    : "";

  const show = (kind: "icon" | "banner") => tab === kind || tab === "both";

  return (
    <div className="stack">
      <InviteForm
        label="Invite code or link"
        hint="Fetches the server icon and banner from an invite, without joining."
        placeholder="discord.gg/aki"
        value={code}
        onChange={setCode}
        loading={loading}
        onSubmit={() => run(`/invites/${encodeURIComponent(extractCode(code))}`)}
      />

      <NetworkNote error={error} />

      {guild ? (
        <>
          <Panel title="Server" icon="users">
            <div className="row-flex" style={{ gap: 14, alignItems: "flex-start" }}>
              <GuildIcon guild={guild} size={72} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 17 }}>{guild.name}</div>
                <div className="faint mono small">{guild.id}</div>
                {guild.description ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    {guild.description}
                  </p>
                ) : null}
              </div>
            </div>
          </Panel>

          <Tabs
            value={tab}
            onChange={setTab}
            options={[
              { value: "both", label: "Both" },
              { value: "icon", label: "Icon" },
              { value: "banner", label: "Banner" },
            ]}
          />

          {show("icon") ? (
            <Panel
              title="Server icon"
              icon="image"
              action={iconUrl ? <CopyButton value={iconUrl} label="Copy URL" /> : null}
            >
              {iconUrl ? (
                <>
                  <div className="img-stage">
                    <img
                      src={iconUrl}
                      alt={`${guild.name} icon`}
                      className="img-preview"
                      style={{ width: 220, height: 220, borderRadius: "50%" }}
                      onError={() => toast("Could not load that icon", "error")}
                    />
                  </div>
                  <Output>{iconUrl}</Output>
                  <div className="chip-row">
                    {[128, 256, 512, 1024].map((size) => (
                      <a
                        key={size}
                        className="chip"
                        href={iconUrl.replace(/size=\d+/, `size=${size}`)}
                        target="_blank"
                        rel="noreferrer noopener"
                        download={`${guild.id}-icon-${size}.png`}
                      >
                        <Icon name="download" size={13} /> {size}px
                      </a>
                    ))}
                  </div>
                </>
              ) : (
                <Notice>
                  This server has no custom icon, so Discord is serving a default letter
                  avatar. There is no file to grab.
                </Notice>
              )}
            </Panel>
          ) : null}

          {show("banner") ? (
            <Panel
              title={guild.banner ? "Server banner" : "Invite splash"}
              icon="image"
              action={bannerUrl ? <CopyButton value={bannerUrl} label="Copy URL" /> : null}
            >
              {bannerUrl ? (
                <>
                  <div className="img-stage">
                    <img
                      src={bannerUrl}
                      alt={`${guild.name} banner`}
                      className="img-preview"
                      style={{ width: "100%" }}
                      onError={() => toast("Could not load that banner", "error")}
                    />
                  </div>
                  <Output>{bannerUrl}</Output>
                  <Notice>
                    {guild.banner
                      ? "Server banners require a Boost level 2 or higher."
                      : "This is the invite splash, not a full banner. It only appears on invite links."}
                  </Notice>
                </>
              ) : (
                <Notice>
                  No banner and no invite splash on this server, so there is nothing to
                  download.
                </Notice>
              )}
            </Panel>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/* ----------------------------- server lookup ---------------------------- */

export function ServerLookup() {
  const [id, setId] = useState("");
  const { data, loading, error, run } = useFetch<GuildResponse>();
  const [viaInvite, setViaInvite] = useState(false);

  const roles = [...(data?.roles ?? [])].sort((a, b) => b.position - a.position);

  return (
    <div className="stack">
      <InviteForm
        label="Server ID or invite"
        hint="Developer mode, right click the server name, then Copy Server ID. An invite link works too."
        placeholder="81384788765712384 or discord.gg/aki"
        value={id}
        onChange={setId}
        loading={loading}
        onSubmit={() => {
          const trimmed = id.trim();
          if (!trimmed) return;

          // Discord now answers 401 on /guilds/{id} without a bot token, but the invite
          // route is still open and returns the same guild object. Try the invite first
          // when the input looks like one.
          if (/discord\.gg\//i.test(trimmed)) {
            setViaInvite(true);
            run(`/invites/${encodeURIComponent(extractCode(trimmed))}?with_counts=true`);
            return;
          }

          const match = trimmed.match(/(\d{17,20})/);
          setViaInvite(false);
          if (match) run(`/guilds/${match[1]}?with_counts=true`);
        }}
      />

      <NetworkNote error={error} />

      {viaInvite && data ? (
        <Notice variant="ok">
          Read through the invite, which is the only unauthenticated route left for this. The
          server ID route needs a bot token, and this project does not have one.
        </Notice>
      ) : null}

      {data ? (
        <>
          <Panel title="Server" icon="users">
            <GuildBanner guild={data} />
            <div className="row-flex" style={{ gap: 14, alignItems: "flex-start" }}>
              <GuildIcon guild={data} size={72} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 17 }}>{data.name}</div>
                <div className="faint mono small">{data.id}</div>
                {data.description ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    {data.description}
                  </p>
                ) : null}
              </div>
            </div>
          </Panel>

          <Panel title="Details" icon="info">
            <Rows>
              <Row k="Server ID" v={data.id} copyable />
              <Row
                k="Members"
                v={
                  data.member_count !== undefined
                    ? `${data.member_count.toLocaleString("en-US")} approximate`
                    : "not public"
                }
              />
              <Row
                k="Verification level"
                v={VERIFICATION_LABELS[data.verification_level ?? 0] ?? "unknown"}
              />
              <Row
                k="Features"
                v={data.features?.length ? `${data.features.length} active` : "none"}
              />
            </Rows>
            {data.features?.length ? (
              <div className="chip-row">
                {data.features.map((feature) => (
                  <span className="chip chip--static" key={feature}>
                    {FEATURE_LABELS[feature] ?? feature}
                  </span>
                ))}
              </div>
            ) : null}
          </Panel>

          {roles.length > 0 ? (
            <Panel title={`Roles (${roles.length})`} icon="shield">
              <Rows>
                {roles.slice(0, 40).map((role) => (
                  <div className="row" key={role.id}>
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 999,
                        background: role.color ? `#${role.color.toString(16).padStart(6, "0")}` : "#4a4a55",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {role.name}
                    </span>
                    <span className="faint small mono">{role.id}</span>
                    <CopyButton value={role.id} iconOnly silent />
                  </div>
                ))}
              </Rows>
              {roles.length > 40 ? (
                <p className="faint small">Showing the top 40 of {roles.length} roles.</p>
              ) : null}
            </Panel>
          ) : null}

          <Notice>
            Unauthenticated requests only see public metadata. Channel lists, member counts
            and owner details need a bot token in the server, which this tool deliberately
            does not accept.
          </Notice>
        </>
      ) : null}

      {id.trim() && !/(\d{17,20})/.test(id) && !/discord\.gg\//i.test(id) ? (
        <Notice variant="warn">
          That does not contain a server ID or an invite link.
        </Notice>
      ) : null}
    </div>
  );
}

/* ---------------------------- invite builder ---------------------------- */

const INVITE_KWARGS = [
  { key: "max_age", label: "max_age", def: 86400, type: "number", note: "Seconds before the invite expires. 0 means never." },
  { key: "max_uses", label: "max_uses", def: 1, type: "number", note: "Times it can be used. 0 means unlimited." },
  { key: "temporary", label: "temporary", def: false, type: "boolean", note: "Members are banned if they leave within 24 hours." },
  { key: "unique", label: "unique", def: true, type: "boolean", note: "Force Discord to generate a new code, ignoring an existing one." },
  { key: "target_type", label: "target_type", def: "STREAM", type: "select", options: ["STREAM", "EMBEDDED_APPLICATION"], note: "Where the invite is used." },
  { key: "target_application_id", label: "target_application_id", def: "", type: "text", note: "Application to open, for embedded invites." },
  { key: "target_user_id", label: "target_user_id", def: "", type: "text", note: "Only the bot itself may set this." },
];

type ArgValue = string | number | boolean;

export function InviteBuilder() {
  const [channelId, setChannelId] = useState("");
  const [values, setValues] = useState<Record<string, ArgValue>>(
    Object.fromEntries(INVITE_KWARGS.map((arg) => [arg.key, arg.def])),
  );
  const toast = useToast();

  const clean = channelId.match(/(\d{17,20})/)?.[1] ?? "";

  const url = clean
    ? (() => {
        const params = new URLSearchParams();
        for (const arg of INVITE_KWARGS) {
          const value = values[arg.key];
          if (value === "" || value === undefined) continue;
          params.set(arg.key, String(value));
        }
        const query = params.toString();
        return `https://discord.com/api/v10/channels/${clean}/invites${query ? `?${query}` : ""}`;
      })()
    : "";

  const curl = url
    ? `curl -X POST "${url}" -H "Authorization: Bot YOUR_BOT_TOKEN"`
    : "";

  const copyCommand = async () => {
    const ok = await copyText(curl);
    toast(ok ? "cURL command copied" : "Copy failed", ok ? "ok" : "error");
  };

  return (
    <div className="stack">
      <Panel
        title="Channel ID"
        icon="hash"
        hint="Invites are created per channel. Any channel the bot can view will do."
      >
        <TextInput
          value={channelId}
          onChange={setChannelId}
          mono
          placeholder="123456789012345678"
          autoFocus
        />
      </Panel>

      <Panel title="Query parameters" icon="tool">
        <div className="stack stack--sm">
          {INVITE_KWARGS.map((arg) => (
            <Field key={arg.key} label={<span className="mono">{arg.label}</span>} hint={arg.note}>
              {arg.type === "boolean" ? (
                <Checkbox
                  checked={Boolean(values[arg.key])}
                  onChange={(checked) =>
                    setValues((prev) => ({ ...prev, [arg.key]: checked }))
                  }
                  label={values[arg.key] ? "true" : "false"}
                />
              ) : arg.type === "select" ? (
                <select
                  className="select"
                  value={String(values[arg.key])}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, [arg.key]: event.target.value }))
                  }
                >
                  {arg.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : arg.type === "number" ? (
                <TextInput
                  value={String(values[arg.key])}
                  mono
                  onChange={(value) => {
                    const parsed = Number(value.replace(/[^\d]/g, ""));
                    setValues((prev) => ({ ...prev, [arg.key]: Number.isFinite(parsed) ? parsed : 0 }));
                  }}
                />
              ) : (
                <TextInput
                  value={String(values[arg.key])}
                  mono
                  onChange={(value) => setValues((prev) => ({ ...prev, [arg.key]: value }))}
                  placeholder="optional"
                />
              )}
            </Field>
          ))}
        </div>
      </Panel>

      <Panel
        title="Request"
        icon="code"
        action={<CopyButton value={() => url} label="Copy URL" />}
      >
        <Output>{url || "Enter a channel ID to build the request."}</Output>
      </Panel>

      <Panel title="cURL" icon="code" action={<CopyButton value={() => curl} label="Copy" />}>
        <Output>{curl || "Enter a channel ID."}</Output>
        <Notice variant="warn">
          Creating an invite needs a bot token with the Manage Channel permission. Keep tokens
          out of anything you paste into a browser, and never commit one to a repo.
        </Notice>
        <button className="btn" onClick={copyCommand}>
          <Icon name="copy" size={15} /> Copy cURL command
        </button>
      </Panel>

      <Panel title="Plain invite links" icon="link">
        <Rows>
          <Row k="Permanent" v={`https://discord.gg/CODE`} copyable />
          <Row k="24 hour" v={`https://discord.gg/CODE?expiry=86400`} copyable />
          <Row k="7 days" v={`https://discord.gg/CODE?expiry=604800`} copyable />
        </Rows>
        <Notice>
          The <span className="mono">expiry</span> parameter works on vanity invites too,
          which is handy for a temporary promo link without touching the real one.
        </Notice>
      </Panel>
    </div>
  );
}