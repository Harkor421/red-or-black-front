"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import { useLive } from "@/lib/live";
import { cn, lamports, usd } from "@/lib/format";

export function Ticker({ value, digits = 3, className }: { value: number; digits?: number; className?: string }) {
  const mv = useSpring(value, { stiffness: 50, damping: 16 });
  useEffect(() => {
    mv.set(value);
  }, [mv, value]);
  const text = useTransform(mv, (v) => v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }));
  return <motion.span className={className}>{text}</motion.span>;
}

let coinId = 0;

export function Pot({ stream = false }: { stream?: boolean }) {
  const live = useLive();
  const pot = live.pot;
  const value = pot ? pot.sol : 0;
  const prev = useRef(value);
  const [coins, setCoins] = useState<{ id: number; x: number; d: number }[]>([]);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    if (value > prev.current + 1e-6 && prev.current > 0) {
      const n = Math.min(10, 3 + Math.floor((value - prev.current) * 200));
      const add = Array.from({ length: n }, () => ({ id: ++coinId, x: 10 + Math.random() * 80, d: Math.random() * 0.4 }));
      setCoins((c) => [...c, ...add]);
      setBump((b) => b + 1);
      setTimeout(() => setCoins((c) => c.filter((q) => !add.includes(q))), 1800);
    }
    prev.current = value;
  }, [value]);

  const ticker = live.brand.ticker;
  const carried = lamports(pot?.carried) ?? 0;
  const claimable = lamports(pot?.claimable) ?? 0;

  return (
    <motion.div
      key={bump}
      initial={bump ? { scale: 1.03 } : false}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 12 }}
      className={cn("relative overflow-hidden rounded-3xl border border-[#f5c542]/30 bg-gradient-to-b from-[#1c1406] to-[#0b0b0e] pot-glow", stream ? "p-8" : "p-5")}
    >
      <div className="pointer-events-none absolute inset-0">
        <AnimatePresence>
          {coins.map((c) => (
            <motion.span
              key={c.id}
              className="absolute text-xl"
              style={{ left: `${c.x}%`, top: -20 }}
              initial={{ y: 0, rotate: 0, opacity: 1 }}
              animate={{ y: 220, rotate: 360, opacity: 0 }}
              transition={{ duration: 1.4, delay: c.d, ease: "easeIn" }}
            >
              🪙
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <div className="relative">
        <div className={cn("flex items-center justify-between font-display tracking-widest text-[#f5c542]/80", stream ? "text-2xl" : "text-xs")}>
          <span>THE POT</span>
          {live.mode === "demo" && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">SIMULATED</span>}
        </div>
        <div className={cn("mt-1 flex items-baseline gap-2 font-mono font-bold text-white", stream ? "text-7xl" : "text-4xl sm:text-5xl lg:text-4xl 2xl:text-5xl")}>
          <Ticker value={value} digits={3} className="text-gold" />
          <span className={cn("font-display text-[#f5c542]", stream ? "text-4xl" : "text-xl")}>SOL</span>
        </div>
        <div className={cn("font-mono text-white/50", stream ? "text-2xl" : "text-sm")}>{usd(pot?.usd) || " "}</div>
        {!stream && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-xl bg-white/5 px-3 py-2">
              <div className="text-white/40">carried over</div>
              <div className="font-mono text-white/85">{carried.toFixed(4)} SOL</div>
            </div>
            <div className="rounded-xl bg-white/5 px-3 py-2">
              <div className="text-white/40">{live.mode === "live" ? "unclaimed rewards" : "creator rewards"}</div>
              <div className="font-mono text-white/85">{claimable.toFixed(4)} SOL</div>
            </div>
          </div>
        )}
        <p className={cn("mt-3 text-white/60", stream ? "text-xl" : "text-xs")}>
          If the ball lands on the community&apos;s color, <b className="text-white">all of it buys ${ticker} and burns it</b>. If not, it rolls over and grows.
        </p>
      </div>
    </motion.div>
  );
}
