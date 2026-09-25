// The wheel and the spin arithmetic — line for line the backend's wheel.js, so
// any spin can be re-derived in the browser from the beacon and the round id.

import type { Side } from "./types";

/** Real European wheel order, clockwise, zero removed. Index 0 is red and colours alternate. */
export const WHEEL = [
  32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
] as const;

const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export const colorOf = (n: number): Side => (REDS.has(n) ? "red" : "black");
export const POCKET_DEG = 360 / WHEEL.length;

async function sha256(data: string | Uint8Array): Promise<Uint8Array> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as BufferSource));
}

const hexToBytes = (hex: string) => new Uint8Array(hex.match(/../g)!.map((h) => parseInt(h, 16)));
const toHex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

export async function spin(randomness: string, roundId: number) {
  const d = await sha256(`${randomness}:${roundId}:spin`);
  let v = BigInt(0);
  for (let i = 0; i < 8; i++) v = (v << BigInt(8)) | BigInt(d[i]);
  const index = Number(v % BigInt(WHEEL.length));
  const number = WHEEL[index];
  return { index, number, color: colorOf(number) };
}

/**
 * Fetch the beacon straight from drand — not from our backend — check that its
 * randomness is the hash of its signature, and re-derive the pocket.
 */
export async function verifyRound(opts: {
  roundId: number;
  beacon: number;
  chainHash: string;
  drandUrl: string;
  claimed: { number: number; color: Side };
}) {
  const res = await fetch(`${opts.drandUrl.replace(/\/$/, "")}/${opts.chainHash}/public/${opts.beacon}`);
  if (!res.ok) throw new Error(`drand said ${res.status}`);
  const j = await res.json();
  const sigOk = toHex(await sha256(hexToBytes(j.signature))) === j.randomness;
  const s = await spin(j.randomness, opts.roundId);
  return {
    randomness: j.randomness as string,
    sigOk,
    derived: s,
    matches: s.number === opts.claimed.number && s.color === opts.claimed.color,
  };
}
