export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round = (n: number) => Math.round(n * 100) / 100;

function expandHex(hex: string): string {
  const clean = hex.replace(/^#/, "").trim();
  if (/^[0-9a-f]{3}$/i.test(clean)) {
    return clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return clean;
}

export function isHex(value: string): boolean {
  return /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(
    value.trim(),
  );
}

export function hexToRgb(hex: string): Rgb {
  const clean = expandHex(hex);
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(clean)) {
    throw new Error("Enter a hex color like #5865f2 or 5865f2.");
  }
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const hex = [r, g, b]
    .map((n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0"))
    .join("");
  return `#${hex}`;
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
  }

  return {
    h: round(((h % 360) + 360) % 360),
    s: round(s * 100),
    l: round(l * 100),
  };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const m = ln - c / 2;

  const table: [number, number, number][] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ];
  const [r, g, b] = table[Math.floor(hp) % 6];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function parseRgbString(input: string): Rgb {
  const match = input.match(/(-?\d+(?:\.\d+)?)/g);
  if (!match || match.length < 3) {
    throw new Error("Enter RGB values like 88, 101, 242.");
  }
  const [r, g, b] = match.slice(0, 3).map(Number);
  if ([r, g, b].some((n) => Number.isNaN(n))) {
    throw new Error("Enter RGB values like 88, 101, 242.");
  }
  return { r, g, b };
}

export function parseHslString(input: string): Hsl {
  const match = input.match(/(-?\d+(?:\.\d+)?)/g);
  if (!match || match.length < 3) {
    throw new Error("Enter HSL values like 235, 89, 65.");
  }
  const [h, s, l] = match.slice(0, 3).map(Number);
  if ([h, s, l].some((n) => Number.isNaN(n))) {
    throw new Error("Enter HSL values like 235, 89, 65.");
  }
  return { h, s, l };
}

export function toDecimal(hex: string): string {
  return String(parseInt(expandHex(hex).slice(0, 6), 16));
}

export function toDecimalSafe(hex: string): string {
  try {
    return toDecimal(hex);
  } catch {
    return "0";
  }
}

/**
 * Lightens or darkens a colour by a fraction between -1 and 1.
 *
 * Used to build the gradient bars in the colour tools. Negative amounts move toward black,
 * positive toward white, so the result stays inside the 0-255 range.
 */
export function shadeColor(hex: string, amount: number): string {
  if (!isHex(hex)) return "#888888";

  const { r, g, b } = hexToRgb(hex);
  const mix = (channel: number) =>
    Math.max(
      0,
      Math.min(255, Math.round(amount > 0 ? channel + (255 - channel) * amount : channel * (1 + amount))),
    );

  return `#${[mix(r), mix(g), mix(b)]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (v: number) => {
    const n = v / 255;
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastVerdict {
  ratio: number;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  bestText: string;
  bestTextHex: string;
}

export function contrastAgainst(hex: string): ContrastVerdict {
  const bg = hexToRgb(hex);
  const white: Rgb = { r: 255, g: 255, b: 255 };
  const black: Rgb = { r: 0, g: 0, b: 0 };
  const onWhite = contrastRatio(bg, white);
  const onBlack = contrastRatio(bg, black);
  const useWhite = onWhite >= onBlack;

  return {
    ratio: round(Math.max(onWhite, onBlack)),
    aaNormal: Math.max(onWhite, onBlack) >= 4.5,
    aaLarge: Math.max(onWhite, onBlack) >= 3,
    aaaNormal: Math.max(onWhite, onBlack) >= 7,
    bestText: useWhite ? "White text" : "Black text",
    bestTextHex: useWhite ? "#ffffff" : "#000000",
  };
}

export function luminanceLabel(hex: string): "Light" | "Mid" | "Dark" {
  try {
    const l = relativeLuminance(hexToRgb(hex));
    if (l > 0.45) return "Light";
    if (l > 0.08) return "Mid";
    return "Dark";
  } catch {
    return "Mid";
  }
}

export const ROLE_PALETTE = [
  "#5865f2", "#3ba55c", "#faa61a", "#ed4245", "#eb459e",
  "#9b59b6", "#1abc9c", "#e67e22", "#f1c40f", "#e74c3c",
  "#3498db", "#2ecc71", "#9c27b0", "#ff6b6b", "#4ecdc4",
  "#f9ca24", "#e17055", "#00b894", "#6c5ce7", "#fd79a8",
] as const;

export function randomHex(): string {
  const n = Math.floor(Math.random() * 0xffffff);
  return `#${n.toString(16).padStart(6, "0")}`;
}