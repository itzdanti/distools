/**
 * Permission bit maths.
 *
 * `PERMISSIONS` stores bits as bigint because that is what the bitwise maths needs, but
 * bigint cannot be serialised to JSON. Everything leaving this module goes through
 * `serializePermissions`, which is also what the public API returns.
 */

import {
  PERMISSIONS,
  PERMISSION_CATEGORIES,
  permissionToBinary,
  permissionToDecimal,
  permissionToHex,
  type PermissionDef,
} from "../discordData";

export interface SerializedPermission extends Omit<PermissionDef, "bit"> {
  bit: string;
}

export function serializePermissions(): SerializedPermission[] {
  return PERMISSIONS.map(({ bit, ...rest }) => ({ ...rest, bit: bit.toString() }));
}

export class PermissionError extends Error {}

/**
 * Reduces a name to a comparable key, so "Send Messages", "send_messages",
 * "SEND-MESSAGES" and "sendmessages" all resolve to the same permission.
 */
function permissionKey(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function bitsFromNames(names: string[]): bigint {
  const lookup = new Map<string, bigint>();
  for (const permission of PERMISSIONS) {
    lookup.set(permissionKey(permission.name), permission.bit);
    const underscored = permission.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    lookup.set(underscored, permission.bit);
  }

  return names.reduce((total, name) => {
    const bit = lookup.get(permissionKey(name));
    if (bit === undefined) {
      throw new PermissionError(
        `"${name}" is not a Discord permission name. Use the name from /api/v1/permissions/all, such as "Send Messages" or "send_messages".`,
      );
    }
    return total | bit;
  }, 0n);
}

export function namesFromBits(bits: bigint): string[] {
  return PERMISSIONS.filter((permission) => (bits & permission.bit) === permission.bit).map(
    (permission) => permission.name,
  );
}

/** Positions of bits Discord has that this table does not name. */
export function unknownBitPositions(bits: bigint): number[] {
  const known = PERMISSIONS.reduce((total, permission) => total | permission.bit, 0n);
  const extra = bits & ~known;
  if (extra === 0n) return [];
  return Array.from({ length: 53 }, (_, index) => index).filter(
    (index) => (extra & (1n << BigInt(index))) !== 0n,
  );
}

/** Unknown bits as labels, for the API and the docs. */
export function unknownBits(bits: bigint): string[] {
  return unknownBitPositions(bits).map((index) => `bit ${index}`);
}

export function parseInteger(raw: string | number | bigint): bigint {
  const text = String(raw).trim();
  if (!text) throw new PermissionError("Enter a permission integer first.");
  try {
    if (/^-?0x[0-9a-f]+$/i.test(text)) return BigInt(text);
    if (/^-?0b[01]+$/i.test(text)) return BigInt(text);
    if (/^-?\d+$/.test(text)) return BigInt(text);
  } catch {
    /* fall through to the shared error */
  }
  throw new PermissionError(
    "A permission integer is decimal, 0x hex or 0b binary. Nothing else.",
  );
}

export interface PermissionSummary {
  names: string[];
  integer: string;
  hex: string;
  binary: string;
  count: number;
  administrator: boolean;
  unknownBits: string[];
  categories: Record<string, string[]>;
}

export function summarize(bits: bigint): PermissionSummary {
  const names = namesFromBits(bits);
  const categories: Record<string, string[]> = {};
  for (const category of PERMISSION_CATEGORIES) {
    const inCategory = PERMISSIONS.filter(
      (permission) => permission.category === category && names.includes(permission.name),
    ).map((permission) => permission.name);
    if (inCategory.length > 0) categories[category] = inCategory;
  }

  return {
    names,
    integer: permissionToDecimal(bits),
    hex: permissionToHex(bits),
    binary: permissionToBinary(bits),
    count: names.length,
    administrator: names.includes("Administrator"),
    unknownBits: unknownBits(bits),
    categories,
  };
}
