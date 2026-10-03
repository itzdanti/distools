export type Waveform = OscillatorType;

export interface Tone {
  freq: number;
  type?: Waveform;
  at: number;
  dur: number;
  gain?: number;
  glideTo?: number;
  attack?: number;
}

export interface NoiseHit {
  at: number;
  dur: number;
  gain?: number;
  type?: BiquadFilterType;
  from?: number;
  to?: number;
}

export interface SoundDef {
  id: string;
  name: string;
  group: string;
  description: string;
  tones?: Tone[];
  noise?: NoiseHit[];
  duration: number;
}

export const SOUNDS: SoundDef[] = [
  {
    id: "notification",
    name: "Notification",
    group: "Alerts",
    description: "Two-tone chime, closest thing to the real one.",
    duration: 0.55,
    tones: [
      { freq: 1174.7, type: "sine", at: 0, dur: 0.16, gain: 0.32 },
      { freq: 1567.98, type: "sine", at: 0.13, dur: 0.34, gain: 0.3 },
    ],
  },
  {
    id: "message",
    name: "Message sent",
    group: "Alerts",
    description: "Short bright blip when a message goes out.",
    duration: 0.3,
    tones: [
      { freq: 880, type: "triangle", at: 0, dur: 0.07, gain: 0.26 },
      { freq: 1318.5, type: "triangle", at: 0.05, dur: 0.12, gain: 0.22 },
    ],
  },
  {
    id: "success",
    name: "Success",
    group: "Alerts",
    description: "Rising major triad.",
    duration: 0.7,
    tones: [
      { freq: 523.25, type: "sine", at: 0, dur: 0.18, gain: 0.24 },
      { freq: 659.25, type: "sine", at: 0.11, dur: 0.18, gain: 0.24 },
      { freq: 783.99, type: "sine", at: 0.22, dur: 0.36, gain: 0.24 },
    ],
  },
  {
    id: "error",
    name: "Error",
    group: "Alerts",
    description: "Falling buzzer.",
    duration: 0.5,
    tones: [
      { freq: 220, type: "sawtooth", at: 0, dur: 0.2, gain: 0.16, glideTo: 160 },
      { freq: 220, type: "sawtooth", at: 0.16, dur: 0.28, gain: 0.14, glideTo: 110 },
    ],
  },
  {
    id: "alert",
    name: "Alert",
    group: "Alerts",
    description: "Urgent triple beep.",
    duration: 0.7,
    tones: [
      { freq: 1046.5, type: "square", at: 0, dur: 0.09, gain: 0.13 },
      { freq: 1046.5, type: "square", at: 0.14, dur: 0.09, gain: 0.13 },
      { freq: 1046.5, type: "square", at: 0.28, dur: 0.14, gain: 0.13 },
    ],
  },
  {
    id: "ping",
    name: "Mention",
    group: "Alerts",
    description: "Double tap used for pings.",
    duration: 0.4,
    tones: [
      { freq: 987.77, type: "sine", at: 0, dur: 0.1, gain: 0.28 },
      { freq: 987.77, type: "sine", at: 0.15, dur: 0.2, gain: 0.26 },
    ],
  },
  {
    id: "join",
    name: "Member joined",
    group: "Server",
    description: "Playful upward leap.",
    duration: 0.5,
    tones: [
      { freq: 392, type: "triangle", at: 0, dur: 0.12, gain: 0.22 },
      { freq: 587.33, type: "triangle", at: 0.09, dur: 0.12, gain: 0.22 },
      { freq: 783.99, type: "triangle", at: 0.18, dur: 0.26, gain: 0.22 },
    ],
  },
  {
    id: "leave",
    name: "Member left",
    group: "Server",
    description: "Same shape, falling.",
    duration: 0.5,
    tones: [
      { freq: 783.99, type: "triangle", at: 0, dur: 0.12, gain: 0.2 },
      { freq: 587.33, type: "triangle", at: 0.09, dur: 0.12, gain: 0.2 },
      { freq: 392, type: "triangle", at: 0.18, dur: 0.28, gain: 0.2 },
    ],
  },
  {
    id: "levelup",
    name: "Level up",
    group: "Server",
    description: "Muted RPG fanfare.",
    duration: 1,
    tones: [
      { freq: 523.25, type: "square", at: 0, dur: 0.1, gain: 0.11 },
      { freq: 659.25, type: "square", at: 0.1, dur: 0.1, gain: 0.11 },
      { freq: 783.99, type: "square", at: 0.2, dur: 0.1, gain: 0.11 },
      { freq: 1046.5, type: "square", at: 0.3, dur: 0.42, gain: 0.12 },
    ],
  },
  {
    id: "coin",
    name: "Coin",
    group: "Retro",
    description: "Two-note arcade pickup.",
    duration: 0.4,
    tones: [
      { freq: 987.77, type: "square", at: 0, dur: 0.06, gain: 0.14 },
      { freq: 1318.5, type: "square", at: 0.06, dur: 0.26, gain: 0.14 },
    ],
  },
  {
    id: "pop",
    name: "Pop",
    group: "Retro",
    description: "Short bubbly click.",
    duration: 0.18,
    tones: [
      { freq: 500, type: "sine", at: 0, dur: 0.1, gain: 0.26, glideTo: 1400 },
    ],
  },
  {
    id: "click",
    name: "Click",
    group: "Retro",
    description: "Dry UI tick.",
    duration: 0.07,
    noise: [{ at: 0, dur: 0.05, gain: 0.18, type: "highpass", from: 1800, to: 2600 }],
  },
  {
    id: "bonk",
    name: "Bonk",
    group: "Memes",
    description: "Wooden hollow thud.",
    duration: 0.35,
    tones: [
      { freq: 196, type: "triangle", at: 0, dur: 0.16, gain: 0.3, glideTo: 90 },
      { freq: 98, type: "sine", at: 0.01, dur: 0.3, gain: 0.26 },
    ],
    noise: [{ at: 0, dur: 0.05, gain: 0.1, type: "lowpass", from: 1200, to: 400 }],
  },
  {
    id: "vine",
    name: "Vine boom",
    group: "Memes",
    description: "The one and only.",
    duration: 1.1,
    tones: [
      { freq: 130, type: "sawtooth", at: 0, dur: 0.5, gain: 0.2, glideTo: 42 },
      { freq: 65, type: "sine", at: 0.02, dur: 0.9, gain: 0.24 },
    ],
    noise: [{ at: 0, dur: 0.35, gain: 0.07, type: "lowpass", from: 900, to: 120 }],
  },
  {
    id: "airhorn",
    name: "Airhorn",
    group: "Memes",
    description: "Three blasts. Please be a neighbour about it.",
    duration: 1.4,
    tones: [
      { freq: 233, type: "sawtooth", at: 0, dur: 0.28, gain: 0.13 },
      { freq: 233, type: "square", at: 0, dur: 0.28, gain: 0.07 },
      { freq: 233, type: "sawtooth", at: 0.36, dur: 0.28, gain: 0.13 },
      { freq: 233, type: "square", at: 0.36, dur: 0.28, gain: 0.07 },
      { freq: 233, type: "sawtooth", at: 0.72, dur: 0.5, gain: 0.13 },
      { freq: 233, type: "square", at: 0.72, dur: 0.5, gain: 0.07 },
    ],
  },
  {
    id: "scratch",
    name: "Record scratch",
    group: "Memes",
    description: "Wait, what were we doing.",
    duration: 0.9,
    tones: [
      { freq: 900, type: "sawtooth", at: 0, dur: 0.22, gain: 0.1, glideTo: 260 },
      { freq: 300, type: "sawtooth", at: 0.24, dur: 0.5, gain: 0.13, glideTo: 210 },
    ],
    noise: [{ at: 0, dur: 0.22, gain: 0.1, type: "bandpass", from: 2600, to: 700 }],
  },
  {
    id: "whoosh",
    name: "Whoosh",
    group: "Transitions",
    description: "Swept air.",
    duration: 0.45,
    noise: [{ at: 0, dur: 0.42, gain: 0.13, type: "bandpass", from: 400, to: 3000 }],
  },
  {
    id: "swoosh",
    name: "Swoosh",
    group: "Transitions",
    description: "Fast reversed sweep.",
    duration: 0.35,
    noise: [{ at: 0, dur: 0.32, gain: 0.13, type: "bandpass", from: 3200, to: 350 }],
  },
  {
    id: "laser",
    name: "Laser",
    group: "Transitions",
    description: "Descending zap.",
    duration: 0.45,
    tones: [
      { freq: 1800, type: "sawtooth", at: 0, dur: 0.4, gain: 0.12, glideTo: 180 },
    ],
  },
  {
    id: "riser",
    name: "Riser",
    group: "Transitions",
    description: "Tension building into nothing.",
    duration: 1.6,
    tones: [
      { freq: 160, type: "sawtooth", at: 0, dur: 1.5, gain: 0.09, glideTo: 1400 },
    ],
    noise: [{ at: 0, dur: 1.5, gain: 0.05, type: "highpass", from: 600, to: 4200 }],
  },
  {
    id: "boop",
    name: "Boop",
    group: "Retro",
    description: "Tiptoe tap.",
    duration: 0.3,
    tones: [
      { freq: 660, type: "sine", at: 0, dur: 0.11, gain: 0.26 },
      { freq: 990, type: "sine", at: 0.07, dur: 0.18, gain: 0.2 },
    ],
  },
  {
    id: "kick",
    name: "Kick drum",
    group: "Drums",
    description: "Low thump with pitch drop.",
    duration: 0.35,
    tones: [
      { freq: 160, type: "sine", at: 0, dur: 0.3, gain: 0.34, glideTo: 45 },
    ],
    noise: [{ at: 0, dur: 0.02, gain: 0.14, type: "lowpass", from: 3000, to: 800 }],
  },
  {
    id: "snare",
    name: "Snare",
    group: "Drums",
    description: "Crack of a snare.",
    duration: 0.25,
    noise: [
      { at: 0, dur: 0.16, gain: 0.2, type: "bandpass", from: 1800, to: 900 },
      { at: 0, dur: 0.06, gain: 0.12, type: "highpass", from: 4000, to: 3000 },
    ],
    tones: [{ freq: 220, type: "triangle", at: 0, dur: 0.1, gain: 0.14, glideTo: 150 }],
  },
  {
    id: "hat",
    name: "Hi-hat",
    group: "Drums",
    description: "Closed metallic tick.",
    duration: 0.12,
    noise: [{ at: 0, dur: 0.09, gain: 0.16, type: "highpass", from: 7000, to: 6000 }],
  },
  {
    id: "taiko",
    name: "Taiko",
    group: "Drums",
    description: "Deep ceremonial drum.",
    duration: 0.6,
    tones: [
      { freq: 110, type: "sine", at: 0, dur: 0.5, gain: 0.36, glideTo: 60 },
      { freq: 220, type: "triangle", at: 0, dur: 0.2, gain: 0.16, glideTo: 120 },
    ],
  },
];

