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
  TextArea,
  TextInput,
  useToast,
} from "../components/ui";
import { copyText, downloadText } from "../lib/clipboard";
import { discordDirect, DiscordApiError } from "../lib/discordApi";
import { extractWebhook } from "../lib/core/discord";
import {
  PERMISSIONS,
  PERMISSION_CATEGORIES,
  permissionToBinary,
  permissionToDecimal,
  permissionToHex,
} from "../lib/discordData";
import {
  bitsFromNames,
  parseInteger,
  summarize,
  unknownBitPositions,
} from "../lib/core/permissions";
import { buildWebhookPayload, EMBED_LIMITS } from "../lib/core/embed";
import { hexToRgb, randomHex, rgbToHex } from "../lib/color";
import { RPC_PRESETS } from "../lib/rpc";

/* ============================== embed builder ============================= */

interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

interface EmbedAuthor {
  name: string;
  url: string;
  iconUrl: string;
}

interface EmbedData {
  title: string;
  url: string;
  description: string;
  color: string;
  author: EmbedAuthor;
  fields: EmbedField[];
  footer: { text: string; iconUrl: string };
  imageUrl: string;
  thumbnailUrl: string;
  timestamp: string;
  username: string;
  avatarUrl: string;
  includeContent: boolean;
}

const EMPTY: EmbedData = {
  title: "",
  url: "",
  description: "",
  color: "#d4d4d8",
  author: { name: "", url: "", iconUrl: "" },
  fields: [{ name: "", value: "", inline: true }],
  footer: { text: "", iconUrl: "" },
  imageUrl: "",
  thumbnailUrl: "",
  timestamp: "",
  username: "",
  avatarUrl: "",
  includeContent: false,
};

