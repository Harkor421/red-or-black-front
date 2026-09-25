"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { vote, useLive } from "@/lib/live";
import { useNow } from "@/lib/useNow";
import { cn } from "@/lib/format";
import type { Side } from "@/lib/types";
import * as sfx from "@/lib/sound";

type Flying = { id: number; side: Side; x: number; y: number; dx: number; dy: number };
let flyId = 0;

export function VoteButtons({ stream = false }: { stream?: boolean }) {
  const live = useLive();
  const now = useNow(500);
  const [flying, setFlying] = useState<Flying[]>([]);
  const r = live.round;
  const counts = r?.counts ?? { red: 0, black: 0 };
  const total = counts.red + counts.black;
  const redPct = total ? (counts.red / total) * 100 : 50;
  const mine = live.me && r && live.me.roundId === r.id ? live.me.side : null;
  const closed = !r || now >= r.endsAt;

  function pick(side: Side, e: React.MouseEvent<HTMLButtonElement>) {
    if (stream) return;
    sfx.chip();
    vote(side);
    // A chip flies from the button into the wheel.
    const b = e.currentTarget.getBoundingClientRect();
    const w = document.getElementById("wheel")?.getBoundingClientRect();
    const x = b.left + b.width / 2;
    const y = b.top + b.height / 2;
    const tx = w ? w.left + w.width / 2 : x;
    const ty = w ? w.top + w.height / 2 : y - 300;
    const f = { id: ++flyId, side, x, y, dx: tx - x + (Math.random() - 0.5) * 60, dy: ty - y + (Math.random() - 0.5) * 60 };
    setFlying((l) => [...l, f]);
    setTimeout(() => setFlying((l) => l.filter((q) => q.id !== f.id)), 900);
  }

  return (
    <div className="w-full">
      <div className={cn("grid gap-3 sm:gap-4", stream ? "grid-cols-1" : "grid-cols-2")}>
        {(["red", "black"] as const).map((side) => {
          const n = counts[side];
          const pct = total ? Math.round((n / total) * 100) : 0;
          const selected = mine === side;
          return (
            <motion.button
              key={side}
              onClick={(e) => pick(side, e)}
              disabled={closed || stream}
              whileHover={stream ? undefined : { y: -4, scale: 1.02 }}
              whileTap={stream ? undefined : { scale: 0.95 }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border-2 text-left transition-shadow disabled:cursor-not-allowed",
                stream ? "px-8 py-5" : "px-4 py-4 sm:px-6 sm:py-5",
                side === "red" ? "border-[#ff4a57]/50 bg-gradient-to-br from-[#ff2d3d] to-[#9b0b18]" : "border-white/20 bg-gradient-to-br from-[#2a2a31] to-[#050506]",
                selected && (side === "red" ? "ring-4 ring-[#ff8a93] shadow-[0_0_50px_rgba(255,45,61,.7)]" : "ring-4 ring-white/70 shadow-[0_0_50px_rgba(255,255,255,.35)]")
              )}
            >
              <span className="btn-shine" />
              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className={cn("font-display leading-none text-white drop-shadow", stream ? "text-6xl" : "text-[26px] sm:text-4xl")}>{side.toUpperCase()}</div>
                  <div className={cn("mt-1 whitespace-nowrap font-mono text-white/75", stream ? "text-2xl" : "text-[11px] sm:text-sm")}>
                    <motion.span key={n} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-block">
                      {n}
                    </motion.span>{" "}
                    vote{n === 1 ? "" : "s"} · {pct}%
                  </div>
                </div>
                <Chip side={side} size={stream ? 64 : 32} spin={selected} />
              </div>
              <AnimatePresence>
                {selected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className={cn("relative mt-2 inline-flex rounded-full bg-black/40 px-2.5 py-0.5 font-display tracking-wider text-[#f5c542]", stream ? "text-xl" : "text-[10px] sm:text-xs")}
                  >
                    ✓ YOUR PICK
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* tug of war */}
      <div className={cn("relative mt-4 overflow-hidden rounded-full border border-white/10 bg-[#0b0b0e]", stream ? "h-6" : "h-3")}>
        {/* CSS transitions, not motion: an absolutely positioned div with no width
            starts at "auto", and motion cannot animate auto → 50% */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#9b0b18] to-[#ff2d3d] transition-[width] duration-700 ease-[cubic-bezier(.34,1.56,.64,1)]"
          style={{ width: `${redPct}%` }}
        />
        <div
          className="absolute inset-y-0 w-1 -translate-x-1/2 bg-[#f5c542] shadow-[0_0_12px_#f5c542] transition-[left] duration-700 ease-[cubic-bezier(.34,1.56,.64,1)]"
          style={{ left: `${redPct}%` }}
        />
      </div>
      <div className={cn("mt-1.5 flex justify-between font-mono text-white/40", stream ? "text-lg" : "text-[11px]")}>
        <span>{r?.voters ?? 0} voting</span>
        <span>{closed ? "no more bets" : mine ? "tap the other color to switch" : "free · one pick per round"}</span>
      </div>

      {/* flying chips */}
      <div className="pointer-events-none fixed inset-0 z-[60]">
        <AnimatePresence>
          {flying.map((f) => (
            <motion.div
              key={f.id}
              className="absolute"
              style={{ left: f.x - 18, top: f.y - 18 }}
              initial={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
              animate={{ x: f.dx, y: [0, f.dy - 120, f.dy], scale: [1, 1.3, 0.4], rotate: 540, opacity: [1, 1, 0] }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <Chip side={f.side} size={36} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function Chip({ side, size = 40, spin = false }: { side: Side; size?: number; spin?: boolean }) {
  const main = side === "red" ? "#e11d2e" : "#16161a";
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={cn("shrink-0 drop-shadow-[0_4px_6px_rgba(0,0,0,.5)]", spin && "chip-spin")}>
      <circle cx="20" cy="20" r="19" fill={main} stroke="#fff" strokeWidth="1.5" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x="18" y="1.5" width="4" height="7" rx="1" fill="#fff" transform={`rotate(${i * 45} 20 20)`} />
      ))}
      <circle cx="20" cy="20" r="11" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="2 2" />
      <circle cx="20" cy="20" r="8" fill={side === "red" ? "#b50f1f" : "#000"} />
      <text x="20" y="20.5" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="900" fill="#f5c542">
        {side === "red" ? "R" : "B"}
      </text>
    </svg>
  );
}