export const SOUND_GROUPS = Array.from(new Set(SOUNDS.map((sound) => sound.group)));

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!context) context = new Ctor();
  if (context.state === "suspended") void context.resume();
  return context;
}

function makeNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const frames = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function playSound(def: SoundDef, volume = 1): void {
  const ctx = getContext();
  if (!ctx) return;
  const start = ctx.currentTime + 0.01;
  const master = ctx.createGain();
  master.gain.value = Math.max(0, Math.min(1, volume));
  master.connect(ctx.destination);

  for (const tone of def.tones ?? []) {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = tone.type ?? "sine";
    osc.frequency.setValueAtTime(tone.freq, start + tone.at);
    if (tone.glideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, tone.glideTo),
        start + tone.at + tone.dur,
      );
    }
    const peak = tone.gain ?? 0.2;
    const attack = tone.attack ?? 0.008;
    amp.gain.setValueAtTime(0.0001, start + tone.at);
    amp.gain.exponentialRampToValueAtTime(peak, start + tone.at + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + tone.at + tone.dur);
    osc.connect(amp).connect(master);
    osc.start(start + tone.at);
    osc.stop(start + tone.at + tone.dur + 0.02);
  }

  for (const hit of def.noise ?? []) {
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const amp = ctx.createGain();
    source.buffer = makeNoiseBuffer(ctx, hit.dur + 0.05);
    filter.type = hit.type ?? "bandpass";
    filter.frequency.setValueAtTime(hit.from ?? 1000, start + hit.at);
    if (hit.to !== undefined) {
      filter.frequency.exponentialRampToValueAtTime(
        Math.max(20, hit.to),
        start + hit.at + hit.dur,
      );
    }
    const peak = hit.gain ?? 0.15;
    amp.gain.setValueAtTime(0.0001, start + hit.at);
    amp.gain.exponentialRampToValueAtTime(peak, start + hit.at + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + hit.at + hit.dur);
    source.connect(filter).connect(amp).connect(master);
    source.start(start + hit.at);
    source.stop(start + hit.at + hit.dur + 0.05);
  }

  const tail = start + def.duration + 0.1;
  setTimeout(() => master.disconnect(), Math.max(0, (tail - ctx.currentTime) * 1000));
}

export function findSound(id: string): SoundDef | undefined {
  return SOUNDS.find((sound) => sound.id === id);
}

export { parseVttTime, formatCountdown } from "./core/time";