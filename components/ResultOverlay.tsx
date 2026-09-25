"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";
import { Check, ExternalLink, Flame, Loader2, X } from "lucide-react";
import type { Settle } from "@/lib/types";
import { useLive } from "@/lib/live";
import { cn, compact, lamports, short, sol } from "@/lib/format";
import * as sfx from "@/lib/sound";

function burst() {
  const colors = ["#e11d2e", "#111114", "#f5c542", "#ffffff"];
  const fire = confetti.shapeFromText({ text: "🔥", scalar: 2 });
  const chip = confetti.shapeFromText({ text: "🔴", scalar: 1.6 });
  const opts = { spread: 75, startVelocity: 55, ticks: 260, colors, zIndex: 80 };
  confetti({ ...opts, particleCount: 110, angle: 60, origin: { x: 0, y: 0.75 } });
  confetti({ ...opts, particleCount: 110, angle: 120, origin: { x: 1, y: 0.75 } });
  setTimeout(() => confetti({ particleCount: 40, spread: 120, startVelocity: 35, shapes: [fire, chip], scalar: 2, origin: { y: 0.45 }, zIndex: 80 }), 350);
  setTimeout(() => confetti({ ...opts, particleCount: 80, angle: 90, spread: 120, origin: { x: 0.5, y: 0.9 } }), 900);
}

export function ResultOverlay({ settle, open, onClose, stream }: { settle: Settle | null; open: boolean; onClose: () => void; stream?: boolean }) {
  const live = useLive();
  const fired = useRef<number | null>(null);
  const burnFired = useRef<number | null>(null);

  useEffect(() => {
    if (!open || !settle || fired.current === settle.id) return;
    fired.current = settle.id;
    if (settle.win) burst();
    else document.body.animate(
      [{ transform: "translate(0)" }, { transform: "translate(-14px,4px)" }, { transform: "translate(12px,-3px)" }, { transform: "translate(-8px,2px)" }, { transform: "translate(5px,0)" }, { transform: "translate(0)" }],
      { duration: 550, easing: "ease-out" }
    );
  }, [open, settle]);

  useEffect(() => {
    if (!open || !settle?.burn?.sig || burnFired.current === settle.id) return;
    burnFired.current = settle.id;
    sfx.burn();
  }, [open, settle]);

  const ticker = live.brand.ticker;
  const explorer = live.rules?.explorer ?? "https://solscan.io";
  const decimals = live.coin?.decimals ?? 6;

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
              "relative w-full overflow-hidden rounded-3xl border p-6 text-center shadow-2xl sm:p-8",
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
              {settle.status === "void" ? "ROUND VOID" : settle.win ? "WE WIN!" : "HOUSE WINS"}
            </motion.h2>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className={cn("mt-2 text-white/70", stream ? "text-2xl" : "text-sm")}>
              {settle.status === "void"
                ? "The randomness beacon did not arrive in time. Nothing spun — the pot rolls over."
                : settle.win
                  ? `The community picked ${settle.pick?.toUpperCase()}${settle.tie ? " (tie, the beacon picked)" : ""} and the ball agreed.`
                  : `The community picked ${settle.pick?.toUpperCase()}${settle.tie ? " (tie, the beacon picked)" : ""}. The pot rolls over to the next spin.`}
            </motion.p>

            {settle.win && <Buyback settle={settle} ticker={ticker} explorer={explorer} decimals={decimals} stream={stream} />}

            {!settle.win && settle.potLamports != null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="mx-auto mt-5 w-fit rounded-2xl border border-white/10 bg-white/5 px-5 py-3"
              >
                <div className="text-[11px] tracking-widest text-white/50">NEXT SPIN&apos;S POT</div>
                <div className={cn("font-mono font-bold text-[#f5c542]", stream ? "text-4xl" : "text-2xl")}>
                  {sol(lamports(live.pot?.lamports ?? settle.potLamports), 3)} SOL
                </div>
              </motion.div>
            )}

            <div className="mt-5 text-[11px] text-white/40">
              votes {settle.votes.red} red · {settle.votes.black} black · drand #{settle.beacon}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Step({ done, busy, children, href }: { done: boolean; busy: boolean; children: React.ReactNode; href?: string | null }) {
  return (
    <motion.li initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 text-left">
      <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", done ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/60")}>
        {done ? <Check size={14} /> : busy ? <Loader2 size={14} className="animate-spin" /> : <span className="size-1.5 rounded-full bg-white/40" />}
      </span>
      <span className="flex-1 text-sm text-white/85">{children}</span>
      {href && (
        <a href={href} target="_blank" rel="noreferrer" className="text-white/40 hover:text-white" onClick={(e) => e.stopPropagation()}>
          <ExternalLink size={14} />
        </a>
      )}
    </motion.li>
  );
}

