import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { copyText } from "../lib/clipboard";

/* --------------------------------- icons --------------------------------- */

export type IconName =
  | "search" | "menu" | "close" | "copy" | "check" | "refresh" | "download"
  | "upload" | "play" | "alert" | "info" | "wand" | "hash" | "user" | "users"
  | "link" | "code" | "palette" | "lock" | "clock" | "image" | "star"
  | "chevron" | "external" | "shield" | "grid" | "type" | "zap" | "gift"
  | "sun" | "eye" | "tool" | "book" | "volume" | "timer" | "key"
  | "scissors" | "crop" | "dice" | "trash" | "send";

const PATHS: Record<IconName, string> = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35",
  menu: "M3 6h18M3 12h18M3 18h18",
  close: "M18 6 6 18M6 6l12 12",
  copy: "M9 9h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1ZM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1",
  check: "m20 6-11 11-5-5",
  refresh: "M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5",
  download: "M12 3v12m0 0 4-4m-4 4-4-4M4 19h16",
  upload: "M12 16V4m0 0L8 8m4-4 4 4M4 19h16",
  play: "M6 4.5v15l13-7.5-13-7.5Z",
  alert: "M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  info: "M12 16v-4m0-4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
  wand: "m3 21 12-12m0 0 3-3-3-3m3 3-9.5 9.5M9 4v2m0 12v2m-6-8H1m22 0h-2M4.9 7.9 3.5 6.5m17 11 1.4 1.4M4.9 18.1l-1.4 1.4",
  hash: "M4 9h16M4 15h16M10 3 8 21M16 3l-2 18",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  link: "M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7",
  code: "m16 18 6-6-6-6M8 6l-6 6 6 6",
  palette: "M12 2a10 10 0 1 0 0 20 2 2 0 0 0 1.6-3.2 2 2 0 0 1 1.6-3.2H18a4 4 0 0 0 4-4 10 10 0 0 0-10-9.6ZM7.5 10.5h.01M12 7.5h.01M16.5 10.5h.01",
  lock: "M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1ZM8 11V7a4 4 0 1 1 8 0v4",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2",
  image: "M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6",
  star: "m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21.1 7 14.2l-5-4.9 6.9-1L12 2Z",
  chevron: "m9 6 6 6-6 6",
  external: "M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  type: "M4 7V4h16v3M9 20h6M12 4v16",
  zap: "M13 2 3 14h9l-1 8 10-12h-9l1-8Z",
  gift: "M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7ZM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  eye: "M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  tool: "M14.7 6.3a4 4 0 0 0 5 5l-9 9a2.8 2.8 0 1 1-4-4l9-9Z",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5V6a2 2 0 0 1 2-2h14v15H6.5A2.5 2.5 0 0 0 4 19.5ZM8 8h8",
  volume: "M11 5 6 9H2v6h4l5 4V5ZM19.1 4.9a10 10 0 0 1 0 14.2M15.5 8.5a5 5 0 0 1 0 7",
  timer: "M12 22a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 13v-4M9 2h6",
  key: "M15.5 2a6.5 6.5 0 0 0-6.2 8.5L2 18v3h3l1-1v-2h2v-2h2l1.3-1.3A6.5 6.5 0 1 0 15.5 2ZM17.5 6.5h.01",
  scissors: "M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12",
  crop: "M6 2v16a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14",
  dice: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM8.5 8.5h.01M15.5 15.5h.01M12 12h.01",
  trash: "M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z",
};

