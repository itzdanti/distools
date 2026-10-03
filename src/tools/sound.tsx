import { useEffect, useMemo, useRef, useState } from "react";
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
  Tabs,
  TextArea,
  TextInput,
  useToast,
} from "../components/ui";
import { downloadText, pickFile } from "../lib/clipboard";
import {
  SOUNDS,
  SOUND_GROUPS,
  findSound,
  formatCountdown,
  playSound,
  type SoundDef,
} from "../lib/sound";
import { parseVtt, vttResult } from "../lib/core/vtt";
import { ageStats, parseDateInput } from "../lib/core/time";

/* =============================== soundboard ============================== */

export function SoundBoard() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string>("All");
  const [playing, setPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(60);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setPlaying(null), 900);
    return () => clearTimeout(timer);
  }, [playing]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return SOUNDS.filter((sound) => {
      if (group !== "All" && sound.group !== group) return false;
      if (!needle) return true;
      return (
        sound.name.toLowerCase().includes(needle) ||
        sound.name.toLowerCase().includes(needle) ||
        sound.description.toLowerCase().includes(needle)
      );
    });
  }, [query, group]);

  const play = (sound: SoundDef) => {
    playSound(sound, volume / 100);
    setPlaying(sound.id);
  };

  return (
    <div className="stack">
      <Panel title="Search" icon="search">
        <TextInput
          value={query}
          onChange={setQuery}
          placeholder="Search sounds, like coin or error"
          autoFocus
        />
        <div className="chip-row">
          {["All", ...SOUND_GROUPS].map((entry) => (
            <button
              key={entry}
              type="button"
              className={`chip ${group === entry ? "is-active" : ""}`}
              onClick={() => setGroup(entry)}
            >
              {entry}
            </button>
          ))}
        </div>
        <Slider label="Volume" value={volume} onChange={setVolume} min={0} max={100} />
      </Panel>

      <Panel title={`Sounds (${filtered.length})`} icon="volume" bodyless>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 8,
            padding: 12,
          }}
        >
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
              No sound matched that.
            </div>
          ) : (
            filtered.map((sound) => (
              <button
                key={sound.id}
                className={`btn ${playing === sound.id ? "is-active" : ""}`}
                onClick={() => play(sound)}
                title={`${sound.description} ${Math.round(sound.duration * 1000)}ms`}
              >
                <Icon name={playing === sound.id ? "volume" : "play"} size={14} />
                {sound.name}
              </button>
            ))
          )}
        </div>
      </Panel>

      <Notice>
        Every sound here is synthesised in the browser with the Web Audio API. There are no
        audio files to download and nothing is sent anywhere.
      </Notice>
    </div>
  );
}

/* ============================ discord sfx maker ========================== */

