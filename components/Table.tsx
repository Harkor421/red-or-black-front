"use client";

// The choreography. The backend says what happened; this decides when the
// page shows it:
//
//   bell ("locked")     → the ball is launched and the wheel speeds up
//   beacon ("spinning") → both decelerate onto the result pocket (8 s)
//   landed              → the result card, then back to idle
//
// Everything after the landing (buying, burning) streams into the result card
// as it happens. A viewer who arrives late sees the ball already in its pocket.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Wheel, type WheelHandle } from "./Wheel";
import { ResultOverlay } from "./ResultOverlay";
import { serverNow, useLive } from "@/lib/live";
import { useNow } from "@/lib/useNow";
import { clock, cn } from "@/lib/format";
import * as sfx from "@/lib/sound";

type Phase = "idle" | "anticipate" | "landing" | "reveal";

export function Table({ stream = false }: { stream?: boolean }) {
  const live = useLive();
  const now = useNow(200);
  const wheel = useRef<WheelHandle>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [revealId, setRevealId] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<number | null>(null);
  const handled = useRef<number | null>(null);
  const launched = useRef<number | null>(null);
  const booted = useRef(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // First paint: the ball sits in the last result's pocket.
  useEffect(() => {
    if (!live.ready || booted.current) return;
    booted.current = true;
    const last = live.history.find((r) => r.result);
    wheel.current?.idle(last?.result?.index ?? null);
    setHighlight(last?.result?.index ?? null);
    if (live.settling) handled.current = live.settling.result ? live.settling.id : null;
  }, [live.ready, live.history, live.settling]);

  useEffect(() => {
    const s = live.settling;
    if (!s || !booted.current || handled.current === s.id) return;
    const age = serverNow() - s.endsAt;

    if (!s.result) {
      if (s.stage === "done") {
        // Void: no beacon, no spin.
        handled.current = s.id;
        wheel.current?.idle(null);
        showReveal(s.id, 9000);
        return;
      }
      if (launched.current !== s.id && age < 60_000) {
        launched.current = s.id;
        setHighlight(null);
        setPhase("anticipate");
        wheel.current?.anticipate();
        sfx.bell();
      }
      return;
    }

    handled.current = s.id;
    if (age > 45_000) {
      wheel.current?.idle(s.result.index);
      setHighlight(s.result.index);
      return;
    }
    if (launched.current !== s.id) {
      launched.current = s.id;
      setHighlight(null);
      wheel.current?.anticipate();
    }
    setPhase("landing");
    const index = s.result.index;
    const won = s.win;
    wheel.current?.land(index).then(() => {
      setHighlight(index);
      if (won) sfx.win();
      else sfx.lose();
      showReveal(s.id, won ? 16_000 : 10_000);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live.settling]);

  function showReveal(id: number, ms: number) {
    setRevealId(id);
    setPhase("reveal");
    if (revealTimer.current) clearTimeout(revealTimer.current);
    revealTimer.current = setTimeout(() => {
      setPhase("idle");
      setRevealId(null);
    }, ms);
  }

  const r = live.round;
  const left = r ? Math.min(r.lengthMs, Math.max(0, r.endsAt - now)) : 0;
  const progress = r ? 1 - left / r.lengthMs : 0;
  const urgent = phase === "idle" && left > 0 && left <= 10_000;
  const settle = live.settling;
  const revealed = revealId != null && settle?.id === revealId ? settle : live.history.find((h) => h.id === revealId) ?? null;
  const spinning = phase === "anticipate" || phase === "landing";

  return (
    <>
      <div className={cn("relative mx-auto w-full", stream ? "max-w-[780px]" : "max-w-[560px]")}>
        <Wheel ref={wheel} progress={progress} urgent={urgent} highlight={highlight} spinning={spinning}>
          <Hub phase={phase} left={left} ready={live.ready && !!r} urgent={urgent} beacon={settle?.beacon} result={revealed?.result ?? null} stream={stream} />
        </Wheel>
      </div>

      {/* while the previous round spins, the next one is already open */}
      <AnimatePresence>
        {phase !== "idle" && r && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn("mx-auto mt-3 w-fit rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-white/70", stream ? "text-2xl" : "text-sm")}
          >
            Next round is open · <span className="font-mono text-white">{clock(left)}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <ResultOverlay settle={revealed} open={phase === "reveal" && !!revealed} onClose={() => setPhase("idle")} stream={stream} />
    </>
  );
}

function Hub({
  phase,
  left,
  ready,
  urgent,
  beacon,
  result,
  stream,
}: {
  phase: Phase;
  left: number;
  ready: boolean;
  urgent: boolean;
  beacon?: number;
  result: { number: number; color: "red" | "black" } | null;
  stream: boolean;
}) {
  const big = stream ? "text-[88px]" : "text-[clamp(38px,11vw,64px)]";
  return (
    <AnimatePresence mode="wait">
      {phase === "anticipate" || phase === "landing" ? (
        <motion.div key="spin" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} className="text-center">
          <div className={cn("font-display leading-none text-[#f5c542] no-more-bets", stream ? "text-5xl" : "text-[clamp(16px,4.2vw,26px)]")}>
            NO MORE
            <br />
            BETS
          </div>
          <div className={cn("mt-1 font-mono text-white/50", stream ? "text-lg" : "text-[10px]")}>
            {phase === "anticipate" ? `waiting for drand #${beacon ?? "…"}` : "spinning…"}
          </div>
        </motion.div>
      ) : phase === "reveal" && result ? (
        <motion.div
          key="result"
          initial={{ scale: 0.3, rotate: -30, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
          className={cn(
            "flex aspect-square w-[78%] flex-col items-center justify-center rounded-full border-4 border-[#f5c542]",
            result.color === "red" ? "bg-[#e11d2e]" : "bg-[#0b0b0e]"
          )}
        >
          <div className={cn("font-display leading-none text-white", big)}>{result.number}</div>
          <div className={cn("font-display tracking-widest text-white/90", stream ? "text-3xl" : "text-xs")}>{result.color.toUpperCase()}</div>
        </motion.div>
      ) : (
        <motion.div key="clock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
          <div className={cn("font-display tracking-wider text-white/60", stream ? "text-2xl" : "text-[clamp(9px,2.4vw,12px)]")}>
            {urgent ? "LAST CALL" : "PICK A COLOR"}
          </div>
          <div className={cn("font-mono font-bold tabular-nums leading-none", big, urgent ? "text-[#ff2d3d] urgent-pulse" : "text-white")}>
            {ready ? clock(left) : "--:--"}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
