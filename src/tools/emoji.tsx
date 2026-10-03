import { useEffect, useMemo, useState } from "react";
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
  Tabs,
  TextInput,
  useToast,
} from "../components/ui";

import { copyImage, copyText, downloadDataUrl, pickFile } from "../lib/clipboard";
import { discordFetch } from "../lib/discordApi";
import {
  ROLE_PALETTE,
  contrastAgainst,
  hexToRgb,
  isHex,
  luminanceLabel,
  shadeColor,
} from "../lib/color";
import { EMOJI_CATEGORIES, EMOJIS } from "../lib/emojiData";
import { cropImage, resizeImage } from "../lib/image";
import { toOutline } from "../lib/text";

/* ============================= emoji library ============================== */

export function EmojiLibrary() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [recent, setRecent] = useState<string[]>([]);
  const toast = useToast();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return EMOJIS.filter((entry) => {
      if (category !== "All" && entry.category !== category) return false;
      if (!needle) return true;
      return (
        entry.name.includes(needle) ||
        entry.keywords.some((word) => word.includes(needle))
      );
    });
  }, [query, category]);

  const copy = async (entry: { char: string; name: string }) => {
    const ok = await copyText(entry.char);
    if (ok) {
      setRecent((prev) => [entry.char, ...prev.filter((c) => c !== entry.char)].slice(0, 24));
      toast(`${entry.name} copied`);
    } else {
      toast("Could not access the clipboard", "error");
    }
  };

  return (
    <div className="stack">
      <Panel title="Search" icon="search">
        <TextInput
          value={query}
          onChange={setQuery}
          placeholder="Search by name, like smile or cat"
          autoFocus
        />
        <div className="chip-row">
          {["All", ...EMOJI_CATEGORIES].map((entry) => (
            <button
              key={entry}
              type="button"
              className={`chip ${category === entry ? "is-active" : ""}`}
              onClick={() => setCategory(entry)}
            >
              {entry}
            </button>
          ))}
        </div>
      </Panel>

      {recent.length > 0 ? (
        <Panel
          title="Recently copied"
          icon="clock"
          action={
            <button className="btn btn--sm" onClick={() => setRecent([])}>
              <Icon name="trash" size={13} /> Clear
            </button>
          }
        >
          <div className="row-flex" style={{ gap: 4 }}>
            {recent.map((char, index) => (
              <button
                key={`${char}-${index}`}
                className="btn btn--sm btn--icon"
                style={{ fontSize: 17 }}
                title="Copy again"
                onClick={() => void copyText(char)}
              >
                {char}
              </button>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel title={`Emoji (${filtered.length})`} icon="star" bodyless>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))",
            gap: 4,
            padding: 12,
            maxHeight: 620,
            overflowY: "auto",
          }}
        >
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
              No emoji matched that.
            </div>
          ) : (
            filtered.map((entry) => (
              <button
                key={`${entry.name}-${entry.char}`}
                className="card"
                style={{
                  alignItems: "center",
                  padding: "10px 6px",
                  gap: 4,
                  cursor: "pointer",
                  border: "1px solid transparent",
                  background: "transparent",
                }}
                onClick={() => copy(entry)}
                title={`Copy :${entry.name}:`}
              >
                <span style={{ fontSize: 24, lineHeight: 1.2 }}>{entry.char}</span>
                <span
                  className="faint"
                  style={{
                    fontSize: 10,
                    textAlign: "center",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}
                >
                  {entry.name}
                </span>
              </button>
            ))
          )}
        </div>
      </Panel>

      <Panel title="Custom emoji" icon="hash">
        <Field
          label="Paste an emoji to get its syntax"
          hint="Standard emoji render everywhere. Custom server emoji need the exact name, including capitals."
        >
          <TextInput value="" onChange={() => undefined} placeholder="Paste an emoji above" />
        </Field>
        <Notice>
          Custom emoji look like <span className="mono">:name:1212345678901234567</span> and
          only work in servers that have that emoji uploaded. To download a custom emoji,
          right click it and choose Copy Link.
        </Notice>
      </Panel>
    </div>
  );
}