export function DiscordSfxTool() {
  const [pattern, setPattern] = useState("join:0-120,leave:200-420");
  const [names, setNames] = useState<string[]>(["User joined", "User left"]);
  const [volume, setVolume] = useState(50);
  const [speed, setSpeed] = useState(100);
  const [playing, setPlaying] = useState<string | null>(null);
  const toast = useToast();
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const scheduled = timers.current;
    return () => {
      scheduled.forEach((id) => clearTimeout(id));
    };
  }, []);

  const lines = useMemo(
    () =>
      pattern
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [pattern],
  );

  const parsed = useMemo(
    () =>
      lines.map((line, index) => {
        const match = line.match(/^([^:]+):\s*(-?\d+)\s*-\s*(-?\d+)$/);
        if (!match) {
          return { index, name: names[index] ?? `Step ${index + 1}`, start: NaN, end: NaN, valid: false };
        }
        return {
          index,
          name: match[1].trim(),
          start: Number(match[2]),
          end: Number(match[3]),
          valid: Number(match[2]) >= 0 && Number(match[3]) >= Number(match[2]),
        };
      }),
    [lines, names],
  );

  const allValid = parsed.every((entry) => entry.valid) && parsed.length > 0;

  const playAll = () => {
    if (!allValid) return;
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];

    for (const entry of parsed) {
      const sound = findSound(entry.name);
      if (!sound) continue;
      const delay = Math.max(0, entry.start * (100 / speed));
      const id = window.setTimeout(() => {
        playSound(sound, volume / 100);
        setPlaying(entry.name);
        window.setTimeout(() => setPlaying((current) => (current === entry.name ? null : current)), 900);
      }, delay);
      timers.current.push(id);
    }
  };

  return (
    <div className="stack">
      <Panel
        title="Timeline"
        icon="timer"
        hint="One event per line, as name:start-end in milliseconds."
        action={
          <button className="btn btn--sm btn--primary" onClick={playAll} disabled={!allValid}>
            <Icon name="play" size={13} /> Play all
          </button>
        }
      >
        <TextArea
          value={pattern}
          onChange={setPattern}
          mono
          rows={6}
          placeholder={'join:0-120\nleave:200-420'}
        />
        <Slider label="Speed" value={speed} onChange={setSpeed} min={50} max={200} />
        <Slider label="Volume" value={volume} onChange={setVolume} min={0} max={100} />
      </Panel>

      {parsed.length > 0 ? (
        <Panel title="Steps" icon="grid">
          <Rows>
            {parsed.map((entry) => (
              <div
                key={entry.index}
                className="row"
                style={playing === entry.name ? { color: "var(--text)" } : undefined}
              >
                <span className="row__key">
                  {playing === entry.name ? <Icon name="volume" size={14} /> : null}
                  {entry.name}
                </span>
                <span className="row__val">
                  {entry.valid
                    ? `${entry.start}ms to ${entry.end}ms (${entry.end - entry.start}ms)`
                    : "invalid line, expected name:start-end"}
                </span>
              </div>
            ))}
          </Rows>
          <CopyButton value={pattern} label="Copy pattern" />
        </Panel>
      ) : null}

      <Panel title="Reference" icon="book" hint="Names you can use in a pattern.">
        <div className="chip-row">
          {SOUNDS.slice(0, 40).map((sound) => (
            <button
              key={sound.id}
              className="chip"
              title={sound.description}
              onClick={() => {
                setPattern((current) =>
                  current.trim()
                    ? `${current.replace(/\s*$/, "")}\n${sound.id}:0-200`
                    : `${sound.id}:0-200`,
                );
              }}
            >
              {sound.name}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Names" icon="type" hint="Optional labels for exported data.">
        <Field label="Label 1">
          <TextInput
            value={names[0] ?? ""}
            onChange={(value) => setNames((current) => [value, current[1] ?? ""])}
          />
        </Field>
        <Field label="Label 2">
          <TextInput
            value={names[1] ?? ""}
            onChange={(value) => setNames((current) => [current[0] ?? "", value])}
          />
        </Field>
        <div className="btn-row">
          <button
            className="btn btn--sm"
            onClick={() => {
              downloadText(
                "sfx-pattern.json",
                JSON.stringify(
                  {
                    name: names[0] || "aki sfx",
                    events: parsed.map((entry) => ({
                      name: entry.name,
                      start: entry.start,
                      end: entry.end,
                    })),
                  },
                  null,
                  2,
                ),
                "application/json",
              );
              toast("Exported");
            }}
          >
            <Icon name="download" size={13} /> Export JSON
          </button>
        </div>
      </Panel>
    </div>
  );
}

/* =============================== countdown =============================== */

const COUNT_UNITS = [
  { label: "hours", seconds: 3600 },
  { label: "minutes", seconds: 60 },
  { label: "seconds", seconds: 1 },
] as const;

export function CountdownTool() {
  const [amount, setAmount] = useState(10);
  const [unit, setUnit] = useState<(typeof COUNT_UNITS)[number]["label"]>("seconds");
  const [target, setTarget] = useState<Date | null>(null);
  const [running, setRunning] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [sound, setSound] = useState(true);
  const [label, setLabel] = useState("");
  const fired = useRef(false);
  const toast = useToast();

  const totalSeconds = useMemo(() => {
    const factor = COUNT_UNITS.find((entry) => entry.label === unit)?.seconds ?? 1;
    return Math.max(0, Math.floor(amount * factor));
  }, [amount, unit]);

  const setFromNow = (seconds: number) => {
    setTarget(new Date(Date.now() + seconds * 1000));
    setRunning(false);
    fired.current = false;
  };

  useEffect(() => {
    if (!running || !target) return;
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, [running, target]);

  const remaining = target ? Math.max(0, Math.ceil((target.getTime() - now) / 1000)) : 0;

  useEffect(() => {
    if (!running || !target || remaining > 0) return;
    setRunning(false);
    if (fired.current) return;
    fired.current = true;
    if (sound) {
      const alarm = findSound("alarm") ?? findSound("bell");
      if (alarm) playSound(alarm, 0.6);
    }
  }, [running, target, remaining, sound]);

  const setManualTarget = (value: string) => {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      toast("That date could not be read", "error");
      return;
    }
    setTarget(parsedDate);
    setRunning(false);
    fired.current = false;
  };

  return (
    <div className="stack">
      <Panel title="Count down from" icon="timer" bodyless>
        <div style={{ padding: 12 }}>
          <div className="chip-row">
            {COUNT_UNITS.map((entry) => (
              <button
                key={entry.label}
                className={`chip ${unit === entry.label ? "is-active" : ""}`}
                onClick={() => setUnit(entry.label)}
              >
                {entry.label}
              </button>
            ))}
          </div>
          <div className="field__row" style={{ marginTop: 12 }}>
            <TextInput
              value={String(amount)}
              onChange={(value) => setAmount(Number(value.replace(/\D/g, "")) || 0)}
              inputMode="numeric"
            />
            <button className="btn btn--primary" onClick={() => setFromNow(totalSeconds)}>
              <Icon name="timer" size={15} /> Start {formatCountdown(totalSeconds)}
            </button>
          </div>
          <div className="chip-row" style={{ marginTop: 10 }}>
            {[5, 10, 15, 30, 60].map((minutes) => (
              <button
                key={minutes}
                className="chip"
                onClick={() => setFromNow(minutes * 60)}
              >
                {minutes} min
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="Or pick a date" icon="clock">
        <Field label="Target date and time" hint="Your device's local time.">
          <TextInput
            value={target ? target.toISOString().slice(0, 16) : ""}
            onChange={setManualTarget}
            type="datetime-local"
          />
        </Field>
      </Panel>

      {target ? (
        <Panel
          title="Time left"
          icon="clock"
          action={
            <>
              <button
                className="btn btn--sm"
                onClick={() => {
                  setRunning((current) => !current);
                  fired.current = false;
                }}
              >
                <Icon name={running ? "close" : "play"} size={13} />
                {running ? "Pause" : remaining > 0 ? "Resume" : "Restart"}
              </button>
              <button className="btn btn--sm" onClick={() => { setTarget(null); setRunning(false); }}>
                <Icon name="trash" size={13} /> Clear
              </button>
            </>
          }
        >
          <div className="preview-frame" style={{ textAlign: "center" }}>
            <div
              className="mono"
              style={{ fontSize: 52, fontWeight: 700, letterSpacing: 2, lineHeight: 1.1 }}
            >
              {formatCountdown(remaining)}
            </div>
            <div className="faint small" style={{ marginTop: 6 }}>
              {new Date(target).toLocaleString()}
            </div>
          </div>
          <Rows>
            <Row k="Total" v={formatCountdown(totalSeconds)} />
            <Row k="Message syntax" v={`<t:${Math.floor(target.getTime() / 1000)}:R>`} copyable />
            <Row k="Plain syntax" v={`<t:${Math.floor(target.getTime() / 1000)}>`} copyable />
          </Rows>
          <Checkbox
            checked={sound}
            onChange={setSound}
            label="Play a sound when it reaches zero"
          />
          <Field label="Label">
            <TextInput
              value={label}
              onChange={setLabel}
              placeholder="Stream starting in"
            />
          </Field>
          {label ? (
            <Output>{`${label} ${formatCountdown(remaining)}`}</Output>
          ) : null}
        </Panel>
      ) : null}
    </div>
  );
}

/* ============================== vtt timestamp ============================ */

export function VttTool() {
  const [raw, setRaw] = useState("");
  const [view, setView] = useState<"vtt" | "json">("vtt");

  const parsed = useMemo(() => parseVtt(raw), [raw]);

  const discordJson = useMemo(() => {
    if (parsed.length === 0) return null;
    return JSON.stringify(vttResult(raw).discord, null, 2);
  }, [parsed, raw]);

  const blank = useMemo(() => {
    return parsed
      .map((cue) =>
        [
          `00:00:${cue.start.toFixed(3).padStart(6, "0")} --> 00:00:${cue.end.toFixed(3).padStart(6, "0")}`,
          cue.text,
        ].join("\n"),
      )
      .join("\n\n");
  }, [parsed]);

  return (
    <div className="stack">
      <Panel title="Paste a VTT" icon="upload" hint="WebVTT captions from any video.">
        <TextArea
          value={raw}
          onChange={setRaw}
          mono
          rows={7}
          placeholder="WEBVTT&#10;&#10;1&#10;00:00:00.000 --> 00:00:02.500&#10;First line"
        />
        <div className="btn-row">
          <button
            className="btn btn--sm"
            onClick={async () => {
              const [file] = await pickFile("text/vtt,.vtt");
              if (!file) return;
              setRaw(await file.text());
            }}
          >
            <Icon name="upload" size={13} /> Open file
          </button>
          {raw ? (
            <button className="btn btn--sm" onClick={() => setRaw("")}>
              <Icon name="trash" size={13} /> Clear
            </button>
          ) : null}
        </div>
      </Panel>

      {parsed.length > 0 ? (
        <>
          <Panel
            title={`Cues (${parsed.length})`}
            icon="grid"
            action={<CopyButton value={raw} label="Copy original" />}
          >
            <Rows>
              {parsed.slice(0, 20).map((cue) => (
                <Row
                  key={cue.index}
                  k={`${cue.index}. ${cue.text || "(no text)"}`}
                  v={`${cue.start.toFixed(2)}s to ${cue.end.toFixed(2)}s`}
                />
              ))}
            </Rows>
            {parsed.length > 20 ? (
              <Notice variant="warn">
                Showing the first 20 of {parsed.length} cues. Discord only keeps the first 10
                subtitle cues, so nothing after cue 10 would be shown anyway.
              </Notice>
            ) : null}
          </Panel>

          <Panel
            title="Copy the timings"
            icon="type"
            action={
              <CopyButton
                value={view === "vtt" ? blank : (discordJson ?? "")}
                label={view === "vtt" ? "Copy VTT" : "Copy JSON"}
              />
            }
          >
            <Tabs
              value={view}
              onChange={setView}
              options={[
                { value: "vtt", label: "VTT timings" },
                { value: "json", label: "Discord JSON" },
              ]}
            />
            <Output>{view === "vtt" ? blank || "No cues parsed yet." : discordJson}</Output>
            <Notice variant="warn">
              Discord cannot read a VTT file from a browser. A transcript has to be hosted
              somewhere and referenced by URL, so this only gives you the timings and the
              shape Discord expects.
            </Notice>
          </Panel>
        </>
      ) : (
        <Notice>Nothing parsed yet. Paste a VTT that uses standard cue timings.</Notice>
      )}
    </div>
  );
}

/* ============================== age & uptime ============================= */

export function AgeTool() {
  const [dob, setDob] = useState("");
  const [from, setFrom] = useState("");
  const [mountedAt] = useState(() => Date.now());

  const reference = useMemo(() => {
    if (!from) return mountedAt;
    const parsed = new Date(from).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }, [from, mountedAt]);

  const result = useMemo(() => {
    if (!dob) return null;
    try {
      const birth = parseDateInput(dob);
      if (reference === null) return null;
      const stats = ageStats(birth, new Date(reference));
      return {
        years: stats.years,
        months: stats.months,
        days: stats.days,
        hours: Math.floor((stats.totalMs % 86_400_000) / 3_600_000),
        minutes: Math.floor((stats.totalMs % 3_600_000) / 60_000),
        seconds: Math.floor((stats.totalMs % 60_000) / 1000),
        totalDays: stats.totalDays,
        totalWeeks: stats.totalWeeks,
        totalMonths: stats.totalMonths,
        weekday: stats.weekday,
        zodiac: stats.zodiac,
        bornOn: stats.bornOn,
        nextBirthdayInDays: stats.nextBirthdayInDays,
      };
    } catch {
      return { invalid: true as const };
    }
  }, [dob, reference]);

  const countdown = useMemo(() => {
    if (!dob || reference === null) return null;
    const target = new Date(dob).getTime();
    if (Number.isNaN(target)) return null;
    const remaining = target - reference;
    return remaining >= 0
      ? {
          total: remaining,
          days: Math.floor(remaining / 86400000),
          hours: Math.floor((remaining % 86400000) / 3600000),
          minutes: Math.floor((remaining % 3600000) / 60000),
          seconds: Math.floor((remaining % 60000) / 1000),
        }
      : null;
  }, [dob, reference]);

  const pad = (value: number, size = 2) => String(value).padStart(size, "0");

  return (
    <div className="stack">
      <Panel title="Date" icon="clock">
        <Field label="Date of birth">
          <TextInput value={dob} onChange={setDob} type="date" />
        </Field>
      </Panel>

      {result && "invalid" in result ? (
        <Notice variant="warn">That date is in the future compared to the reference time.</Notice>
      ) : null}

      {result && !("invalid" in result) ? (
        <Panel title="Age" icon="clock">
          <div className="stat-row">
            <StatBox label="years" value={result.years} />
            <StatBox label="months" value={result.months} />
            <StatBox label="days" value={result.days} />
            <StatBox label="hours" value={result.hours} />
            <StatBox label="minutes" value={result.minutes} />
            <StatBox label="seconds" value={result.seconds} />
          </div>
          <Output>
            {`${result.years} years, ${result.months} months, ${result.days} days, ${result.hours} hours, ${result.minutes} minutes and ${result.seconds} seconds`}
          </Output>
          <div className="btn-row">
            <CopyButton
              value={() => `${result.years} years, ${result.months} months, ${result.days} days`}
              label="Copy short"
            />
            <CopyButton
              value={() => `${result.totalDays.toLocaleString()} days old`}
              label="Copy total days"
            />
          </div>
          <Rows>
            <Row k="Total days" v={result.totalDays.toLocaleString()} />
            <Row k="Total weeks" v={result.totalWeeks.toLocaleString()} />
            <Row k="Total months" v={result.totalMonths.toLocaleString()} />
            <Row k="Born on a" v={result.weekday} />
            <Row k="Zodiac" v={result.zodiac} />
            <Row k="Next birthday" v={`in ${result.nextBirthdayInDays} days`} />
          </Rows>
        </Panel>
      ) : null}

      {countdown ? (
        <Panel title="Time until" icon="timer">
          <div className="preview-frame" style={{ textAlign: "center" }}>
            <div className="mono" style={{ fontSize: 46, fontWeight: 700 }}>
              {`${pad(countdown.days)}d ${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)}`}
            </div>
          </div>
          <Rows>
            <Row k="Total days" v={countdown.days} />
            <Row k="Discord timestamp" v={`<t:${Math.floor(new Date(dob).getTime() / 1000)}:R>`} copyable />
          </Rows>
        </Panel>
      ) : null}

      <Panel title="Reference time" icon="clock" hint="Both tools above use this as now.">
        <Field
          label="Count from"
          hint="Leave empty to use the moment this page loaded."
        >
          <TextInput value={from} onChange={setFrom} type="datetime-local" />
        </Field>
        <Rows>
          <Row k="Now" v={new Date(mountedAt).toLocaleString()} />
          <Row
            k="Using"
            v={from ? new Date(from).toLocaleString() : "the real current time"}
          />
        </Rows>
        {from ? (
          <button className="btn btn--sm" onClick={() => setFrom("")}>
            <Icon name="refresh" size={13} /> Use the real current time
          </button>
        ) : null}
      </Panel>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-tile">
      <div className="stat-tile__label">{label}</div>
      <div className="stat-tile__value mono">{value}</div>
    </div>
  );
}
