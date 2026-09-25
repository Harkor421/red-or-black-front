"use client";

import { AnimatePresence, motion } from "motion/react";
import { Flame, Snowflake, Trophy, Coins } from "lucide-react";
import { useLive } from "@/lib/live";
import { avatar, cn, compact, sol } from "@/lib/format";
import type { Settle } from "@/lib/types";

/** The last results, like the board next to a real table. Gold ring = the community won it. */
export function History({ onPick, stream = false, max = 24 }: { onPick?: (r: Settle) => void; stream?: boolean; max?: number }) {
  const live = useLive();
  const rows = live.history.filter((r) => r.result || r.status === "void").slice(0, max);
  const reds = rows.filter((r) => r.result?.color === "red").length;
  const blacks = rows.filter((r) => r.result?.color === "black").length;

  return (
    <div className={cn("rounded-3xl border border-white/10 bg-white/[0.03]", stream ? "p-6" : "p-4")}>
      <div className={cn("mb-3 flex items-center justify-between font-display tracking-widest text-white/60", stream ? "text-2xl" : "text-xs")}>
        <span>LAST SPINS</span>
        <span className="font-mono tracking-normal">
          <span className="text-[#ff4a57]">{reds}R</span> · <span className="text-white/80">{blacks}B</span>
        </span>
      </div>
      {rows.length === 0 ? (
        <div className={cn("py-6 text-center text-white/30", stream ? "text-xl" : "text-xs")}>The first spin is coming up.</div>
      ) : (
        <div className={cn("flex flex-wrap", stream ? "gap-3" : "gap-2")}>
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <motion.button
                key={r.id}
                layout
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                onClick={() => onPick?.(r)}
                title={`${r.result ? `${r.result.number} ${r.result.color}` : "void"} · picked ${r.pick ?? "—"} · ${r.win ? "WIN" : "loss"}`}
                className={cn(
                  "relative flex items-center justify-center rounded-full font-mono font-bold text-white transition-transform hover:scale-110",
                  stream ? "size-14 text-xl" : "size-9 text-xs",
                  r.result?.color === "red" ? "bg-[#e11d2e]" : r.result ? "bg-[#1a1a20]" : "bg-white/10",
                  r.win ? "ring-2 ring-[#f5c542] shadow-[0_0_14px_rgba(245,197,66,.6)]" : "opacity-80"
                )}
              >
                {r.result?.number ?? "∅"}
                {r.win && <span className={cn("absolute -top-1 -right-1", stream ? "text-lg" : "text-[10px]")}>🔥</span>}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export function Feed() {
  const live = useLive();
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between font-display text-xs tracking-widest text-white/60">
        <span>LIVE PICKS</span>
        <span className="flex items-center gap-1.5 font-mono tracking-normal">
          <span className="live-dot" /> {live.viewers} watching
        </span>
      </div>
      <div className="relative h-[196px] overflow-hidden">
        {live.feed.length === 0 && <div className="py-6 text-center text-xs text-white/30">Picks show up here as they land.</div>}
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {live.feed.slice(0, 7).map((f) => (
              <motion.li
                key={f.key}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-1.5 text-sm"
              >
                <span className="text-base">{avatar(f.who)}</span>
                <span className="font-mono text-xs text-white/50">#{f.who}</span>
                <span className="text-white/40">{f.switched ? "switched to" : "picked"}</span>
                <span className={cn("ml-auto rounded-md px-2 py-0.5 font-display text-xs", f.side === "red" ? "bg-[#e11d2e] text-white" : "bg-black text-white ring-1 ring-white/20")}>
                  {f.side.toUpperCase()}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0d0d10] to-transparent" />
      </div>
    </div>
  );
}

export function Stats({ stream = false }: { stream?: boolean }) {
  const live = useLive();
  const t = live.totals;
  const ticker = live.brand.ticker;
  const streak = t?.streak;
  const items = [
    { icon: <Flame className="text-orange-400" size={stream ? 32 : 18} />, label: `$${ticker} burned`, value: compact(t?.burned ?? 0) },
    { icon: <Coins className="text-[#f5c542]" size={stream ? 32 : 18} />, label: "SOL bought back", value: sol(t?.solSpentSol ?? 0, 3) },
    { icon: <Trophy className="text-emerald-300" size={stream ? 32 : 18} />, label: "record", value: `${t?.wins ?? 0}W – ${t?.losses ?? 0}L` },
    {
      icon: streak?.kind === "loss" ? <Snowflake className="text-sky-300" size={stream ? 32 : 18} /> : <Flame className="text-red-400" size={stream ? 32 : 18} />,
      label: "streak",
      value: streak?.n ? `${streak.n} ${streak.kind === "win" ? "win" : "loss"}${streak.n === 1 ? "" : streak.kind === "win" ? "s" : "es"}` : "—",
    },
  ];
  return (
    <div className={cn("grid grid-cols-2 gap-3", stream && "gap-4")}>
      {items.map((it, i) => (
        <motion.div
          key={it.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className={cn("rounded-2xl border border-white/10 bg-white/[0.03]", stream ? "p-5" : "p-3")}
        >
          <div className="flex items-center gap-2">
            {it.icon}
            <span className={cn("text-white/50", stream ? "text-xl" : "text-[11px]")}>{it.label}</span>
          </div>
          <motion.div key={it.value} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className={cn("mt-1 font-mono font-bold text-white", stream ? "text-4xl" : "text-lg")}>
            {it.value}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