/* ============================ emoji by id ================================ */

export function EmojiDownloader() {
  const [input, setInput] = useState("");
  const [data, setData] = useState<{ id: string; name: string; animated: boolean; url: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const resolve = async () => {
    const id = input.match(/(\d{17,20})/)?.[1];
    if (!id) {
      setError("Paste an emoji link or a raw emoji ID. Both are 17 to 20 digits.");
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const emoji = (await discordFetch(`/emojis/${id}`)) as {
        id: string;
        name?: string;
        animated?: boolean;
        available?: boolean;
        user?: { username: string };
      };

      if (!emoji?.id) throw new Error("Discord returned no emoji for that ID.");

      const url = `https://cdn.discordapp.com/emojis/${emoji.id}.${
        emoji.animated ? "gif" : "png"
      }?size=1024`;

      setData({
        id: emoji.id,
        name: emoji.name ?? "unnamed",
        animated: Boolean(emoji.animated),
        url,
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not fetch that emoji. Discord limits anonymous emoji lookups.",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <Panel
        title="Emoji"
        icon="star"
        hint="Paste a CDN link, or the emoji ID from a message's source."
      >
        <TextInput
          value={input}
          onChange={setInput}
          mono
          placeholder="https://cdn.discordapp.com/emojis/123456789012345678.png"
          autoFocus
          onKeyDown={(event) => {
            if (event.key === "Enter") resolve();
          }}
        />
        <div className="btn-row">
          <button
            className="btn btn--primary"
            onClick={resolve}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <Icon name="refresh" size={15} className="spin" />
            ) : (
              <Icon name="search" size={15} />
            )}
            {loading ? "Fetching" : "Fetch"}
          </button>
          <button className="btn" onClick={() => { setInput(""); setData(null); setError(null); }}>
            Clear
          </button>
        </div>
      </Panel>

      {error ? <Notice variant="danger">{error}</Notice> : null}

      {data ? (
        <>
          <Panel title="Preview" icon="image">
            <div className="img-stage">
              <img
                src={data.url}
                alt={data.name}
                className="img-preview"
                style={{ width: 200, height: 200, objectFit: "contain" }}
                onError={() => toast("Could not load that image", "error")}
              />
            </div>
            <Rows>
              <Row k="Name" v={data.name} copyable />
              <Row k="ID" v={data.id} copyable />
              <Row k="Animated" v={data.animated ? "yes, GIF" : "no, PNG"} />
              <Row k="Message syntax" v={`:${data.name}:`} copyable />
            </Rows>
          </Panel>

          <Panel
            title="Download"
            icon="download"
            action={<CopyButton value={data.url} label="Copy URL" />}
          >
            <div className="chip-row">
              {[64, 128, 256, 512, 1024].map((size) => (
                <a
                  key={size}
                  className="chip"
                  href={data.url.replace(/size=\d+/, `size=${size}`)}
                  target="_blank"
                  rel="noreferrer noopener"
                  download={`${data.name}-${data.id}.${data.animated ? "gif" : "png"}`}
                >
                  <Icon name="download" size={13} /> {size}px
                </a>
              ))}
            </div>
          </Panel>
        </>
      ) : null}

      <Notice>
        Getting an emoji ID without developer mode: hover the emoji, hold Shift and click it.
        That opens a browser tab with the CDN URL, which contains the ID.
      </Notice>
    </div>
  );
}

/* ============================= emoji resizer ============================== */

const EMOJI_TARGETS = [
  { label: "Small emoji", size: 32, note: "The standard in-chat size." },
  { label: "Medium emoji", size: 48, note: "Larger servers and hover states." },
  { label: "Large emoji", size: 64, note: "Reaction picker tiles." },
  { label: "Server emoji upload", size: 256, note: "What Discord accepts when you upload." },
  { label: "Reaction picker", size: 512, note: "Highest useful size before waste." },
];

export function EmojiResizer() {
  const [source, setSource] = useState<string | null>(null);
  const [size, setSize] = useState(256);
  const [transparent, setTransparent] = useState(true);
  const [scale, setScale] = useState(100);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const pixels = Math.round((size * scale) / 100);

  useEffect(() => {
    if (!source) return;

    let cancelled = false;
    setBusy(true);
    resizeImage({ source, width: pixels, height: pixels, transparent })
      .then((dataUrl) => {
        if (cancelled) return;
        setOutput(dataUrl);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : "Resize failed.");
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });

    return () => {
      cancelled = true;
    };
  }, [source, pixels, transparent]);

  const choose = async () => {
    const [file] = await pickFile("image/*");
    if (!file) return;
    setError(null);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Could not read that file."));
      reader.readAsDataURL(file);
    });
    setSource(dataUrl);
  };

  return (
    <div className="stack">
      <Panel
        title="Source image"
        icon="upload"
        action={
          <>
            <button className="btn btn--sm" onClick={() => void choose()}>
              <Icon name="upload" size={13} /> Choose file
            </button>
            {source ? (
              <button
                className="btn btn--sm"
                onClick={() => {
                  setSource(null);
                  setOutput(null);
                  setError(null);
                }}
              >
                <Icon name="trash" size={13} /> Clear
              </button>
            ) : null}
          </>
        }
      >
        <div
          className={`img-drop ${busy ? "is-over" : ""}`}
          onClick={() => void choose()}
        >
          {source ? (
            <img src={source} alt="" className="img-preview" style={{ maxHeight: 120 }} />
          ) : (
            <>
              <Icon name="image" size={26} />
              <div style={{ marginTop: 8 }}>Click to choose a PNG, GIF, WebP or JPG</div>
              <div className="faint small" style={{ marginTop: 4 }}>
                The image never leaves your browser
              </div>
            </>
          )}
        </div>
      </Panel>

      {error ? <Notice variant="danger">{error}</Notice> : null}

      <Panel title="Target size" icon="crop">
        <div className="chip-row">
          {EMOJI_TARGETS.map((target) => (
            <button
              key={target.size}
              type="button"
              className={`chip ${size === target.size ? "is-active" : ""}`}
              onClick={() => {
                setSize(target.size);
                setScale(100);
              }}
              title={target.note}
            >
              {target.size}x{target.size}
            </button>
          ))}
        </div>
        <Slider label="Output width" value={size} onChange={setSize} min={16} max={512} />
        <Slider label="Zoom" value={scale} onChange={setScale} min={25} max={200} />
        <label className="checkbox">
          <input
            type="checkbox"
            checked={transparent}
            onChange={(event) => setTransparent(event.target.checked)}
          />
          <span>Keep transparency (PNG)</span>
        </label>
      </Panel>

      {output ? (
        <Panel
          title="Output"
          icon="check"
          action={
            <>
              <button
                className="btn btn--sm"
                onClick={async () => {
                  const ok = await copyImageDataUrl(output);
                  toast(ok ? "Copied to clipboard" : "Clipboard blocked by the browser", ok ? "ok" : "error");
                }}
              >
                <Icon name="copy" size={13} /> Copy
              </button>
              <button
                className="btn btn--sm btn--primary"
                onClick={() => downloadDataUrl(`emoji-${size}.png`, output)}
              >
                <Icon name="download" size={13} /> Download PNG
              </button>
            </>
          }
        >
          <div className="img-stage">
            <img src={output} alt="Resized" className="img-preview" style={{ imageRendering: "auto" }} />
          </div>
          <Rows>
            <Row k="Dimensions" v={`${pixels} x ${pixels}`} />
            <Row k="Estimated size" v={`${Math.round((output.length * 0.75) / 1024)} KB`} />
          </Rows>
          <Notice>
            Discord caps custom emoji at 256 KB and 256x256. Scaling up past the source
            resolution does not add detail, it only adds file size.
          </Notice>
        </Panel>
      ) : null}
    </div>
  );
}

