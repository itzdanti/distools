/**
 * WebVTT parsing, shared by the caption tool and `POST /api/v1/vtt`.
 *
 * Cue timings come back as seconds so both callers format them their own way: the browser
 * renders `hh:mm:ss.mmm`, the API also returns the Discord soundboard shape.
 */

import { parseVttTime } from "./time";

export interface VttCue {
  index: number;
  start: number;
  end: number;
  text: string;
}

const TIMING =
  /(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{1,3})/;

export function parseVtt(input: string): VttCue[] {
  const cues: VttCue[] = [];

  for (const block of input.replace(/\r/g, "").split(/\n{2,}/)) {
    const lines = block.split("\n").filter((line) => line.trim().length > 0);
    if (lines.length === 0) continue;

    let cursor = 0;
    if (/^\d+$/.test(lines[0].trim())) cursor = 1;

    const timing = lines[cursor]?.match(TIMING);
    if (!timing) continue;

    cues.push({
      index: cues.length + 1,
      start: parseVttTime(timing[1]),
      end: parseVttTime(timing[2]),
      text: lines
        .slice(cursor + 1)
        .join(" ")
        .replace(/<[^>]+>/g, ""),
    });
  }

  return cues;
}

function toClock(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const hh = Math.floor(clamped / 3600);
  const mm = Math.floor((clamped % 3600) / 60);
  const ss = Math.floor(clamped % 60);
  const ms = Math.round((clamped - Math.floor(clamped)) * 1000);
  return `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

export interface DiscordSoundboardCue {
  start: string;
  duration: string;
  text: string;
}

export interface VttResult {
  cueCount: number;
  duration: number;
  cues: VttCue[];
  discord: { flags: number; cues: DiscordSoundboardCue[] } | null;
}

export function vttResult(input: string, limit = 10): VttResult {
  const cues = parseVtt(input);
  const duration = cues.reduce((longest, cue) => Math.max(longest, cue.end), 0);

  return {
    cueCount: cues.length,
    duration: Math.round(duration * 1000) / 1000,
    cues,
    discord:
      cues.length === 0
        ? null
        : {
            flags: 1,
            cues: cues.slice(0, limit).map((cue) => ({
              start: toClock(cue.start),
              duration: toClock(cue.end - cue.start),
              text: cue.text.slice(0, 80),
            })),
          },
  };
}
