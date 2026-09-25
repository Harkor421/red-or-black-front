"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, CheckCircle2, ClipboardPaste, Loader2, Trophy, Wallet } from "lucide-react";
import { looksLikeWallet, setWallet, useLive } from "@/lib/live";
import { cn, compact, short, sol } from "@/lib/format";

/**
 * Where you say who you are. No wallet connection and no signature: the
 * address is only ever used to pay you, so typing someone else's would only
 * pay them.
 */
export function WalletBox() {
  const live = useLive();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const ticker = live.brand.ticker;
  const minHold = live.coin?.minHold ?? live.me?.minHold ?? null;
  const pump = live.coin ? `https://pump.fun/coin/${live.coin.mint}` : null;
  const valid = looksLikeWallet(draft.trim());

  function save() {
    if (!valid) return;
    setWallet(draft.trim());
    setDraft("");
    setEditing(false);
  }

  async function paste() {
    try {
      const t = (await navigator.clipboard.readText()).trim();
      setDraft(t);
      if (looksLikeWallet(t)) {
        setWallet(t);
        setDraft("");
        setEditing(false);
      }
    } catch {
      /* clipboard blocked: the field still takes a normal paste */
    }
  }

  const showInput = !live.wallet || editing;
  const me = live.me;

  return (
    <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4">
      <AnimatePresence mode="wait" initial={false}>
        {showInput ? (
          <motion.div key="input" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
            <div className="mb-2 flex items-center gap-2 font-display text-xs tracking-widest text-white/70">
              <Wallet size={14} className="text-[#f5c542]" /> YOUR WALLET
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Paste your Solana wallet address"
                spellCheck={false}
                autoComplete="off"
                className={cn(
                  "min-w-0 flex-1 rounded-xl border bg-black/50 px-3 py-2.5 font-mono text-sm text-white outline-none placeholder:text-white/30 focus:border-[#f5c542]/60",
                  draft && !valid ? "border-red-500/60" : "border-white/10"
                )}
              />
              {draft ? (
                <button disabled={!valid} className="rounded-xl bg-[#f5c542] px-4 font-display text-sm text-black transition hover:brightness-110 disabled:opacity-40">
                  PLAY
                </button>
              ) : (
                <button type="button" onClick={paste} className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white/80 hover:bg-white/10">
                  <ClipboardPaste size={16} /> Paste
                </button>
              )}
            </form>
            <p className="mt-2 text-[11px] leading-relaxed text-white/45">
              Free to play — no connect, no signature. The address is only used to pay you.
              {live.mode !== "demo" && minHold != null && (
                <>
                  {" "}
                  Hold at least <b className="text-white/80">{compact(minHold)} ${ticker}</b> at the bell to cash in.
                </>
              )}
            </p>
          </motion.div>
        ) : (
          <motion.div key="set" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[#f5c542] to-[#b07d17] text-black">
                <Wallet size={16} />
              </span>
              <div>
                <div className="font-mono text-sm text-white">{short(live.wallet, 5, 5)}</div>
                <button onClick={() => setEditing(true)} className="text-[11px] text-white/40 underline-offset-2 hover:text-white hover:underline">
                  change
                </button>
              </div>
            </div>

            <div className="ml-auto flex flex-wrap items-center justify-end gap-2 text-xs">
              {live.mode === "demo" ? (
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/70">demo — every wallet counts</span>
              ) : me?.excluded ? (
                <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-1 text-red-300">
                  <AlertTriangle size={13} /> this address can&apos;t be paid
                </span>
              ) : me?.eligible === true ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-1 text-emerald-300">
                  <CheckCircle2 size={13} /> eligible · {compact(me.holding)} ${ticker}
                </span>
              ) : me?.eligible === false ? (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-1 text-amber-200">
                  <AlertTriangle size={13} /> hold {compact(me.minHold ?? minHold)} ${ticker} to cash in
                  {pump && (
                    <a href={pump} target="_blank" rel="noreferrer" className="font-bold text-amber-100 underline underline-offset-2">
                      buy
                    </a>
                  )}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-white/40">
                  <Loader2 size={13} className="animate-spin" /> checking
                </span>
              )}
              {me?.won && me.won.wins > 0 && (
                <motion.span
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 rounded-full bg-[#f5c542]/15 px-2.5 py-1 font-semibold text-[#f5c542]"
                >
                  <Trophy size={13} /> won {sol(me.won.sol, 4)} SOL · {me.won.wins}×
                </motion.span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
