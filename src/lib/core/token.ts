/**
 * Structural token inspection.
 *
 * A token is never sent anywhere. Only the shape of the three segments is read, which is
 * the same thing the browser tool does, so both stay in sync automatically.
 */

import { decodeBase64Url } from "../codecs";

export interface TokenShape {
  userId: string;
  issuedAt: Date | null;
  issuedAtIso: string | null;
  segments: string[];
  valid: boolean;
  error?: string;
}

export function inspectToken(token: string): TokenShape {
  const trimmed = token.trim();
  const segments = trimmed.split(".");

  if (segments.length !== 3) {
    return {
      userId: "",
      issuedAt: null,
      issuedAtIso: null,
      segments,
      valid: false,
      error: `A token has 3 dot-separated segments. This one has ${segments.length}.`,
    };
  }

  let userId = "";
  let issuedAt: Date | null = null;
  let error: string | undefined;

  try {
    const decoded = decodeBase64Url(segments[0]);
    userId = decoded.trim();
    if (!/^\d{17,20}$/.test(userId)) {
      error = "First segment did not decode to a numeric user ID.";
    }
  } catch {
    error = "First segment is not valid Base64url.";
  }

  try {
    const stamp = decodeBase64Url(segments[1]).trim();
    const ms = Number(stamp);
    if (Number.isFinite(ms) && ms > 0) {
      issuedAt = new Date(ms);
    } else {
      error = error ?? "Second segment is not a readable timestamp.";
    }
  } catch {
    error = error ?? "Second segment is not valid Base64url.";
  }

  return {
    userId,
    issuedAt,
    issuedAtIso: issuedAt ? issuedAt.toISOString() : null,
    segments,
    valid: !error,
    ...(error ? { error } : {}),
  };
}

/** Replaces the signature with bullets so nothing sensitive can be copied by accident. */
export function maskToken(token: string): string {
  return token
    .trim()
    .split(".")
    .map((segment, index) =>
      index === 2 ? "\u2022".repeat(Math.min(40, segment.length)) : segment,
    )
    .join(".");
}
