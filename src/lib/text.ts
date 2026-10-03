const ZALGO_UP = [
  "\u0300", "\u0301", "\u0302", "\u0303", "\u0304", "\u0305", "\u0306",
  "\u0307", "\u0308", "\u0309", "\u030a", "\u030b", "\u030c", "\u030d",
  "\u030e", "\u030f", "\u0310", "\u0312", "\u0313", "\u0314", "\u0342",
  "\u0343", "\u0344", "\u0345",
];

const ZALGO_MID = [
  "\u031b", "\u031c", "\u031d", "\u031e", "\u031f", "\u0320", "\u0321",
  "\u0322", "\u0325", "\u0326", "\u0327", "\u0328", "\u0329", "\u032a",
  "\u032b", "\u032c", "\u032d", "\u032e", "\u032f", "\u0330", "\u0331",
  "\u0339", "\u033a", "\u033b", "\u033c",
];

const ZALGO_DOWN = [
  "\u0323", "\u0324", "\u0327", "\u0328", "\u0329", "\u032a", "\u032b",
  "\u032c", "\u032d", "\u032e", "\u032f", "\u0330", "\u0331", "\u0332",
  "\u0333", "\u0334", "\u0335", "\u0336", "\u0337", "\u0338", "\u033b",
  "\u033c", "\u0345",
];

export type ZalgoMode = "up" | "down" | "middle" | "random" | "all";

export function zalgo(text: string, mode: ZalgoMode = "random", amount = 1): string {
  const pick = (): string => {
    if (mode === "up") return ZALGO_UP[Math.floor(Math.random() * ZALGO_UP.length)];
    if (mode === "down") return ZALGO_DOWN[Math.floor(Math.random() * ZALGO_DOWN.length)];
    if (mode === "middle") return ZALGO_MID[Math.floor(Math.random() * ZALGO_MID.length)];
    if (mode === "all") {
      const all = [...ZALGO_UP, ...ZALGO_MID, ...ZALGO_DOWN];
      return all[Math.floor(Math.random() * all.length)];
    }
    const groups = [ZALGO_UP, ZALGO_MID, ZALGO_DOWN];
    const group = groups[Math.floor(Math.random() * groups.length)];
    return group[Math.floor(Math.random() * group.length)];
  };

  const level = Math.max(1, Math.min(8, amount));
  return Array.from(text)
    .map((char) => {
      if (!char.trim()) return char;
      let out = "";
      for (let i = 0; i < level; i++) out += pick();
      return char + out;
    })
    .join("");
}

function rangeMap(start: number, chars: string): Map<string, string> {
  const map = new Map<string, string>();
  Array.from(chars).forEach((char, index) => {
    map.set(char, String.fromCodePoint(start + index));
  });
  return map;
}

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";

type FontTable = Record<string, Map<string, string>>;

function buildFonts(): FontTable {
  const bold = new Map([
    ...rangeMap(0x1d5d4, UPPER),
    ...rangeMap(0x1d5ee, LOWER),
    ...rangeMap(0x1d7ec, DIGITS),
  ]);

  const italic = new Map([
    ...rangeMap(0x1d608, UPPER),
    ...rangeMap(0x1d622, LOWER),
  ]);

  const boldItalic = new Map([
    ...rangeMap(0x1d63c, UPPER),
    ...rangeMap(0x1d656, LOWER),
  ]);

  const script = new Map([
    ...rangeMap(0x1d49c, UPPER),
    ...rangeMap(0x1d4b6, LOWER),
  ]);

  const fraktur = new Map([
    ...rangeMap(0x1d504, UPPER),
    ...rangeMap(0x1d51e, LOWER),
  ]);

  const frakturSmall = new Map([
    ...rangeMap(0x1d504, UPPER),
    ...rangeMap(0x1d56c, LOWER),
  ]);

  const doubleStruck = new Map([
    ...rangeMap(0x1d538, UPPER),
    ...rangeMap(0x1d552, LOWER),
    ...rangeMap(0x1d7d8, DIGITS),
  ]);

  const monospace = new Map([
    ...rangeMap(0x1d670, UPPER),
    ...rangeMap(0x1d68a, LOWER),
    ...rangeMap(0x1d7f6, DIGITS),
  ]);

  const circled = new Map([
    ...rangeMap(0x24b6, UPPER),
    ...rangeMap(0x24d0, LOWER),
    ...rangeMap(0x24ea, DIGITS),
  ]);

  const squared = new Map([
    ...rangeMap(0x1f130, UPPER),
    ...rangeMap(0x1f150, LOWER),
  ]);

  const fullwidth = new Map([
    ...rangeMap(0xff21, UPPER),
    ...rangeMap(0xff41, LOWER),
    ...rangeMap(0xff10, DIGITS),
  ]);

  const sansBold = bold;
  const sansPlain = new Map([
    ...rangeMap(0x1d5a0, UPPER),
    ...rangeMap(0x1d5ba, LOWER),
    ...rangeMap(0x1d7e2, DIGITS),
  ]);

  const sansItalicPlain = italic;
  const sansBoldItalicPlain = boldItalic;
  const sansSerif = sansPlain;

  return {
    bold,
    italic,
    boldItalic,
    script,
    fraktur,
    frakturSmall,
    doubleStruck,
    monospace,
    circled,
    squared,
    fullwidth,
    sansBold,
    sansPlain,
    sansItalicPlain,
    sansBoldItalicPlain,
    sansSerif,
  };
}