export function Icon({
  name,
  size = 16,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/* --------------------------------- toast --------------------------------- */

interface Toast {
  id: number;
  message: string;
  kind: "ok" | "error";
}

const ToastContext = createContext<(message: string, kind?: "ok" | "error") => void>(
  () => undefined,
);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const push = useCallback((message: string, kind: "ok" | "error" = "ok") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2200);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-host" aria-live="polite">
        {toasts.map((toast) => (
          <div className="toast" key={toast.id}>
            <Icon
              name={toast.kind === "ok" ? "check" : "alert"}
              size={14}
              className={toast.kind === "ok" ? "" : "danger"}
            />
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

/* ------------------------------- copy button ----------------------------- */

export function CopyButton({
  value,
  label = "Copy",
  size = "sm",
  silent = false,
  iconOnly = false,
}: {
  value: string | (() => string);
  label?: string;
  size?: "sm" | "md";
  silent?: boolean;
  iconOnly?: boolean;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const handle = async () => {
    const text = typeof value === "function" ? value() : value;
    if (!text) {
      toast("Nothing to copy yet", "error");
      return;
    }
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      if (!silent) toast("Copied to clipboard");
      setTimeout(() => setCopied(false), 1400);
    } else {
      toast("Could not access the clipboard", "error");
    }
  };

  const iconOnlyStyle = size === "sm" ? "btn btn--sm btn--icon" : "btn btn--icon";

  if (iconOnly) {
    return (
      <button
        type="button"
        className={iconOnlyStyle}
        onClick={handle}
        title={copied ? "Copied" : label}
        aria-label={copied ? "Copied" : label}
      >
        <Icon name={copied ? "check" : "copy"} size={size === "sm" ? 13 : 15} />
      </button>
    );
  }

  return (
    <button type="button" className={`btn ${size === "sm" ? "btn--sm" : ""}`} onClick={handle}>
      <Icon name={copied ? "check" : "copy"} size={size === "sm" ? 13 : 15} />
      {copied ? "Copied" : label}
    </button>
  );
}

/* --------------------------------- fields -------------------------------- */

export function Field({
  label,
  hint,
  children,
  htmlFor,
  action,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
  action?: ReactNode;
}) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={htmlFor}>
        {label}
        {action ? (
          <>
            <span className="spacer" style={{ flex: 1 }} />
            {action}
          </>
        ) : null}
      </label>
      {children}
      {hint ? <div className="field__hint">{hint}</div> : null}
    </div>
  );
}

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  mono?: boolean;
  type?: string;
  disabled?: boolean;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  list?: string;
  inputMode?: "text" | "numeric" | "decimal" | "search" | "email" | "tel" | "url";
  min?: number;
  max?: number;
  step?: number;
}

export function TextInput({
  value,
  onChange,
  placeholder,
  id,
  mono,
  type = "text",
  disabled,
  onKeyDown,
  autoFocus,
  list,
  inputMode,
  min,
  max,
  step,
}: TextInputProps) {
  return (
    <input
      id={id}
      className={`input ${mono ? "input--code" : ""}`}
      type={type}
      value={value}
      inputMode={inputMode}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      disabled={disabled}
      list={list}
      autoFocus={autoFocus}
      spellCheck={false}
      autoComplete="off"
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
    />
  );
}

interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  rows?: number;
  mono?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
}

export function TextArea({
  value,
  onChange,
  placeholder,
  id,
  rows = 4,
  mono,
  readOnly,
  autoFocus,
}: TextAreaProps) {
  return (
    <textarea
      id={id}
      className={`textarea ${mono ? "textarea--code" : ""}`}
      rows={rows}
      value={value}
      placeholder={placeholder}
      readOnly={readOnly}
      autoFocus={autoFocus}
      spellCheck={false}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  id,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  id?: string;
}) {
  return (
    <select
      id={id}
      className="select"
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="checkbox">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
}) {
  return (
    <div className="field">
      {label ? (
        <div className="field__label">
          {label}
          <span className="faint mono" style={{ marginLeft: "auto", fontSize: 12 }}>
            {value}
          </span>
        </div>
      ) : null}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ width: "100%", accentColor: "var(--accent-dim)" }}
      />
    </div>
  );
}

/* --------------------------------- panels -------------------------------- */

export function Panel({
  title,
  icon,
  action,
  children,
  hint,
  bodyless = false,
  className,
}: {
  title: ReactNode;
  icon?: IconName;
  action?: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
  bodyless?: boolean;
  className?: string;
}) {
  return (
    <section className={className ? `panel ${className}` : "panel"}>
      <div className="panel__head">
        {icon ? <Icon name={icon} size={15} /> : null}
        <h2>{title}</h2>
        <span className="spacer" />
        {action}
      </div>
      {bodyless ? children : <div className="panel__body">{children}</div>}
      {hint ? <div className="panel__foot">{hint}</div> : null}
    </section>
  );
}

export function Output({
  children,
  placeholder,
  error,
}: {
  children: ReactNode;
  placeholder?: string;
  error?: boolean;
}) {
  return (
    <div
      className={`output ${error ? "output--error" : ""}`}
      data-placeholder={placeholder ?? "Output appears here"}
    >
      {children}
    </div>
  );
}

