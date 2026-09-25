"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";
import { ExternalLink, Loader2, X } from "lucide-react";
import type { Settle } from "@/lib/types";
import { useLive } from "@/lib/live";
import { cn, lamports, short, sol, usd } from "@/lib/format";
import * as sfx from "@/lib/sound";

function burst(big: boolean) {
  const colors = ["#e11d2e", "#111114", "#f5c542", "#ffffff"];
  const coin = confetti.shapeFromText({ text: "🪙", scalar: 2 });
  const opts = { spread: 75, startVelocity: 55, ticks: 260, colors, zIndex: 80 };
  confetti({ ...opts, particleCount: big ? 160 : 90, angle: 60, origin: { x: 0, y: 0.75 } });
  confetti({ ...opts, particleCount: big ? 160 : 90, angle: 120, origin: { x: 1, y: 0.75 } });
  setTimeout(() => confetti({ particleCount: big ? 60 : 25, spread: 120, startVelocity: 35, shapes: [coin], scalar: 2, origin: { y: 0.45 }, zIndex: 80 }), 350);
  if (big) setTimeout(() => confetti({ ...opts, particleCount: 120, angle: 90, spread: 140, origin: { x: 0.5, y: 0.9 } }), 900);
}

export function ResultOverlay({ settle, open, onClose, stream }: { settle: Settle | null; open: boolean; onClose: () => void; stream?: boolean }) {
  const live = useLive();
  const fired = useRef<number | null>(null);
  const mine = settle && live.wallet ? settle.payouts.find((p) => p.wallet === live.wallet) ?? null : null;

  useEffect(() => {
    if (!open || !settle || fired.current === settle.id) return;
    fired.current = settle.id;
    if (settle.win) {
      burst(!!mine);
      if (mine) sfx.whoosh();
    }
    else
      document.body.animate(
        [{ transform: "translate(0)" }, { transform: "translate(-14px,4px)" }, { transform: "translate(12px,-3px)" }, { transform: "translate(-8px,2px)" }, { transform: "translate(5px,0)" }, { transform: "translate(0)" }],
        { duration: 550, easing: "ease-out" }
      );
  }, [open, settle, mine]);

  const explorer = live.rules?.explorer ?? "https://solscan.io";
  const solUsd = live.pot?.solUsd ?? null;
  const color = settle?.result?.color;

  const title = !settle
    ? ""
    : settle.status === "void"
      ? "ROUND VOID"
      : settle.win
        ? `${color?.toUpperCase()} WINS!`
        : settle.status === "too_small"
          ? "POT ROLLS OVER"
          : "NOBODY CALLED IT";

  return (
    <AnimatePresence>
      {open && settle && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.6, y: 40, rotateX: 30 }}
            animate={{ scale: 1, y: 0, rotateX: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className={cn(
              "relative max-h-[90vh] w-full overflow-y-auto rounded-3xl border p-6 text-center shadow-2xl sm:p-8",
              stream ? "max-w-3xl" : "max-w-lg",
              settle.win ? "border-[#f5c542]/60 bg-gradient-to-b from-[#3a0a10] to-[#0b0b0e] win-glow" : "border-white/10 bg-gradient-to-b from-[#16161b] to-[#0b0b0e]"
            )}
          >
            <button onClick={onClose} className="absolute top-3 right-3 rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white" aria-label="Close">
              <X size={18} />
            </button>

            {settle.result ? (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                className={cn(
                  "mx-auto flex size-24 items-center justify-center rounded-full border-4 border-[#f5c542] font-display text-5xl text-white shadow-[0_0_40px_rgba(245,197,66,.4)]",
                  stream && "size-36 text-7xl",
                  settle.result.color === "red" ? "bg-[#e11d2e]" : "bg-[#0b0b0e]"
                )}
              >
                {settle.result.number}
              </motion.div>
            ) : (
              <div className="mx-auto flex size-24 items-center justify-center rounded-full border-4 border-white/20 font-display text-3xl text-white/60">?</div>
            )}

            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={cn("mt-5 font-display leading-none", stream ? "text-7xl" : "text-4xl sm:text-5xl", settle.win ? "text-shimmer" : "text-white")}
            >
              {title}
            </motion.h2>

            {/* the line that matters to whoever is looking */}
            {mine ? (
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.5 }}
                className="mx-auto mt-4 w-fit rounded-2xl border-2 border-[#f5c542] bg-[#f5c542]/15 px-6 py-3 shadow-[0_0_40px_rgba(245,197,66,.45)]"
              >
                <div className="font-display text-sm tracking-widest text-[#f5c542]">YOU WON</div>
                <div className="font-mono text-4xl font-bold text-white">{sol(lamports(mine.lamports), 4)} SOL</div>
                {solUsd && <div className="text-xs text-white/60">{usd((mine.lamports / 1e9) * solUsd)}</div>}
                <div className="mt-1 text-[11px] text-white/50">{settle.mode === "live" ? (mine.sig ? "sent to your wallet" : "sending…") : settle.mode === "dry" ? "dry run — not sent" : "demo — not sent"}</div>
              </motion.div>
            ) : (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className={cn("mt-3 text-white/70", stream ? "text-2xl" : "text-sm")}>
                {settle.status === "void"
                  ? "The randomness beacon did not arrive in time. Nothing spun — the pot rolls over."
                  : settle.win
                    ? `Everyone who picked ${color?.toUpperCase()} and holds the coin splits the pot.`
                    : settle.note?.replace(/^./, (c) => c.toUpperCase())}
              </motion.p>
            )}

            {settle.win && <Winners settle={settle} explorer={explorer} me={live.wallet} stream={stream} />}

            {!settle.win && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="mx-auto mt-5 w-fit rounded-2xl border border-white/10 bg-white/5 px-5 py-3"
              >
                <div className="text-[11px] tracking-widest text-white/50">NEXT SPIN&apos;S POT</div>
                <div className={cn("font-mono font-bold text-[#f5c542]", stream ? "text-4xl" : "text-2xl")}>{sol(lamports(live.pot?.lamports ?? settle.potLamports), 3)} SOL</div>
              </motion.div>
            )}

            <div className="mt-5 text-[11px] text-white/40">
              picks {settle.votes.red} red · {settle.votes.black} black · drand #{settle.beacon}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Winners({ settle, explorer, me, stream }: { settle: Settle; explorer: string; me: string | null; stream?: boolean }) {
  const shown = settle.payouts.slice(0, stream ? 8 : 6);
  const more = settle.payouts.length - shown.length;
  return (
    <div className="mt-5">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        className="mx-auto w-fit rounded-2xl bg-gradient-to-r from-[#b07d17] via-[#f5c542] to-[#b07d17] px-5 py-2 text-black shadow-[0_0_30px_rgba(245,197,66,.45)]"
      >
        <div className={cn("font-display", stream ? "text-3xl" : "text-lg")}>
          {settle.payouts.length} WALLET{settle.payouts.length === 1 ? "" : "S"} SPLIT {sol(lamports(settle.totalLamports), 3)} SOL
        </div>
        <div className="font-mono text-xs font-bold">{sol(lamports(settle.shareLamports), 4)} SOL each</div>
      </motion.div>

      {settle.winners > settle.eligible && (
        <div className="mt-2 text-[11px] text-white/45">
          {settle.winners - settle.eligible} more picked {settle.result?.color} without holding the minimum
        </div>
      )}

      <ul className="mx-auto mt-4 max-w-sm space-y-1.5 text-left">
        {shown.map((p, i) => (
          <motion.li
            key={p.wallet}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.06 }}
            className={cn("flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm", p.wallet === me ? "bg-[#f5c542]/20 ring-1 ring-[#f5c542]" : "bg-white/[0.05]")}
          >
            <span className="font-mono text-white/80">{short(p.wallet, 4, 4)}</span>
            {p.wallet === me && <span className="rounded bg-[#f5c542] px-1.5 text-[10px] font-bold text-black">YOU</span>}
            <span className="ml-auto font-mono text-white">{sol(lamports(p.lamports), 4)}</span>
            {p.sig ? (
              <a href={`${explorer}/tx/${p.sig}`} target="_blank" rel="noreferrer" className="text-white/40 hover:text-white" onClick={(e) => e.stopPropagation()}>
                <ExternalLink size={13} />
              </a>
            ) : settle.stage === "paying" ? (
              <Loader2 size={13} className="animate-spin text-white/40" />
            ) : null}
          </motion.li>
        ))}
      </ul>
      {more > 0 && <div className="mt-2 text-xs text-white/40">+{more} more</div>}

      {settle.mode === "dry" && <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-3 text-left text-xs text-amber-100/90">{settle.note}</div>}
      {settle.mode === "demo" && <div className="mt-3 text-[11px] text-white/40">demo — the coin is not live yet, nothing was sent</div>}
      {(settle.status === "partial" || settle.status === "pay_failed") && <div className="mt-3 text-xs text-amber-300/80">{settle.note}</div>}
    </div>
  );
}