export const FONTS = buildFonts();

export type StyleName = keyof typeof FONTS;

export const STYLE_OPTIONS: { id: StyleName; label: string }[] = [
  { id: "bold", label: "Bold" },
  { id: "italic", label: "Italic" },
  { id: "boldItalic", label: "Bold Italic" },
  { id: "script", label: "Script" },
  { id: "fraktur", label: "Fraktur" },
  { id: "frakturSmall", label: "Fraktur Small" },
  { id: "doubleStruck", label: "Double Struck" },
  { id: "monospace", label: "Monospace" },
  { id: "circled", label: "Circled" },
  { id: "squared", label: "Squared" },
  { id: "fullwidth", label: "Fullwidth" },
];

export function applyFont(text: string, style: StyleName): string {
  const table = FONTS[style];
  if (!table) return text;
  let out = "";
  for (const char of text) {
    out += table.get(char) ?? (style === "circled" && !table.get(char) ? char : char);
  }
  return out;
}

const SUPERSCRIPT: Record<string, string> = {
  a: "\u1d43", b: "\u1d47", c: "\u1d9c", d: "\u1d48", e: "\u1d49",
  f: "\u1da0", g: "\u1d4d", h: "\u02b0", i: "\u2071", j: "\u02b2",
  k: "\u1d4f", l: "\u02e1", m: "\u1d50", n: "\u207f", o: "\u1d52",
  p: "\u1d56", r: "\u02b3", s: "\u02e2", t: "\u1d57", u: "\u1d58",
  v: "\u1d5b", w: "\u02b7", x: "\u02e3", y: "\u02b8", z: "\u1dbb",
  A: "\u1d2c", B: "\u1d2e", C: "\u1d30", D: "\u1d31", E: "\u1d32",
  F: "\u1d33", G: "\u1d34", H: "\u1d35", I: "\u1d36", J: "\u1d37",
  K: "\u1d38", L: "\u1d39", M: "\u1d3a", N: "\u1d3b", O: "\u1d3c",
  P: "\u1d3d", Q: "\u1d3e", R: "\u1d3f", S: "\u1d40", T: "\u1d41",
  U: "\u1d42", V: "\u1d43", W: "\u1d44", X: "\u1d45", Y: "\u1d46",
  0: "\u2070", 1: "\u00b9", 2: "\u00b2", 3: "\u00b3", 4: "\u2074",
  5: "\u2075", 6: "\u2076", 7: "\u2077", 8: "\u2078", 9: "\u2079",
  "+": "\u207a", "-": "\u207b", "=": "\u207c", "(": "\u207d", ")": "\u207e",
};

const SUBSCRIPT: Record<string, string> = {
  a: "\u2090", b: "\u1d66", c: "\u1d9c", d: "\u1d67", e: "\u2091",
  f: "\u1d68", g: "\u2091", h: "\u1d69", i: "\u1d62", j: "\u2c7c",
  k: "\u2096", l: "\u2097", m: "\u2098", n: "\u2099", o: "\u2092",
  p: "\u209a", q: "\u1d6a", r: "\u1d6b", s: "\u209b", t: "\u209c",
  u: "\u1d64", v: "\u1d65", w: "\u2098", x: "\u2093", y: "\u1d67",
  z: "\u1db5", 0: "\u2080", 1: "\u2081", 2: "\u2082", 3: "\u2083",
  4: "\u2084", 5: "\u2085", 6: "\u2086", 7: "\u2087", 8: "\u2088",
  9: "\u2089", "+": "\u208a", "-": "\u208b", "=": "\u207c",
  "(": "\u208d", ")": "\u208e",
};

export function toSuperscript(text: string): string {
  return Array.from(text)
    .map((char) => SUPERSCRIPT[char] ?? (char.trim() ? char : char))
    .join("");
}

export function toSubscript(text: string): string {
  return Array.from(text)
    .map((char) => SUBSCRIPT[char] ?? char)
    .join("");
}