export function Notice({
  children,
  variant = "info",
  icon,
}: {
  children: ReactNode;
  variant?: "info" | "warn" | "danger" | "ok";
  icon?: IconName;
}) {
  const fallback: Record<string, IconName> = {
    info: "info",
    warn: "alert",
    danger: "shield",
    ok: "check",
  };
  return (
    <div className={`notice ${variant !== "info" ? `notice--${variant}` : ""}`}>
      <Icon name={icon ?? fallback[variant]} size={15} />
      <div>{children}</div>
    </div>
  );
}

export function StatTile({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="stat-tile">
      <div className="stat-tile__label">{label}</div>
      <div className="stat-tile__value">{value}</div>
    </div>
  );
}

export function Row({
  k,
  v,
  copyable = false,
}: {
  k: ReactNode;
  v: ReactNode;
  copyable?: boolean;
}) {
  const text = typeof v === "string" ? v : undefined;
  return (
    <div className="row">
      <span className="row__key">{k}</span>
      <span className="row__val">{v}</span>
      {copyable && text ? <CopyButton value={text} iconOnly silent /> : null}
    </div>
  );
}

export function Rows({ children }: { children: ReactNode }) {
  return <div className="rows">{children}</div>;
}

export function Tabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
}) {
  return (
    <div className="tabs" role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          className={`tab ${option.value === value ? "is-active" : ""}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Chips<T extends string>({
  value,
  onChange,
  options,
  allowEmpty = false,
}: {
  value: T[];
  onChange: (value: T[]) => void;
  options: readonly { value: T; label: string }[];
  allowEmpty?: boolean;
}) {
  const toggle = (item: T) => {
    if (value.includes(item)) {
      if (value.length > 1 || !allowEmpty) {
        if (value.length > 1) onChange(value.filter((entry) => entry !== item));
        return;
      }
      onChange([]);
      return;
    }
    onChange([...value, item]);
  };

  return (
    <div className="chip-row">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`chip ${value.includes(option.value) ? "is-active" : ""}`}
          onClick={() => toggle(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ResultList({
  items,
  empty = "Nothing generated yet.",
  onCopy,
}: {
  items: string[];
  empty?: string;
  onCopy?: (value: string) => void;
}) {
  const toast = useToast();
  if (items.length === 0) {
    return <div className="empty-state">{empty}</div>;
  }
  return (
    <div className="rows">
      {items.map((item, index) => (
        <div className="row" key={`${item}-${index}`}>
          <span className="mono" style={{ wordBreak: "break-all", minWidth: 0 }}>
            {item}
          </span>
          <span className="spacer" style={{ flex: 1 }} />
          <CopyButton value={item} iconOnly silent />
        </div>
      ))}
      {onCopy ? (
        <div className="row">
          <span className="faint small">
            {items.length} result{items.length === 1 ? "" : "s"}
          </span>
          <span className="spacer" style={{ flex: 1 }} />
          <button
            type="button"
            className="btn btn--sm"
            onClick={async () => {
              const ok = await copyText(items.join("\n"));
              toast(ok ? `Copied ${items.length} results` : "Copy failed", ok ? "ok" : "error");
            }}
          >
            <Icon name="copy" size={13} /> Copy all
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function Debounced({
  value,
  delay = 200,
  onChange,
}: {
  value: string;
  delay?: number;
  onChange: (value: string) => void;
}) {
  const [local, setLocal] = useState(value);
  const [lastSeen, setLastSeen] = useState(value);
  const callback = useRef(onChange);

  useEffect(() => {
    callback.current = onChange;
  });

  if (value !== lastSeen) {
    setLastSeen(value);
    setLocal(value);
  }

  useEffect(() => {
    if (local === value) return;
    const timer = setTimeout(() => callback.current(local), delay);
    return () => clearTimeout(timer);
  }, [local, delay, value]);

  return <TextArea value={local} onChange={setLocal} rows={6} mono />;
}

/** Wraps a computation that can throw, showing the error inline. */
export function useSafe<T>(fn: () => T, deps: unknown[]): { data: T | null; error: string | null } {
  return useMemo(() => {
    try {
      return { data: fn(), error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Something went wrong.",
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}