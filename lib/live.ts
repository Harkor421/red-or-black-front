"use client";

// The table, as the browser sees it: one WebSocket to the backend, one store,
// and a hook. The store's functions are module-level and stable — an inline
// subscribe handed to useSyncExternalStore resubscribes every render, and a
// subscribe that resets state is an infinite loop.

import { useSyncExternalStore } from "react";
import type { FeedItem, LiveState, Settle, Side } from "./types";

const RAW = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8787";
export const HTTP_URL = RAW.replace(/^ws/, "http").replace(/\/$/, "");
export const WS_URL = HTTP_URL.replace(/^http/, "ws");

const INITIAL: LiveState = {
  connected: false,
  ready: false,
  offset: 0,
  viewers: 0,
  brand: { name: "RED OR BLACK", ticker: "ROB", twitter: "", site: "" },
  mode: "demo",
  modeNote: "",
  coin: null,
  round: null,
  pot: null,
  history: [],
  settling: null,
  totals: null,
  rules: null,
  feed: [],
  me: null,
  toast: null,
};

let state: LiveState = INITIAL;
const listeners = new Set<() => void>();

function set(patch: Partial<LiveState> | ((s: LiveState) => Partial<LiveState>)) {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  start();
  return () => listeners.delete(l);
}
const getSnapshot = () => state;
const getServerSnapshot = () => INITIAL;

export function useLive(): LiveState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Server time, from the offset measured on every hello and tick. */
export const serverNow = () => Date.now() + state.offset;

// ── identity ────────────────────────────────────────────────────────────────

let memVoter: string | null = null;

function voterId(): string {
  const make = () => {
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    return "v" + Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  };
  try {
    const have = localStorage.getItem("rob:voter");
    if (have && /^[A-Za-z0-9_-]{8,64}$/.test(have)) return have;
    const id = make();
    localStorage.setItem("rob:voter", id);
    return id;
  } catch {
    // Private mode: a per-tab identity still lets you vote this session.
    return (memVoter ??= make());
  }
}

// ── socket ──────────────────────────────────────────────────────────────────

let ws: WebSocket | null = null;
let started = false;
let backoff = 800;
let pinger: ReturnType<typeof setInterval> | null = null;
let toastKey = 0;

function toast(text: string) {
  set({ toast: { key: ++toastKey, text } });
}

function upsertHistory(list: Settle[], r: Settle): Settle[] {
  const i = list.findIndex((x) => x.id === r.id);
  if (i === -1) return [r, ...list].sort((a, b) => b.id - a.id).slice(0, 80);
  const next = list.slice();
  next[i] = r;
  return next;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onMessage(m: any) {
  switch (m.type) {
    case "hello":
      set({
        ready: true,
        offset: m.now - Date.now(),
        viewers: m.viewers ?? state.viewers,
        brand: m.brand,
        mode: m.mode,
        modeNote: m.modeNote,
        coin: m.coin,
        round: m.round,
        pot: m.pot,
        history: m.history ?? [],
        settling: m.settling,
        totals: m.totals,
        rules: m.rules,
      });
      ws?.send(JSON.stringify({ op: "hi", voter: voterId() }));
      break;
    case "tick":
      set({ offset: m.now - Date.now(), viewers: m.viewers });
      break;
    case "round":
      set((s) => ({ round: m.round, me: s.me && s.me.roundId === m.round.id ? s.me : { roundId: m.round.id, side: null } }));
      break;
    case "me":
      set({ me: { roundId: m.roundId, side: m.side } });
      break;
    case "vote": {
      const item: FeedItem = { key: `${m.ts}-${m.who}-${m.side}`, who: m.who, side: m.side, at: m.ts ?? Date.now(), switched: !!m.prev };
      set((s) => ({
        round: s.round && s.round.id === m.roundId ? { ...s.round, counts: m.counts, voters: m.voters } : s.round,
        feed: [item, ...s.feed].slice(0, 30),
      }));
      break;
    }
    case "voteAck":
      if (!m.ok) {
        toast(m.error === "no more bets" ? "No more bets — next round is open" : m.error);
        ws?.send(JSON.stringify({ op: "hi", voter: voterId() }));
      }
      break;
    case "settle":
      set((s) => ({
        settling: m.round,
        history: m.round.stage === "done" ? upsertHistory(s.history, m.round) : s.history,
      }));
      break;
    case "pot":
      set((s) => ({ pot: m.pot, coin: m.coin ?? s.coin }));
      break;
    case "totals":
      set({ totals: m.totals });
      break;
    case "burn":
      set({ totals: m.totals });
      break;
  }
}

function connect() {
  try {
    ws = new WebSocket(WS_URL);
  } catch {
    return retry();
  }
  ws.onopen = () => {
    backoff = 800;
    set({ connected: true });
    if (pinger) clearInterval(pinger);
    pinger = setInterval(() => ws?.readyState === 1 && ws.send(JSON.stringify({ op: "ping" })), 20_000);
  };
  ws.onmessage = (ev) => {
    try {
      onMessage(JSON.parse(ev.data));
    } catch {
      /* ignore */
    }
  };
  ws.onclose = () => {
    set({ connected: false });
    retry();
  };
  ws.onerror = () => ws?.close();
}

function retry() {
  if (pinger) clearInterval(pinger);
  setTimeout(connect, backoff);
  backoff = Math.min(backoff * 1.7, 10_000);
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  connect();
}

// ── actions ─────────────────────────────────────────────────────────────────

export function vote(side: Side) {
  const r = state.round;
  if (!r) return;
  if (serverNow() >= r.endsAt) return toast("No more bets");
  if (!ws || ws.readyState !== 1) return toast("Reconnecting…");
  set({ me: { roundId: r.id, side } });
  ws.send(JSON.stringify({ op: "vote", voter: voterId(), side }));
}