async function copyImageDataUrl(dataUrl: string): Promise<boolean> {
  const image = new Image();
  await new Promise<void>((resolve) => {
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = dataUrl;
  });
  return copyImage(image);
}

/* =============================== pfp cropper ============================= */

const AVATAR_PRESETS: {
  label: string;
  width: number;
  height: number;
  note: string;
}[] = [
  { label: "Profile picture", width: 400, height: 400, note: "The default Discord avatar size." },
  { label: "Avatar 2.0", width: 512, height: 512, note: "Larger avatar shown on hover and in the member list." },
  { label: "Server icon", width: 512, height: 512, note: "Round, and shown tiny. Keep detail simple." },
  { label: "Banner", width: 600, height: 240, note: "The 600x240 Discord accepts for a profile banner." },
  { label: "Banner (2x)", width: 960, height: 384, note: "Twice the resolution, for high density displays." },
];

export function PfpCropper() {
  const [source, setSource] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [preset, setPreset] = useState(AVATAR_PRESETS[0]);
  const [round, setRound] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const toast = useToast();

  const choose = async () => {
    const [file] = await pickFile("image/*");
    if (!file) return;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Could not read that file."));
      reader.readAsDataURL(file);
    });
    const image = await loadImage(dataUrl);
    setSource(dataUrl);
    setNatural({ w: image.naturalWidth, h: image.naturalHeight });
    setZoom(100);
    setOffsetX(0);
    setOffsetY(0);
    setOutput(null);
  };

  const crop = async () => {
    if (!source) return;
    try {
      setOutput(
        await cropImage({
          source,
          width: preset.width,
          height: preset.height,
          zoom: zoom / 100,
          offsetX,
          offsetY,
          round,
        }),
      );
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : "Crop failed", "error");
    }
  };

  return (
    <div className="stack">
      <Panel
        title="Source image"
        icon="upload"
        action={
          <>
            <button className="btn btn--sm" onClick={() => void choose()}>
              <Icon name="upload" size={13} /> Choose
            </button>
            {source ? (
              <button className="btn btn--sm" onClick={() => { setSource(null); setOutput(null); }}>
                <Icon name="trash" size={13} /> Clear
              </button>
            ) : null}
          </>
        }
      >
        <div className="img-drop" onClick={() => void choose()}>
          {source ? (
            <img src={source} alt="" className="img-preview" style={{ maxHeight: 130 }} />
          ) : (
            <>
              <Icon name="image" size={26} />
              <div style={{ marginTop: 8 }}>Click to choose an image</div>
            </>
          )}
        </div>
        {natural ? (
          <Rows>
            <Row k="Source size" v={`${natural.w} x ${natural.h}`} />
            <Row k="Aspect ratio" v={simplifyRatio(natural.w, natural.h)} />
          </Rows>
        ) : null}
      </Panel>

      <Panel title="Output shape" icon="crop">
        <div className="chip-row">
          {AVATAR_PRESETS.map((entry) => (
            <button
              key={entry.label}
              type="button"
              className={`chip ${preset.label === entry.label ? "is-active" : ""}`}
              onClick={() => {
                setPreset(entry);
                setOutput(null);
              }}
              title={entry.note}
            >
              {entry.label}
              <span className="faint" style={{ marginLeft: 6, fontSize: 11 }}>
                {entry.width}x{entry.height}
              </span>
            </button>
          ))}
        </div>
        <p className="faint small">{preset.note}</p>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={round}
            onChange={(event) => {
              setRound(event.target.checked);
              setOutput(null);
            }}
          />
          <span>Clip to a circle (for server icons)</span>
        </label>
      </Panel>

      <Panel
        title="Adjust"
        icon="crop"
        action={
          <button className="btn btn--sm btn--primary" onClick={() => void crop()} disabled={!source}>
            <Icon name="scissors" size={13} /> Crop
          </button>
        }
      >
        <Slider label="Zoom" value={zoom} onChange={setZoom} min={100} max={400} />
        <Slider label="Offset X" value={offsetX} onChange={setOffsetX} min={-300} max={300} />
        <Slider label="Offset Y" value={offsetY} onChange={setOffsetY} min={-300} max={300} />
        <div className="btn-row">
          <button
            className="btn btn--sm"
            onClick={() => {
              setZoom(100);
              setOffsetX(0);
              setOffsetY(0);
            }}
          >
            <Icon name="refresh" size={13} /> Reset
          </button>
        </div>
      </Panel>

      {output ? (
        <Panel
          title="Result"
          icon="check"
          action={
            <button
              className="btn btn--sm btn--primary"
              onClick={() => downloadDataUrl(`crop-${preset.width}x${preset.height}.png`, output)}
            >
              <Icon name="download" size={13} /> Download PNG
            </button>
          }
        >
          <div className="img-stage">
            <img
              src={output}
              alt="Cropped"
              className="img-preview"
              style={{ maxHeight: 220 }}
            />
          </div>
          <Rows>
            <Row k="Output size" v={`${preset.width} x ${preset.height}`} />
            <Row k="Clipped" v={round ? "circle" : "rectangle"} />
            <Row k="Estimated size" v={`${Math.round((output.length * 0.75) / 1024)} KB`} />
          </Rows>
          <Notice>
            Set your Discord avatar to this file. Uploading is always manual; nothing here
            touches your account.
          </Notice>
        </Panel>
      ) : null}
    </div>
  );
}

