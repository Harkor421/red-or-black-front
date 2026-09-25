"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Eye, Radio, Volume2, VolumeX } from "lucide-react";
import { useLive } from "@/lib/live";
import { cn, short } from "@/lib/format";
import { onSound, restoreSound, setSound, soundOn } from "@/lib/sound";

export function Logo({ size = "md" }: { size?: "md" | "xl" }) {
  const big = size === "xl";
  return (
    <div className={cn("flex items-center font-display leading-none tracking-wide", big ? "gap-4 text-7xl" : "gap-2 text-xl sm:text-2xl")}>
      <span className="logo-red">RED</span>
      <motion.span
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        className={cn("inline-block rounded-full border-2 border-[#f5c542] bg-[conic-gradient(#e11d2e_0_25%,#111_0_50%,#e11d2e_0_75%,#111_0)]", big ? "size-14" : "size-5 sm:size-6")}
      />
      <span className={cn("text-white/60", big ? "text-5xl" : "text-sm sm:text-base")}>OR</span>
      <span className="logo-black">BLACK</span>
    </div>
  );
}

function ModeBadge() {
  const live = useLive();
  if (!live.ready) return null;
  const m = live.mode;
  return (
    <span
      title={live.modeNote}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1 font-display text-[10px] tracking-widest",
        m === "live" ? "bg-[#e11d2e] text-white" : m === "dry" ? "bg-amber-400/15 text-amber-300" : "bg-white/10 text-white/70"
      )}
    >
      {m === "live" && <span className="live-dot !bg-white" />}
      {m === "live" ? "LIVE" : m === "dry" ? "DRY RUN" : "DEMO"}
    </span>
  );
}

export function CopyCA({ big = false }: { big?: boolean }) {
  const live = useLive();
  const [copied, setCopied] = useState(false);
  const ca = live.coin?.mint;
  if (!ca) return <span className={cn("rounded-full border border-white/10 px-3 py-1.5 font-mono text-white/40", big ? "text-lg" : "text-xs")}>CA: launching soon</span>;
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(ca).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      className={cn("flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-white/80 transition hover:bg-white/10", big ? "text-lg" : "text-xs")}
    >
      <span className="text-white/40">CA</span> {big ? ca : short(ca, 5, 5)}
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
  );
}

function SoundToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    restoreSound();
    setOn(soundOn());
    const off = onSound(setOn);
    return () => {
      off();
    };
  }, []);
  return (
    <button onClick={() => setSound(!on)} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:text-white" aria-label={on ? "Mute" : "Sound on"}>
      {on ? <Volume2 size={16} /> : <VolumeX size={16} />}
    </button>
  );
}

export function Header() {
  const live = useLive();
  const pump = live.coin ? `https://pump.fun/coin/${live.coin.mint}` : null;
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#07070a]/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Logo />
        <ModeBadge />
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 text-xs text-white/50 sm:flex">
            <Eye size={14} /> {live.viewers}
          </span>
          <div className="hidden md:block">
            <CopyCA />
          </div>
          {pump && (
            <a href={pump} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full bg-[#e11d2e] px-3 py-1.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(225,29,46,.5)] hover:brightness-110">
              <Radio size={14} className="animate-pulse" /> <span className="hidden sm:inline">WATCH</span> LIVE
            </a>
          )}
          {live.brand.twitter && (
            <a href={live.brand.twitter} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80 hover:text-white">
              𝕏
            </a>
          )}
          <SoundToggle />
        </div>
      </div>
    </header>
  );
}

export function ModeBanner() {
  const live = useLive();
  if (!live.ready || live.mode === "live") return null;
  return (
    <div className={cn("mx-auto mt-4 max-w-3xl rounded-2xl border px-4 py-2.5 text-center text-xs", live.mode === "dry" ? "border-amber-400/25 bg-amber-400/5 text-amber-200/90" : "border-white/10 bg-white/[0.03] text-white/60")}>
      {live.mode === "demo" ? (
        <>
          <b className="text-white">DEMO</b> — the coin isn&apos;t launched yet. Picks and spins are real, the pot is simulated and every wallet counts.
        </>
      ) : (
        <>
          <b className="text-amber-300">DRY RUN</b> — real picks, real spins, real holdings, the real pot. Payouts are simulated on mainnet, nothing is sent yet.
        </>
      )}
    </div>
  );
}

export function Toast() {
  const live = useLive();
  const [shown, setShown] = useState<{ key: number; text: string } | null>(null);
  useEffect(() => {
    if (!live.toast) return;
    setShown(live.toast);
    const t = setTimeout(() => setShown(null), 2200);
    return () => clearTimeout(t);
  }, [live.toast]);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[90] flex justify-center">
      <AnimatePresence>
        {shown && (
          <motion.div key={shown.key} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black shadow-xl">
            {shown.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