function EmbedPreview({ data }: { data: EmbedData }) {
  const accent = /^#[0-9a-f]{6}$/i.test(data.color) ? data.color : "#4a4a55";
  const shown = data.fields.filter((field) => field.name.trim() || field.value.trim());
  const inlineGroups: EmbedField[][] = [];

  for (const field of shown) {
    const last = inlineGroups[inlineGroups.length - 1];
    if (field.inline && last && last.length < 3) last.push(field);
    else inlineGroups.push([field]);
  }

  return (
    <div
      style={{
        borderRadius: 8,
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        overflow: "hidden",
        maxWidth: 460,
      }}
    >
      <div style={{ borderLeft: `4px solid ${accent}`, padding: "12px 16px" }}>
        {data.author.name || data.author.iconUrl ? (
          <div className="row-flex" style={{ gap: 8, marginBottom: 8 }}>
            {data.author.iconUrl ? (
              <img
                src={data.author.iconUrl}
                alt=""
                style={{ width: 22, height: 22, borderRadius: "50%" }}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : null}
            <span style={{ fontWeight: 600, fontSize: 13.5 }}>
              {data.author.url ? <a href={data.author.url}>{data.author.name}</a> : data.author.name}
            </span>
          </div>
        ) : null}

        {data.title ? (
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
            {data.url ? <a href={data.url}>{data.title}</a> : data.title}
          </div>
        ) : null}

        {data.description ? (
          <p style={{ fontSize: 13.5, whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>
            {data.description}
          </p>
        ) : null}

        {inlineGroups.map((group, groupIndex) => (
          <div key={groupIndex} style={{ display: "flex", gap: 12, marginTop: 10 }}>
            {group.map((field, fieldIndex) => (
              <div key={fieldIndex} style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 12.5 }}>{field.name || "Empty name"}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>
                  {field.value || "Empty value"}
                </div>
              </div>
            ))}
          </div>
        ))}

        {data.imageUrl ? (
          <img
            src={data.imageUrl}
            alt=""
            style={{ marginTop: 12, maxWidth: "100%", borderRadius: 6 }}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : null}

        {data.footer.text || data.thumbnailUrl ? (
          <div className="row-flex" style={{ gap: 8, marginTop: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {data.footer.text ? (
                <div className="faint" style={{ fontSize: 12 }}>
                  {data.footer.text}
                </div>
              ) : null}
            </div>
            {data.thumbnailUrl ? (
              <img
                src={data.thumbnailUrl}
                alt=""
                style={{ width: 48, height: 48, borderRadius: 6 }}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      {data.timestamp || data.footer.text ? (
        <div
          className="faint"
          style={{ fontSize: 11.5, padding: "4px 16px 8px", borderTop: "1px solid var(--border)" }}
        >
          {data.timestamp ? new Date(data.timestamp).toUTCString() : ""}
        </div>
      ) : null}
    </div>
  );
}

export function EmbedBuilder() {
  const [data, setData] = useState<EmbedData>({
    ...EMPTY,
    title: "Something worth reading",
    description:
      "This is what the embed will look like. Embeds support markdown, so **bold** and links work.",
    footer: { text: "Example footer", iconUrl: "" },
    timestamp: "",
  });

  const [username, setUsername] = useState("");

  const patch = (change: Partial<EmbedData>) => setData((prev) => ({ ...prev, ...change }));
  const patchField = (index: number, change: Partial<EmbedField>) =>
    setData((prev) => ({
      ...prev,
      fields: prev.fields.map((field, i) => (i === index ? { ...field, ...change } : field)),
    }));

  const payload = useMemo(
    () =>
      buildWebhookPayload({
        embed: {
          title: data.title,
          url: data.url,
          description: data.description,
          color: data.color,
          timestamp: data.timestamp,
          imageUrl: data.imageUrl,
          thumbnailUrl: data.thumbnailUrl,
          author: data.author,
          footer: data.footer,
          fields: data.fields,
        },
        username,
        avatarUrl: data.avatarUrl,
        includeContent: data.includeContent,
      }),
    [data, username],
  );

  const json = JSON.stringify(payload.payload, null, 2);
  const characterCount = payload.characterCount;
  const warnings = payload.warnings;

  return (
    <div className="stack">
      <Panel title="Content" icon="type">
        <Checkbox
          checked={data.includeContent}
          onChange={(includeContent) => patch({ includeContent })}
          label="Include a content field (required to send a webhook with only a file)"
        />
        <Field label="Webhook username override">
          <TextInput value={username} onChange={setUsername} placeholder="optional" />
        </Field>
      </Panel>

      <Panel
        title="Embed"
        icon="image"
        action={
          <button className="btn btn--sm" onClick={() => patch({ color: randomHex() })}>
            <Icon name="dice" size={13} /> Random colour
          </button>
        }
      >
        <Field label="Title">
          <TextInput value={data.title} onChange={(title) => patch({ title })} />
        </Field>
        <Field label="Title URL">
          <TextInput value={data.url} onChange={(url) => patch({ url })} placeholder="https://" />
        </Field>
        <Field label="Description" hint="Markdown works: **bold**, __underline__, ||spoiler||, > quote, `code`.">
          <TextArea value={data.description} onChange={(description) => patch({ description })} rows={4} />
        </Field>
        <div className="grid-2">
          <Field label="Colour">
            <div className="field__row">
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(data.color) ? data.color : "#d4d4d8"}
                onChange={(event) => patch({ color: event.target.value })}
                style={{
                  width: 40,
                  height: 36,
                  padding: 2,
                  borderRadius: 6,
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg-elev)",
                  flexShrink: 0,
                }}
              />
              <TextInput value={data.color} onChange={(color) => patch({ color })} mono />
            </div>
          </Field>
          <Field label="Colour integer">
            <TextInput
              value={
                /^#[0-9a-f]{6}$/i.test(data.color)
                  ? String(parseInt(data.color.slice(1), 16))
                  : ""
              }
              mono
              onChange={(value) => {
                const parsed = Number(value.replace(/\D/g, ""));
                if (Number.isFinite(parsed) && parsed >= 0) {
                  patch({ color: rgbToHex(hexToRgb(`#${parsed.toString(16).padStart(6, "0")}`)) });
                }
              }}
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Author" icon="user">
        <div className="grid-2">
          <Field label="Name">
            <TextInput
              value={data.author.name}
              onChange={(name) => patch({ author: { ...data.author, name } })}
            />
          </Field>
          <Field label="URL">
            <TextInput
              value={data.author.url}
              onChange={(url) => patch({ author: { ...data.author, url } })}
            />
          </Field>
        </div>
        <Field label="Icon URL">
          <TextInput
            value={data.author.iconUrl}
            onChange={(iconUrl) => patch({ author: { ...data.author, iconUrl } })}
            placeholder="https://cdn.discordapp.com/..."
          />
        </Field>
      </Panel>

      <Panel
        title="Fields"
        icon="grid"
        action={
          <button
            className="btn btn--sm"
            onClick={() =>
              patch({ fields: [...data.fields, { name: "", value: "", inline: true }] })
            }
            disabled={data.fields.length >= 25}
          >
            <Icon name="grid" size={13} /> Add field
          </button>
        }
      >
        <div className="stack stack--sm">
          {data.fields.map((field, index) => (
            <div
              key={index}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 12,
                background: "var(--bg-elev)",
              }}
            >
              <div className="row-flex" style={{ marginBottom: 8 }}>
                <span className="faint small mono">field {index + 1}</span>
                <span className="spacer" style={{ flex: 1 }} />
                <Checkbox
                  checked={field.inline}
                  onChange={(inline) => patchField(index, { inline })}
                  label="inline"
                />
                <button
                  className="btn btn--sm btn--icon"
                  onClick={() =>
                    patch({ fields: data.fields.filter((_, i) => i !== index) })
                  }
                  title="Remove field"
                >
                  <Icon name="trash" size={13} />
                </button>
              </div>
              <Field label="Name">
                <TextInput
                  value={field.name}
                  onChange={(name) => patchField(index, { name })}
                  placeholder="Field name"
                />
              </Field>
              <Field label="Value">
                <TextArea
                  value={field.value}
                  onChange={(value) => patchField(index, { value })}
                  rows={2}
                  placeholder="Field value"
                />
              </Field>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Media and footer" icon="image">
        <div className="grid-2">
          <Field label="Image URL">
            <TextInput value={data.imageUrl} onChange={(imageUrl) => patch({ imageUrl })} />
          </Field>
          <Field label="Thumbnail URL">
            <TextInput value={data.thumbnailUrl} onChange={(thumbnailUrl) => patch({ thumbnailUrl })} />
          </Field>
          <Field label="Footer text">
            <TextInput
              value={data.footer.text}
              onChange={(text) => patch({ footer: { ...data.footer, text } })}
            />
          </Field>
          <Field label="Footer icon URL">
            <TextInput
              value={data.footer.iconUrl}
              onChange={(iconUrl) => patch({ footer: { ...data.footer, iconUrl } })}
            />
          </Field>
        </div>
        <Field label="Timestamp" hint="ISO 8601. Leave blank for no timestamp.">
          <TextInput
            value={data.timestamp}
            onChange={(timestamp) => patch({ timestamp })}
            mono
            placeholder="2026-01-31T18:30:00.000Z"
          />
        </Field>
      </Panel>

      <Panel title="Preview" icon="eye">
        <EmbedPreview data={data} />
      </Panel>

      <Panel
        title="JSON"
        icon="code"
        action={
          <>
            <CopyButton value={json} label="Copy JSON" />
            <button
              className="btn btn--sm"
              onClick={() => {
                downloadText("embed.json", json, "application/json");
              }}
            >
              <Icon name="download" size={13} /> Download
            </button>
          </>
        }
      >
        <Output>{json}</Output>
        <div className="row-flex">
          <span className="faint small">{characterCount} characters</span>
          <span className="faint small">&middot;</span>
          <span className="faint small">limit {EMBED_LIMITS.total}</span>
        </div>
        {warnings.map((warning) => (
          <Notice key={warning} variant="warn">
            {warning}
          </Notice>
        ))}
      </Panel>
    </div>
  );
}

/* ============================== webhook sender =========================== */

export function WebhookSender() {
  const [url, setUrl] = useState("");
  const [body, setBody] = useState('{\n  "content": "Hello from aki\'s tools"\n}');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const endpoint = extractWebhook(url);
  let parseError: string | null = null;
  try {
    JSON.parse(body);
  } catch (caught) {
    parseError = caught instanceof Error ? caught.message : "Invalid JSON";
  }

  const send = async () => {
    if (!endpoint) {
      setError("That does not look like a webhook URL.");
      return;
    }
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const response = await discordDirect(endpoint, {
        method: "POST",
        body,
      });
      setResult(response ? JSON.stringify(response, null, 2) : "Sent. Discord returned no body.");
      toast("Webhook delivered");
    } catch (caught) {
      setError(
        caught instanceof DiscordApiError
          ? caught.message
          : "Could not deliver. Webhooks sometimes need ?wait=true to confirm.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="stack">
      <Notice variant="warn">
        <b>The webhook URL is a credential.</b> Anyone holding it can post to that channel.
        This page sends it to Discord directly from your browser, never to this site, but
        still do not paste a webhook into a shared computer or a screenshot.
      </Notice>

      <Panel title="Webhook URL" icon="link">
        <TextInput
          value={url}
          onChange={setUrl}
          mono
          placeholder="https://discord.com/api/webhooks/123456789/AbCdEf..."
          autoFocus
        />
        {endpoint ? (
          <Notice variant="ok">Looks like a valid webhook URL.</Notice>
        ) : url.trim() ? (
          <Notice variant="danger">
            Expected{" "}
            <span className="mono">
              https://discord.com/api/webhooks/&lt;id&gt;/&lt;token&gt;
            </span>
          </Notice>
        ) : null}
      </Panel>

      <Panel
        title="Payload"
        icon="code"
        action={
          <button
            className="btn btn--sm"
            onClick={() => setBody('{\n  "content": "Hello"\n}')}
          >
            <Icon name="refresh" size={13} /> Reset
          </button>
        }
      >
        <TextArea value={body} onChange={setBody} rows={10} mono />
      </Panel>

      {parseError ? <Notice variant="danger">Invalid JSON: {parseError}</Notice> : null}

      <Panel
        title="Send"
        icon="send"
        action={
          <CopyButton
            value={() =>
              `curl -X POST "${endpoint}?wait=true" -H "Content-Type: application/json" -d '${body.replace(/\n\s*/g, "")}'`
            }
            label="Copy cURL"
          />
        }
      >
        <div className="btn-row">
          <button
            className="btn btn--primary"
            onClick={send}
            disabled={sending || !endpoint || Boolean(parseError)}
          >
            {sending ? (
              <Icon name="refresh" size={15} className="spin" />
            ) : (
              <Icon name="send" size={15} />
            )}
            {sending ? "Sending" : "Send test message"}
          </button>
        </div>
        {error ? <Notice variant="danger">{error}</Notice> : null}
        {result ? (
          <>
            <Notice variant="ok">Delivered.</Notice>
            <Output>{result}</Output>
          </>
        ) : null}
      </Panel>

      <Panel title="Rate limits" icon="info">
        <Rows>
          <Row k="Per webhook" v="5 requests per 2 seconds" />
          <Row k="Overall" v="roughly 60 requests per minute" />
          <Row k="On 429" v="wait about 2 seconds, then retry once" />
        </Rows>
        <Notice>
          Test sends are still real messages in a real channel. Point the webhook at a
          private test channel first, not your main chat.
        </Notice>
      </Panel>
    </div>
  );
}

/* ============================= webhook deleter =========================== */

export function WebhookDeleter() {
  const [url, setUrl] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const endpoint = extractWebhook(url);
  const match = url.match(/webhooks\/(\d+)\/([A-Za-z0-9_-]+)/);
  const armed = Boolean(endpoint) && confirmText.trim().toUpperCase() === "DELETE";

  const load = async () => {
    if (!endpoint) return;
    setBusy(true);
    setError(null);
    try {
      const data = (await discordDirect(endpoint)) as {
        name?: string;
        channel_id?: string;
        guild_id?: string;
        avatar?: string | null;
      };
      setResult(
        [
          `Name: ${data.name ?? "(not set)"}`,
          `Channel ID: ${data.channel_id ?? "unknown"}`,
          `Server ID: ${data.guild_id ?? "unknown"}`,
          `Avatar: ${data.avatar ?? "none"}`,
        ].join("\n"),
      );
    } catch (caught) {
      setError(
        caught instanceof DiscordApiError
          ? caught.message
          : "Could not read that webhook.",
      );
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!endpoint || !armed) return;
    setBusy(true);
    setError(null);
    try {
      await discordDirect(endpoint, { method: "DELETE" });
      setResult("Deleted. That webhook URL no longer works.");
      setConfirmText("");
      toast("Webhook deleted");
    } catch (caught) {
      setError(
        caught instanceof DiscordApiError
          ? caught.message
          : "Delete failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <Notice>
        This deletes a webhook using the token embedded in its own URL. That means it only
        works for webhooks you own, which is exactly the intended use: clearing out test
        webhooks and old bots you no longer run. There is no way for this to touch somebody
        else's webhook.
      </Notice>

      <Panel title="Webhook URL" icon="link">
        <TextInput
          value={url}
          onChange={setUrl}
          mono
          placeholder="https://discord.com/api/webhooks/..."
        />
        <div className="btn-row">
          <button className="btn" onClick={load} disabled={!endpoint || busy}>
            {busy ? <Icon name="refresh" size={15} className="spin" /> : <Icon name="eye" size={15} />}
            Inspect
          </button>
        </div>
      </Panel>

      {error ? <Notice variant="danger">{error}</Notice> : null}

      {result ? (
        <Panel title="Details" icon="info">
          <Output>{result}</Output>
          <Notice>
            Edit the webhook in Discord to change its channel or name without recreating the
            URL. Deleting is the only destructive option.
          </Notice>
        </Panel>
      ) : null}

      <Panel title="Delete" icon="trash">
        <Field
          label="Type DELETE to confirm"
          hint={match ? `Webhook ID ${match[1]}` : undefined}
        >
          <TextInput value={confirmText} onChange={setConfirmText} placeholder="DELETE" />
        </Field>
        <div className="btn-row">
          <button
            className="btn btn--danger"
            onClick={remove}
            disabled={!armed || busy}
          >
            <Icon name="trash" size={15} /> Delete webhook
          </button>
        </div>
        {!armed && confirmText ? (
          <Notice variant="warn">Type DELETE exactly, in capitals, to enable the button.</Notice>
        ) : null}
      </Panel>
    </div>
  );
}

/* ========================== permission calculator ========================= */

export function PermissionCalculator() {
  const toast = useToast();
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(["View Channels", "Send Messages", "Embed Links"]),
  );

  const bits = useMemo(() => bitsFromNames([...checked]), [checked]);

  const admin = checked.has("Administrator");

  const toggle = (name: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const all = (category: string) =>
    PERMISSIONS.filter((p) => p.category === category).every((p) => checked.has(p.name));

  const toggleCategory = (category: string) => {
    const inCategory = PERMISSIONS.filter((p) => p.category === category);
    setChecked((prev) => {
      const next = new Set(prev);
      const shouldCheck = !inCategory.every((p) => next.has(p.name));
      for (const permission of inCategory) {
        if (shouldCheck) next.add(permission.name);
        else next.delete(permission.name);
      }
      return next;
    });
  };

  const copyInteger = async () => {
    const ok = await copyText(bits.toString());
    toast(ok ? "Permission integer copied" : "Copy failed", ok ? "ok" : "error");
  };

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="stat-tile">
          <div className="stat-tile__label">Decimal</div>
          <div className="stat-tile__value mono" style={{ fontSize: 14 }}>
            {permissionToDecimal(bits)}
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__label">Hex</div>
          <div className="stat-tile__value mono" style={{ fontSize: 14 }}>
            {permissionToHex(bits)}
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__label">Selected</div>
          <div className="stat-tile__value">{checked.size}</div>
        </div>
      </div>

      {admin ? (
        <Notice variant="warn">
          <b>Administrator overrides everything.</b> On Discord, a member with Administrator
          has every permission in every channel regardless of channel overwrites. The
          integer below is still what gets stored, but the effective permissions are total.
        </Notice>
      ) : null}

      <Panel
        title="Permissions"
        icon="shield"
        action={
          <>
            <button
              className="btn btn--sm"
              onClick={() => setChecked(new Set(PERMISSIONS.map((p) => p.name)))}
            >
              All
            </button>
            <button className="btn btn--sm" onClick={() => setChecked(new Set())}>
              None
            </button>
          </>
        }
      >
        {PERMISSION_CATEGORIES.map((category) => {
          const inCategory = PERMISSIONS.filter((p) => p.category === category);
          return (
            <div key={category} style={{ marginTop: 16 }}>
              <div className="field__label">
                <label className="checkbox" style={{ fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={all(category)}
                    onChange={() => toggleCategory(category)}
                  />
                  <span>{category}</span>
                </label>
              </div>
              <div className="stack stack--sm">
                {inCategory.map((permission) => (
                  <div key={permission.name}>
                    <Checkbox
                      checked={checked.has(permission.name)}
                      onChange={() => toggle(permission.name)}
                      label={
                        <span>
                          <span className="mono">{permission.name}</span>
                          <span className="faint small" style={{ display: "block" }}>
                            {permission.description}
                          </span>
                        </span>
                      }
                    />
                    {permission.note ? (
                      <div className="faint small" style={{ marginLeft: 24 }}>
                        {permission.note}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </Panel>

      <Panel title="Integer" icon="code">
        <Output>{permissionToDecimal(bits)}</Output>
        <div className="btn-row">
          <button className="btn btn--primary" onClick={copyInteger}>
            <Icon name="copy" size={15} /> Copy as integer
          </button>
          <CopyButton value={permissionToHex(bits)} label="Copy as hex" />
          <CopyButton value={permissionToBinary(bits)} label="Copy as binary" />
        </div>
        <Notice>
          Use this integer in a role payload or the{" "}
          <span className="mono">permissions</span> field when creating a role through the
          API. The same value appears in the audit log and in the role export.
        </Notice>
      </Panel>

      <Panel title="Setting an integer" icon="tool">
        <IntegerParser onApply={setChecked} />
      </Panel>
    </div>
  );
}

function IntegerParser({ onApply }: { onApply: (set: Set<string>) => void }) {
  const [raw, setRaw] = useState("");

  const parsed = useMemo(() => {
    const clean = raw.trim();
    if (!clean) return null;
    try {
      const value = parseInteger(clean);
      const summary = summarize(value);
      return {
        value,
        names: new Set<string>(summary.names),
        unknown: unknownBitPositions(value),
      };
    } catch {
      return null;
    }
  }, [raw]);

  return (
    <>
      <Field label="Paste an integer" hint="Decimal, 0x hex or 0b binary.">
        <TextInput value={raw} onChange={setRaw} mono placeholder="8" />
      </Field>
      {parsed ? (
        <>
          <Output>
            {PERMISSIONS.filter((permission) => parsed.names.has(permission.name))
              .map((permission) => permission.name)
              .join("\n") || "No known permissions set"}
          </Output>
          {parsed.unknown.length > 0 ? (
            <Notice>
              {parsed.unknown.length} bit{parsed.unknown.length === 1 ? "" : "s"} not covered
              by this list, which usually means a newer Discord permission:{" "}
              {parsed.unknown
                .slice(0, 8)
                .map((position) => (1n << BigInt(position)).toString())
                .join(", ")}
              {parsed.unknown.length > 8 ? "..." : ""}
            </Notice>
          ) : null}
          <div className="btn-row">
            <button
              className="btn"
              onClick={() => {
                onApply(parsed.names);
                setRaw("");
              }}
            >
              <Icon name="check" size={15} /> Load into calculator
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}

/* ============================== rpc preview ============================== */

export function RpcPreview() {
  const [verb, setVerb] = useState(0);
  const [text, setText] = useState("Baldur's Gate 3");
  const [state, setState] = useState("");
  const [showTime, setShowTime] = useState(true);
  const [offset] = useState(() => Date.now());

  const start = offset - (state ? 47 * 60_000 : 0);

  return (
    <div className="stack">
      <Panel title="Presence" icon="zap">
        <div className="chip-row">
          {RPC_PRESETS.map((preset, index) => (
            <button
              key={preset.label}
              type="button"
              className={`chip ${verb === index ? "is-active" : ""}`}
              onClick={() => setVerb(index)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <Field label="Main text">
          <TextInput value={text} onChange={setText} placeholder="What are you doing?" />
        </Field>
        <Field label="Sub text" hint="Optional second line.">
          <TextInput value={state} onChange={setState} placeholder="Party, level 9" />
        </Field>
        <Checkbox checked={showTime} onChange={setShowTime} label="Show elapsed time" />
      </Panel>

      <Panel title="How it looks" icon="eye">
        <div className="preview-frame">
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "#8e8e9a",
                color: "#0a0a0c",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                fontSize: 20,
              }}
            >
              a
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>
                {RPC_PRESETS[verb].label} {text || "something"}
              </div>
              <div className="faint small">
                {state ? `${state} \u00b7 ` : ""}
                {showTime ? "47 minutes elapsed" : "now"}
              </div>
            </div>
          </div>
        </div>
        <p className="faint small">
          Rendered from <span className="mono">timestamp: {start}</span>
        </p>
      </Panel>

      <Panel title="Activity payload" icon="code">
        <Output>
          {JSON.stringify(
            {
              type: 0,
              details: text,
              state,
              timestamps: showTime ? { start } : undefined,
              assets: {
                large_image: "your_asset_id",
                large_text: "Tooltip",
              },
            },
            null,
            2,
          )}
        </Output>
      </Panel>

      <Notice>
        This is a visual mockup of a rich presence, not an actual Discord connection. Real
        RPC runs through a local process or the browser extension and is something your
        application does, not a thing a web page can inject. Use this to design what your
        app should display.
      </Notice>
    </div>
  );
}