const SMALL_CAPS: Record<string, string> = {
  a: "\u0250", b: "\u0183", c: "\u0254", d: "\u018c", e: "\u018e",
  f: "\u0192", g: "\u0262", h: "\u0275", i: "\u0130", j: "\u027c",
  k: "\u1d0f", l: "\u1d29", m: "\u026f", n: "\u1d31", o: "\u1d47",
  p: "\u1d3e", q: "\u0288", r: "\u1d63", s: "\u1d5d", t: "\u1d6d",
  u: "\u1d65", v: "\u1d6f", w: "\u1d72", x: "\u1d8a", y: "\u028f",
  z: "\u1d9b",
};

export function toSmallCaps(text: string): string {
  return Array.from(text)
    .map((char) => SMALL_CAPS[char] ?? char.toUpperCase())
    .join("");
}

const ACCENT_MAP: Record<string, string> = {
  a: "\u0304", e: "\u0301", i: "\u0302", o: "\u0300", u: "\u0306",
  n: "\u0303", c: "\u0327", s: "\u032c", z: "\u030c", y: "\u0308",
  A: "\u0304", E: "\u0301", I: "\u0302", O: "\u0300", U: "\u0306",
};

export function toAccents(text: string): string {
  return Array.from(text)
    .map((char) => {
      const accent = ACCENT_MAP[char];
      return accent ? char + accent : char;
    })
    .join("");
}

export function toOutline(text: string): string {
  return Array.from(text)
    .map((char) => (char.trim() ? `${char}\u0336` : char))
    .join("");
}

export function toStrikethrough(text: string): string {
  return Array.from(text)
    .map((char) => (char.trim() ? `${char}\u0336` : char))
    .join("");
}

export function toSpaced(text: string): string {
  return Array.from(text).join(" ");
}

export function spoilerEachLine(text: string): string {
  return text
    .split("\n")
    .map((line) => (line.trim() ? `||${line}||` : line))
    .join("\n");
}

export function spoilerEachChar(text: string): string {
  return Array.from(text)
    .map((char) => (char.trim() ? `||${char}||` : char))
    .join("");
}

export const DIVIDERS: { label: string; value: string }[] = [
  { label: "Thin", value: "\u2500".repeat(40) },
  { label: "Double", value: "\u2550".repeat(30) },
  { label: "Heavy", value: "\u2501".repeat(40) },
  { label: "Dotted", value: "\u00b7 ".repeat(40) },
  { label: "Dashed", value: "\u2504 ".repeat(30) },
  { label: "Wave", value: "\u3030".repeat(30) },
  { label: "Equals", value: "\u2550".repeat(20) },
  { label: "Single line, short", value: "\u2500".repeat(20) },
  { label: "Solid block", value: "\u2588".repeat(20) },
  { label: "Shade", value: "\u2591".repeat(30) },
  { label: "Blocks", value: "\u2588\u2591\u2584\u2592\u2586".repeat(8) },
  { label: "Arrows", value: "\u27f6".repeat(20) },
  { label: "Hearts", value: "\u2665".repeat(20) },
  { label: "Stars", value: "\u2605".repeat(20) },
  { label: "Diamond", value: "\u25c6".repeat(20) },
  { label: "Slash", value: "\u2571".repeat(40) },
  { label: "Backslash", value: "\u2572".repeat(40) },
  { label: "Checkers", value: "\u2596\u2597".repeat(20) },
  { label: "Circles", value: "\u25cf\u25cb".repeat(20) },
  { label: "Corner", value: "\u256d".repeat(20) },
];

export function buildDivider(char: string, length: number): string {
  return char.repeat(Math.max(1, length));
}

export function escapeSpoiler(text: string): string {
  return text.replaceAll("||", "||||");
}

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  uniqueWords: number;
  readingSeconds: number;
  speakingSeconds: number;
}

export function analyzeText(text: string): TextStats {
  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean) : [];
  const normalized = text.trim();
  return {
    characters: Array.from(text).length,
    charactersNoSpaces: Array.from(text).filter((c) => !/\s/.test(c)).length,
    words: words.length,
    sentences: normalized ? normalized.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim()).length : 0,
    paragraphs: normalized ? normalized.split(/\n\s*\n/).filter((p) => p.trim()).length : 0,
    lines: text ? text.split("\n").length : 0,
    uniqueWords: new Set(words.map((w) => w.toLowerCase())).size,
    readingSeconds: Math.round(words.length / 225),
    speakingSeconds: Math.round(words.length / 2.6),
  };
}

export function titleCase(text: string): string {
  return text.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

export function reverseText(text: string): string {
  return Array.from(text).reverse().join("");
}