"use client";

// Procedural sound: no files to load, nothing to 404. Off until the viewer
// turns it on (browsers refuse audio before a gesture anyway); the /live page
// can start with it on via ?sound=1 for the stream.

let ctx: AudioContext | null = null;
let enabled = false;
const subs = new Set<(on: boolean) => void>();

export function soundOn() {
  return enabled;
}

export function setSound(on: boolean) {
  enabled = on;
  if (on) {
    ctx ??= new AudioContext();
    ctx.resume().catch(() => {});
  }
  try {
    localStorage.setItem("rob:sound", on ? "1" : "0");
  } catch {}
  for (const s of subs) s(on);
}

export function onSound(cb: (on: boolean) => void) {
  subs.add(cb);
  return () => subs.delete(cb);
}

export function restoreSound(force?: boolean) {
  let on = !!force;
  try {
    on ||= localStorage.getItem("rob:sound") === "1";
  } catch {}
  if (on) setSound(true);
}

function tone(freq: number, dur: number, { type = "sine" as OscillatorType, gain = 0.15, at = 0, slide = 0 } = {}) {
  if (!enabled || !ctx) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** The ball clicking over a fret. */
export const tick = () => tone(2400 + Math.random() * 600, 0.025, { type: "square", gain: 0.035 });
export const chip = () => {
  tone(1800, 0.04, { type: "triangle", gain: 0.12 });
  tone(2600, 0.05, { type: "triangle", gain: 0.08, at: 0.03 });
};
export const bell = () => {
  tone(880, 0.6, { gain: 0.12 });
  tone(1320, 0.5, { gain: 0.08, at: 0.05 });
};
export const win = () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.35, { type: "triangle", gain: 0.13, at: i * 0.09 }));
export const lose = () => {
  tone(180, 0.7, { type: "sawtooth", gain: 0.08, slide: -120 });
  tone(90, 0.9, { gain: 0.18, slide: -40 });
};
export const whoosh = () => {
  if (!enabled || !ctx) return;
  // A whoosh: filtered noise swelling up.
  const len = ctx.sampleRate * 1.2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(Math.sin((Math.PI * i) / len), 2);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.setValueAtTime(400, ctx.currentTime);
  f.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 1.1);
  const g = ctx.createGain();
  g.gain.value = 0.25;
  src.connect(f).connect(g).connect(ctx.destination);
  src.start();
};