/* ============================== hex picker =============================== */

export function HexColorPicker() {
  const [hex, setHex] = useState("#5865f2");
  const valid = isHex(hex);
  const verdict = valid ? contrastAgainst(hex) : null;

  return (
    <div className="stack">
      <Panel
        title="Colour"
        icon="palette"
        action={
          <button
            className="btn btn--sm"
            onClick={() => setHex(`#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`)}
          >
            <Icon name="dice" size={13} /> Random
          </button>
        }
      >
        <div className="field__row" style={{ alignItems: "stretch" }}>
          <input
            type="color"
            value={valid ? hex : "#000000"}
            onChange={(event) => setHex(event.target.value)}
            style={{
              width: 84,
              borderRadius: 10,
              border: "1px solid var(--border-strong)",
              background: "var(--bg-elev)",
              cursor: "pointer",
            }}
          />
          <TextInput value={hex} onChange={setHex} mono />
        </div>
        {!valid ? <Notice variant="warn">Not a valid hex colour yet.</Notice> : null}
      </Panel>

      {valid && verdict ? (
        <>
          <Panel title="Discord values" icon="code">
            <Rows>
              <Row k="Decimal" v={parseInt(hex.replace("#", "").slice(0, 6), 16)} copyable />
              <Row k="RGB" v={`${hexToRgb(hex).r}, ${hexToRgb(hex).g}, ${hexToRgb(hex).b}`} copyable />
              <Row k="Perceived" v={luminanceLabel(hex)} />
              <Row k="Contrast vs white" v={`${verdict.ratio.toFixed(2)}:1`} />
            </Rows>
          </Panel>

          <Panel title="On a light background" icon="sun">
            <div
              style={{
                background: "#f2f3f5",
                color: hex,
                padding: "20px 16px",
                borderRadius: 10,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              Sample role name
            </div>
          </Panel>

          <Panel title="On a dark background" icon="eye">
            <div
              style={{
                background: "#313338",
                color: hex,
                padding: "20px 16px",
                borderRadius: 10,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              Sample role name
            </div>
          </Panel>

          <Panel title="Palette" icon="grid">
            <div className="swatches">
              {ROLE_PALETTE.map((entry) => (
                <button
                  key={entry}
                  className="swatch"
                  style={{ background: entry }}
                  title={`Copy ${entry}`}
                  onClick={() => setHex(entry)}
                >
                  <span>{entry}</span>
                </button>
              ))}
            </div>
            <CopyButton value={hex} label="Copy hex" />
          </Panel>
        </>
      ) : null}
    </div>
  );
}

/* =========================== role colour preview ========================== */

export function RoleColorPreview() {
  const [name, setName] = useState("Moderator");
  const [color, setColor] = useState("#5865f2");
  const [hoisted, setHoisted] = useState(true);
  const valid = isHex(color);
  const verdict = valid ? contrastAgainst(color) : null;

  return (
    <div className="stack">
      <Panel title="Role" icon="shield">
        <Field label="Role name">
          <TextInput value={name} onChange={setName} />
        </Field>
        <Field label="Colour">
          <div className="field__row">
            <input
              type="color"
              value={valid ? color : "#5865f2"}
              onChange={(event) => setColor(event.target.value)}
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
            <TextInput value={color} onChange={setColor} mono />
          </div>
        </Field>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={hoisted}
            onChange={(event) => setHoisted(event.target.checked)}
          />
          <span>Display separately in the online member list</span>
        </label>
      </Panel>

      <Panel title="Member list" icon="users" hint="How the member list looks in dark mode.">
        <div
          style={{
            background: "#313338",
            borderRadius: 10,
            padding: 14,
            maxWidth: 300,
          }}
        >
          <div className="faint small" style={{ marginBottom: 10, color: "#949ba4" }}>
            ONLINE &mdash; 3
          </div>
          <div className="row-flex" style={{ gap: 10, color: "#f2f3f5", padding: "4px 0" }}>
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#8e8e9a",
                color: "#0a0a0c",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              a
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 550, color: valid ? color : undefined }}>
                {name || "Role name"}
              </div>
              <div style={{ fontSize: 11.5, color: "#949ba4" }}>Playing something</div>
            </div>
          </div>
          <div
            style={{
              height: 1,
              background: "#3f4147",
              margin: "10px 0",
            }}
          />
          <div className="row-flex" style={{ gap: 10, color: "#949ba4", padding: "4px 0" }}>
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#4e5058",
              }}
            />
            <span style={{ fontSize: 13.5 }}>someone</span>
          </div>
          {hoisted ? (
            <p className="faint" style={{ fontSize: 11, marginTop: 8 }}>
              Displayed separately, so this role appears as its own section.
            </p>
          ) : null}
        </div>
      </Panel>

      <Panel title="Message text" icon="type" hint="Role colour does not apply to messages.">
        <div style={{ background: "#313338", borderRadius: 10, padding: 14, fontSize: 14 }}>
          <div style={{ color: "#f2f3f5", fontWeight: 550 }}>
            someone <span className="faint" style={{ fontSize: 11 }}>Today at 16:20</span>
          </div>
          <p style={{ color: "#dbdee1", marginTop: 3 }}>
            Role colours never change message text colour, only names in the member list.
          </p>
        </div>
      </Panel>

      {verdict ? (
        <Panel title="Readability" icon="eye">
          <Rows>
            <Row k="Best text colour" v={verdict.bestText} />
            <Row k="Contrast ratio" v={`${verdict.ratio.toFixed(2)}:1`} />
            <Row k="WCAG AA normal text" v={verdict.aaNormal ? "passes" : "fails"} />
            <Row k="WCAG AAA" v={verdict.aaaNormal ? "passes" : "fails"} />
          </Rows>
          <Notice variant={verdict.aaNormal ? "ok" : "warn"}>
            {verdict.aaNormal
              ? "This colour is readable against both Discord's light and dark backgrounds."
              : "Below 4.5:1 against one of Discord's backgrounds, so some members will struggle to read it."}
          </Notice>
        </Panel>
      ) : null}
    </div>
  );
}

