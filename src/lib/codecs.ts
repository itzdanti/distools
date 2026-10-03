export function encodeBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function decodeBase64(input: string): string {
  const clean = input.replace(/\s/g, "");
  if (!clean) throw new Error("Nothing to decode.");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) {
    throw new Error("That is not valid Base64. Allowed characters are A-Z a-z 0-9 + / and = padding.");
  }
  const padded = clean.padEnd(Math.ceil(clean.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function encodeBase64Url(input: string): string {
  return encodeBase64(input)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  return decodeBase64UrlSafe(normalized);
}

function decodeBase64UrlSafe(input: string): string {
  const padded = input.padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function encodeUrl(input: string): string {
  return encodeURIComponent(input);
}

export function decodeUrl(input: string): string {
  try {
    return decodeURIComponent(input.replace(/\+/g, " "));
  } catch {
    throw new Error("That is not a valid percent-encoded string.");
  }
}

export function encodeUrlComponentSafe(input: string): string {
  return encodeURIComponent(input).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}