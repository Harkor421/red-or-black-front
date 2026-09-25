"use client";

import { AnimatePresence, motion } from "motion/react";
import { Coins, Crown, RefreshCcw, Snowflake, Trophy, Users } from "lucide-react";
import { useLive } from "@/lib/live";
import { cn, short, sol } from "@/lib/format";
import type { Settle } from "@/lib/types";

/** The last results, like the board next to a real table. Gold ring = somebody got paid. */
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
                title={`${r.result ? `${r.result.number} ${r.result.color}` : "void"} · ${r.win ? `${r.payouts.length} paid` : "rolled over"}`}
                className={cn(
                  "relative flex items-center justify-center rounded-full font-mono font-bold text-white transition-transform hover:scale-110",
                  stream ? "size-14 text-xl" : "size-9 text-xs",
                  r.result?.color === "red" ? "bg-[#e11d2e]" : r.result ? "bg-[#1a1a20]" : "bg-white/10",
                  r.win ? "ring-2 ring-[#f5c542] shadow-[0_0_14px_rgba(245,197,66,.6)]" : "opacity-80"
                )}
              >
                {r.result?.number ?? "∅"}
                {r.win && <span className={cn("absolute -top-1 -right-1", stream ? "text-lg" : "text-[10px]")}>🪙</span>}
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
                <span
                  title={f.eligible === false ? "doesn't hold the minimum" : f.eligible ? "can cash" : ""}
                  className={cn("size-2 shrink-0 rounded-full", f.eligible ? "bg-emerald-400" : f.eligible === false ? "bg-white/20" : "bg-white/40")}
                />
                <span className="font-mono text-xs text-white/70">{f.wallet}</span>
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
  const streak = t?.streak;
  const size = stream ? 32 : 18;
  const items = [
    { icon: <Coins className="text-[#f5c542]" size={size} />, label: "SOL paid out", value: sol(t?.solPaidSol ?? 0, 3) },
    { icon: <Users className="text-emerald-300" size={size} />, label: "wallets paid", value: String(t?.walletsPaid ?? 0) },
    { icon: <Crown className="text-orange-300" size={size} />, label: "biggest share", value: `${sol(t?.biggestShareSol ?? 0, 3)}` },
    {
      icon: streak?.kind === "rollover" ? <RefreshCcw className="text-sky-300" size={size} /> : streak?.kind === "paid" ? <Trophy className="text-red-400" size={size} /> : <Snowflake className="text-white/40" size={size} />,
      label: streak?.kind === "rollover" ? "rolling over" : "paid in a row",
      value: streak?.n ? `${streak.n}×` : "—",
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

/** The latest paid wallets, across rounds. */
export function Winners() {
  const live = useLive();
  const rows = live.history
    .filter((r) => r.win)
    .flatMap((r) => r.payouts.map((p) => ({ ...p, roundId: r.id, color: r.result?.color, mode: r.mode })))
    .slice(0, 6);
  if (!rows.length) return null;
  const explorer = live.rules?.explorer ?? "https://solscan.io";
  return (
    <div className="rounded-3xl border border-[#f5c542]/20 bg-[#f5c542]/[0.03] p-4">
      <div className="mb-3 font-display text-xs tracking-widest text-[#f5c542]/80">LATEST WINNERS</div>
      <ul className="space-y-1.5">
        {rows.map((p) => (
          <li key={`${p.roundId}-${p.wallet}`} className="flex items-center gap-2 text-sm">
            <span className={cn("size-3 rounded-full", p.color === "red" ? "bg-[#e11d2e]" : "bg-black ring-1 ring-white/30")} />
            <span className="font-mono text-xs text-white/70">{short(p.wallet, 4, 4)}</span>
            {p.sig ? (
              <a href={`${explorer}/tx/${p.sig}`} target="_blank" rel="noreferrer" className="ml-auto font-mono text-[#f5c542] hover:underline">
                +{sol(p.lamports / 1e9, 4)}
              </a>
            ) : (
              <span className="ml-auto font-mono text-white/60">+{sol(p.lamports / 1e9, 4)}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