/* ============================= colour text =============================== */

export function ColorText() {
  const [hex, setHex] = useState("#5865f2");
  const [text, setText] = useState("coloured text");
  const [mode, setMode] = useState<"embed" | "blocks">("embed");
  const valid = isHex(hex);
  const decimal = valid ? parseInt(hex.replace("#", "").slice(0, 6), 16) : 0;
  const rgb = valid ? hexToRgb(hex) : { r: 0, g: 0, b: 0 };

  const blockBar = useMemo(
    () =>
      Array.from({ length: 9 }, (_, index) =>
        shadeColor(hex, ((index - 4) / 4) * 0.55),
      ),
    [hex],
  );

  return (
    <div className="stack">
      <Notice>
        Discord does not support coloured text in a normal message. Messages are rendered in
        one colour by the client. Colour only appears inside <b>embeds</b>, which bots and
        webhooks can post, and that is what this tool shows you.
      </Notice>

      <Panel title="What you want" icon="palette">
        <Field label="Text">
          <TextInput value={text} onChange={setText} />
        </Field>
        <Field label="Colour">
          <div className="field__row">
            <input
              type="color"
              value={valid ? hex : "#5865f2"}
              onChange={(event) => setHex(event.target.value)}
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
            <TextInput value={hex} onChange={setHex} mono />
          </div>
        </Field>
        <Tabs
          value={mode}
          onChange={setMode}
          options={[
            { value: "embed", label: "Embed" },
            { value: "blocks", label: "Colour blocks" },
          ]}
        />
      </Panel>

      {mode === "embed" ? (
        <Panel title="Embed preview" icon="eye">
          <div style={{ borderLeft: `4px solid ${valid ? hex : "#4a4a55"}`, paddingLeft: 14 }}>
            <p style={{ color: valid ? hex : undefined, fontWeight: 600, fontSize: 17 }}>
              {text}
            </p>
          </div>
          <Output>
            {JSON.stringify({ embeds: [{ description: text, color: decimal }] }, null, 2)}
          </Output>
          <CopyButton
            value={() =>
              JSON.stringify({ embeds: [{ description: text, color: decimal }] }, null, 2)
            }
            label="Copy payload"
          />
          <Rows>
            <Row k="Hex" v={valid ? hex : "invalid"} copyable />
            <Row k="Decimal" v={decimal} copyable />
            <Row k="RGB" v={`${rgb.r}, ${rgb.g}, ${rgb.b}`} copyable />
          </Rows>
        </Panel>
      ) : (
        <Panel title="Colour blocks" icon="grid">
          <p className="muted small">
            The closest thing to coloured text that works in any message: block characters
            ({toOutline("███")} style). They render as solid colour in most fonts.
          </p>
          <div className="preview-frame" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {blockBar.map((color, index) => (
              <span key={index} style={{ fontSize: 26, color, lineHeight: 1 }}>
                {"\u2588\u2588\u2588"}
              </span>
            ))}
          </div>
          <CopyButton value={`${"\u2588".repeat(27)}\n${"\u2588".repeat(27)}`} label="Copy a colour bar" />
          <Notice>
            Coverage is unreliable: some fonts and themes render these as plain rectangles or
            nothing at all, and the emoji font often colours them instead of the message
            colour. Use them for decoration, never to convey information.
          </Notice>
        </Panel>
      )}
    </div>
  );
}

/* =============================== helpers ================================= */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load that image."));
    image.src = src;
  });
}

function simplifyRatio(w: number, h: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(w, h);
  return `${(w / divisor).toFixed(2)} : ${(h / divisor).toFixed(2)}`;
}