function Buyback({ settle, ticker, explorer, decimals, stream }: { settle: Settle; ticker: string; explorer: string; decimals: number; stream?: boolean }) {
  const tx = (sig?: string | null) => (sig ? `${explorer}/tx/${sig}` : null);
  const burnedTokens = settle.burn?.raw != null ? settle.burn.raw / 10 ** decimals : settle.buy?.tokensRaw != null ? settle.buy.tokensRaw / 10 ** decimals : null;

  if (settle.mode === "dry") {
    return (
      <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4 text-left text-sm text-amber-100/90">
        <div className="mb-1 font-display text-amber-300">DRY RUN</div>
        {settle.note}
      </div>
    );
  }

  const bigBurn = settle.status === "burned" && burnedTokens != null;
  return (
    <div className="mt-5">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        className={cn("mx-auto flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-orange-600 via-red-600 to-orange-500 px-5 py-2 font-display text-white shadow-[0_0_30px_rgba(255,90,0,.5)] fire-pulse", stream ? "text-3xl" : "text-lg")}
      >
        <Flame className="flame-flicker" /> BUYBACK &amp; BURN <Flame className="flame-flicker" />
      </motion.div>

      {bigBurn && (
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 180 }} className="mt-4">
          <div className={cn("font-mono font-bold text-white", stream ? "text-6xl" : "text-4xl")}>{compact(burnedTokens)}</div>
          <div className="text-xs tracking-widest text-orange-300">${ticker} BURNED FOREVER</div>
        </motion.div>
      )}

      <ul className="mx-auto mt-5 max-w-sm space-y-2.5">
        {settle.claim?.lamports ? (
          <Step done busy={false} href={tx(settle.claim.sig)}>
            Claimed <b>{sol(lamports(settle.claim.lamports), 4)} SOL</b> of creator rewards
          </Step>
        ) : null}
        <Step done={!!settle.buy?.sig || !!settle.buy?.demo} busy={settle.stage === "buying"} href={tx(settle.buy?.sig)}>
          {settle.status === "won_small" ? (
            <>Pot too small to buy — it rolls over</>
          ) : (
            <>
              Bought <b>{sol(lamports(settle.buy?.lamports ?? settle.potLamports), 4)} SOL</b> of ${ticker}
            </>
          )}
        </Step>
        {settle.status !== "won_small" && (
          <Step done={settle.status === "burned"} busy={settle.stage === "burning"} href={tx(settle.burn?.sig)}>
            Burned {burnedTokens != null ? <b>{compact(burnedTokens)}</b> : "the bag"} ${ticker}
          </Step>
        )}
      </ul>
      {settle.mode === "demo" && <div className="mt-3 text-[11px] text-white/40">demo — the coin is not live yet, nothing was sent</div>}
      {(settle.status === "buy_failed" || settle.status === "burn_pending") && <div className="mt-3 text-xs text-amber-300/80">{settle.note}</div>}
      {settle.burn?.sig && <div className="mt-2 font-mono text-[10px] text-white/30">{short(settle.burn.sig, 8, 8)}</div>}
    </div>
  );
}
