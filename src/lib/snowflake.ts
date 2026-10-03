export const DISCORD_EPOCH = 1420070400000;

export interface SnowflakeInfo {
  id: string;
  timestamp: number;
  date: Date;
  workerId: number;
  processId: number;
  increment: number;
}

const SNOWFLAKE_RE = /^\d{17,20}$/;

export function isSnowflake(value: string): boolean {
  return SNOWFLAKE_RE.test(value.trim());
}

export function decodeSnowflake(raw: string): SnowflakeInfo {
  const id = raw.trim();
  if (!isSnowflake(id)) {
    throw new Error(
      "A Discord snowflake is 17-20 digits long, all numeric. Check the value and try again.",
    );
  }

  const value = BigInt(id);
  const timestamp = Number((value >> 22n) + BigInt(DISCORD_EPOCH));
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    throw new Error("That ID does not decode to a valid date.");
  }

  return {
    id,
    timestamp,
    date,
    workerId: Number((value & 0x3e0000n) >> 17n),
    processId: Number((value & 0x1f000n) >> 12n),
    increment: Number(value & 0xfffn),
  };
}

export function createSnowflake(
  date: Date,
  workerId = 1,
  processId = 0,
  increment = 0,
): string {
  const ms = BigInt(date.getTime());
  if (ms < BigInt(DISCORD_EPOCH)) {
    throw new Error("Date must be after 2015-01-01, the Discord epoch.");
  }
  if (increment < 0 || increment > 1023) {
    throw new Error("Increment must be between 0 and 1023.");
  }
  return (
    ((ms - BigInt(DISCORD_EPOCH)) << 22n) |
    (BigInt(workerId & 0x1f) << 17n) |
    (BigInt(processId & 0x1f) << 12n) |
    BigInt(increment & 0xff)
  ).toString();
}

export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function describeAge(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 0) return "in the future";

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"} ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 31) return `${days} day${days === 1 ? "" : "s"} ago`;

  const months = Math.floor(days / 30.44);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;

  const years = Math.floor(days / 365.25);
  const remMonths = Math.floor((days - years * 365.25) / 30.44);
  const yearPart = `${years} year${years === 1 ? "" : "s"}`;
  return remMonths > 0 ? `${yearPart}, ${remMonths} mo ago` : `${yearPart} ago`;
}