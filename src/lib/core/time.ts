/** Time formatting shared by the browser tools and the public API. */

export function parseVttTime(value: string): number {
  const match = value
    .trim()
    .match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?$/);
  if (!match) return 0;
  const [, hours, minutes, seconds, ms] = match;
  return (
    (hours ? Number(hours) : 0) * 3600 +
    Number(minutes) * 60 +
    Number(seconds) +
    (ms ? Number(`0.${ms}`) : 0)
  );
}

export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Full age breakdown, in the same shape the Age Tool shows.
 *
 * Averages use 30.436875 days per month and 365.2425 days per year, which is the mean
 * Gregorian month and year, so the numbers do not drift against a calendar.
 */
export interface AgeStats {
  birthIso: string;
  referenceIso: string;
  totalMs: number;
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  totalHours: number;
  totalMinutes: number;
  leapDays: number;
  nextBirthdayInDays: number;
  weekday: string;
  bornOn: string;
  zodiac: string;
}

const MS_DAY = 86_400_000;
const DAYS_PER_MONTH = 30.436875;

export function parseDateInput(value: string): Date {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Provide a date.");

  // Bare yyyy-mm-dd is read as UTC so the result does not depend on the machine timezone.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    const parsed = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    if (Number.isNaN(parsed.getTime())) throw new Error("That date does not exist.");
    return parsed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Use YYYY-MM-DD, or an ISO timestamp.");
  }
  return parsed;
}

export function ageStats(birth: Date, reference: Date): AgeStats {
  if (birth.getTime() > reference.getTime()) {
    throw new Error("The birth date is after the reference date.");
  }

  const totalMs = reference.getTime() - birth.getTime();
  const totalDays = Math.floor(totalMs / MS_DAY);

  let years = reference.getUTCFullYear() - birth.getUTCFullYear();
  let months = reference.getUTCMonth() - birth.getUTCMonth();
  let days = reference.getUTCDate() - birth.getUTCDate();

  if (days < 0) {
    months -= 1;
    days += new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 0)).getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const nextBirthday = new Date(
    Date.UTC(reference.getUTCFullYear(), birth.getUTCMonth(), birth.getUTCDate()),
  );
  if (nextBirthday.getTime() < reference.getTime()) {
    nextBirthday.setUTCFullYear(nextBirthday.getUTCFullYear() + 1);
  }

  return {
    birthIso: birth.toISOString(),
    referenceIso: reference.toISOString(),
    totalMs,
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalMonths: Math.floor(totalDays / DAYS_PER_MONTH),
    totalHours: Math.floor(totalMs / 3_600_000),
    totalMinutes: Math.floor(totalMs / 60_000),
    leapDays: Math.floor((reference.getUTCFullYear() - birth.getUTCFullYear()) / 4),
    nextBirthdayInDays: Math.ceil((nextBirthday.getTime() - reference.getTime()) / MS_DAY),
    weekday: birth.toUTCString().slice(0, 3),
    bornOn: birth.toISOString().slice(0, 10),
    zodiac: zodiacFor(birth),
  };
}

const ZODIAC: [string, number, number][] = [
  ["Capricorn", 12, 22],
  ["Aquarius", 1, 20],
  ["Pisces", 2, 19],
  ["Aries", 3, 21],
  ["Taurus", 4, 20],
  ["Gemini", 5, 21],
  ["Cancer", 6, 21],
  ["Leo", 7, 23],
  ["Virgo", 8, 23],
  ["Libra", 9, 23],
  ["Scorpio", 10, 23],
  ["Sagittarius", 11, 22],
];

export function zodiacFor(date: Date): string {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const matches = ZODIAC.filter(([, m, start]) => month === m && day >= start);
  if (matches.length > 0) return matches[0][0];
  return month === 12 ? "Capricorn" : "Sagittarius";
}
