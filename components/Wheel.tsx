"use client";

// The wheel. Three stacked layers, each rotated by a plain HTML transform
// (SVG transform-origin is unreliable across browsers; a div's is not):
//
//   rim      static: wood, gold, chasing bulbs, the countdown ring
//   wheel    rotates: pockets, numbers, the cone and the turret
//   ball     rotates the other way, on its own radius
//
// The landing is solved, not faked: the ball decelerates to 12 o'clock and the
// wheel decelerates to whatever angle puts the result pocket there, with both
// eases starting at the speed they were already spinning, so there is no jump.

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform, type AnimationPlaybackControls } from "motion/react";
import { WHEEL, POCKET_DEG, colorOf } from "@/lib/wheel";
import { tick as tickSound } from "@/lib/sound";

export type WheelHandle = {
  idle: (index: number | null) => void;
  anticipate: () => void;
  land: (index: number) => Promise<void>;
};

const C = 250;
const R_RIM = 246;
const R_TRACK_OUT = 232;
const R_BALL_TRACK = 216;
const R_NUM_OUT = 202;
const R_NUM_IN = 168;
const R_POCKET_IN = 136;
const R_BALL_POCKET = 152;

const IDLE_SPEED = 9; // deg/s
const SPIN_WHEEL = 150;
const SPIN_BALL = 470;
const LAND_S = 8;

// Rounded: Node and the browser disagree in the last digits of sin/cos, and
// an SVG path that differs by 1e-14 is a hydration mismatch.
const r3 = (n: number) => Math.round(n * 1000) / 1000;
const polar = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [r3(C + r * Math.sin(a)), r3(C - r * Math.cos(a))] as const;
};

function wedge(r1: number, r2: number, a1: number, a2: number) {
  const [x1, y1] = polar(r2, a1);
  const [x2, y2] = polar(r2, a2);
  const [x3, y3] = polar(r1, a2);
  const [x4, y4] = polar(r1, a1);
  return `M${x1},${y1} A${r2},${r2} 0 0 1 ${x2},${y2} L${x3},${y3} A${r1},${r1} 0 0 0 ${x4},${y4} Z`;
}

const RED = "#e11d2e";
const RED_DEEP = "#8a0c17";
const BLACK = "#121216";
const BLACK_DEEP = "#050507";

type Props = {
  /** 0..1 of the round elapsed, for the countdown ring. */
  progress: number;
  urgent: boolean;
  highlight: number | null;
  spinning: boolean;
  children?: ReactNode;
};

export const Wheel = forwardRef<WheelHandle, Props>(function Wheel({ progress, urgent, highlight, spinning, children }, ref) {
  const wheelRot = useMotionValue(0);
  const ballRot = useMotionValue(0);
  const ballR = useMotionValue(R_BALL_POCKET);
  const ballOpacity = useMotionValue(0);
  const ballCy = useTransform(ballR, (r) => C - r);
  const ctrls = useRef<AnimationPlaybackControls[]>([]);
  const spinningRef = useRef(false);
  const lastFret = useRef<number | null>(null);
  const lastTickAt = useRef(0);

  const stopAll = () => {
    for (const c of ctrls.current) c.stop();
    ctrls.current = [];
  };
  const norm = () => {
    const w = wheelRot.get() % 360;
    const b = ballRot.get() % 360;
    wheelRot.set(w);
    ballRot.set(b);
  };
  const loop = (mv: typeof wheelRot, speed: number) => {
    const from = mv.get();
    return animate(mv, [from, from + 360 * Math.sign(speed)], { duration: 360 / Math.abs(speed), ease: "linear", repeat: Infinity });
  };

  useImperativeHandle(ref, () => ({
    idle(index) {
      stopAll();
      norm();
      spinningRef.current = false;
      ctrls.current.push(loop(wheelRot, IDLE_SPEED));
      if (index == null) {
        ballOpacity.set(0);
        return;
      }
      ballOpacity.set(1);
      ballR.set(R_BALL_POCKET);
      ballRot.set(wheelRot.get() + index * POCKET_DEG + POCKET_DEG / 2);
      ctrls.current.push(loop(ballRot, IDLE_SPEED));
    },
    anticipate() {
      stopAll();
      norm();
      spinningRef.current = true;
      ballOpacity.set(1);
      ctrls.current.push(animate(ballR, [ballR.get(), R_BALL_TRACK + 6, R_BALL_TRACK], { duration: 0.7, ease: "easeOut" }));
      ctrls.current.push(loop(wheelRot, SPIN_WHEEL));
      ctrls.current.push(loop(ballRot, -SPIN_BALL));
    },
    async land(index) {
      stopAll();
      norm();
      spinningRef.current = true;
      ballOpacity.set(1);
      const w0 = wheelRot.get();
      const b0 = ballRot.get();
      // The ease below starts at 3× its average speed, so travelling v·D/3
      // keeps each part at the speed it was already spinning.
      const b1 = 360 * Math.round((b0 - (SPIN_BALL * LAND_S) / 3) / 360);
      const target = index * POCKET_DEG + POCKET_DEG / 2;
      let w1 = b1 - target;
      w1 += 360 * Math.round((w0 + (SPIN_WHEEL * LAND_S) / 3 - w1) / 360);
      if (w1 < w0 + 360) w1 += 360;
      const ease = [0.2, 0.6, 0.35, 1] as const;
      const a = animate(wheelRot, w1, { duration: LAND_S, ease });
      const b = animate(ballRot, b1, { duration: LAND_S, ease });
      const c = animate(ballR, [ballR.get(), R_BALL_TRACK, R_BALL_POCKET + 16, R_BALL_POCKET - 4, R_BALL_POCKET + 5, R_BALL_POCKET], {
        duration: LAND_S,
        times: [0, 0.52, 0.7, 0.8, 0.9, 1],
        ease: "easeOut",
      });
      ctrls.current.push(a, b, c);
      await Promise.all([a, b, c]);
      spinningRef.current = false;
      // Keep turning slowly with the ball riding in its pocket.
      ctrls.current = [];
      ctrls.current.push(loop(wheelRot, IDLE_SPEED), loop(ballRot, IDLE_SPEED));
    },
  }));

  useEffect(() => () => stopAll(), []);

  // The ball clicking over the frets, for anyone who turned the sound on.
  useMotionValueEvent(ballRot, "change", (b) => {
    if (!spinningRef.current) return;
    const rel = (((b - wheelRot.get()) % 360) + 360) % 360;
    const fret = Math.floor(rel / POCKET_DEG);
    if (fret !== lastFret.current) {
      lastFret.current = fret;
      const now = performance.now();
      if (now - lastTickAt.current > 45) {
        lastTickAt.current = now;
        tickSound();
      }
    }
  });

  const ringLen = 2 * Math.PI * 247;

  return (
    <div className="relative aspect-square w-full select-none" id="wheel">
      {/* glow */}
      <div
        className="absolute inset-[6%] rounded-full blur-3xl transition-colors duration-700"
        style={{ background: urgent ? "rgba(225,29,46,.55)" : spinning ? "rgba(245,197,66,.35)" : "rgba(225,29,46,.25)" }}
      />

      {/* rim */}
      <svg viewBox="0 0 500 500" className="absolute inset-0 h-full w-full drop-shadow-[0_20px_60px_rgba(0,0,0,.8)]">
        <defs>
          <radialGradient id="wood" cx="50%" cy="50%" r="50%">
            <stop offset="80%" stopColor="#3b1a0c" />
            <stop offset="92%" stopColor="#6b3416" />
            <stop offset="100%" stopColor="#2a1107" />
          </radialGradient>
          <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff1b8" />
            <stop offset="45%" stopColor="#f5c542" />
            <stop offset="100%" stopColor="#9a6b12" />
          </linearGradient>
          <radialGradient id="track" cx="50%" cy="50%" r="50%">
            <stop offset="85%" stopColor="#1a1a1f" />
            <stop offset="100%" stopColor="#2e2e36" />
          </radialGradient>
        </defs>
        <circle cx={C} cy={C} r={R_RIM} fill="url(#wood)" />
        <circle cx={C} cy={C} r={R_TRACK_OUT + 3} fill="none" stroke="url(#gold)" strokeWidth="4" />
        <circle cx={C} cy={C} r={R_TRACK_OUT} fill="url(#track)" />
        {Array.from({ length: 36 }, (_, i) => {
          const [x, y] = polar(R_TRACK_OUT + 8, i * 10 + 5);
          return <circle key={i} cx={x} cy={y} r="2.6" className="bulb" style={{ animationDelay: `${(i % 6) * 0.12}s` }} />;
        })}
        {/* the landing mark at 12 o'clock */}
        <path d={`M${C - 9},2 L${C + 9},2 L${C},20 Z`} fill="url(#gold)" stroke="#000" strokeWidth="1" />
        {/* countdown ring */}
        <circle cx={C} cy={C} r="247" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="5" />
        <circle
          cx={C}
          cy={C}
          r="247"
          fill="none"
          stroke={urgent ? "#ff2d3d" : "#f5c542"}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={ringLen}
          strokeDashoffset={ringLen * Math.min(1, Math.max(0, progress))}
          transform={`rotate(-90 ${C} ${C})`}
          style={{ transition: "stroke-dashoffset 1s linear, stroke .4s" }}
        />
      </svg>

      {/* wheel */}
      <motion.div className="absolute inset-0" style={{ rotate: wheelRot }}>
        <svg viewBox="0 0 500 500" className="h-full w-full">
          <defs>
            <radialGradient id="cone" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#5a2410" />
              <stop offset="70%" stopColor="#2b0f06" />
              <stop offset="100%" stopColor="#140603" />
            </radialGradient>
          </defs>
          {WHEEL.map((n, i) => {
            const a1 = i * POCKET_DEG;
            const a2 = a1 + POCKET_DEG;
            const red = colorOf(n) === "red";
            const [tx, ty] = polar((R_NUM_OUT + R_NUM_IN) / 2, a1 + POCKET_DEG / 2);
            return (
              <g key={n}>
                <path d={wedge(R_NUM_IN, R_NUM_OUT, a1, a2)} fill={red ? RED : BLACK} stroke="#c9a23a" strokeWidth="1" />
                <path d={wedge(R_POCKET_IN, R_NUM_IN, a1, a2)} fill={red ? RED_DEEP : BLACK_DEEP} stroke="#c9a23a" strokeWidth="1.2" />
                <text
                  x={tx}
                  y={ty}
                  fill="#fff"
                  fontSize="15"
                  fontWeight="800"
                  textAnchor="middle"
                  dominantBaseline="central"
                  transform={`rotate(${a1 + POCKET_DEG / 2} ${tx} ${ty})`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {n}
                </text>
              </g>
            );
          })}
          {highlight != null && (
            <path
              d={wedge(R_POCKET_IN - 2, R_NUM_OUT + 2, highlight * POCKET_DEG, (highlight + 1) * POCKET_DEG)}
              fill="rgba(255,236,160,.35)"
              stroke="#ffe27a"
              strokeWidth="3"
              className="pocket-glow"
            />
          )}
          <circle cx={C} cy={C} r={R_POCKET_IN} fill="url(#cone)" stroke="url(#gold)" strokeWidth="3" />
          {/* the turret */}
          {[0, 90, 180, 270].map((a) => {
            const [x, y] = polar(112, a);
            // Solid, not the gradient: a gradient in bounding-box units has nothing
            // to span on a horizontal or vertical line, and the stroke vanishes.
            return <line key={a} x1={C} y1={C} x2={x} y2={y} stroke="#d9aa3a" strokeWidth="7" strokeLinecap="round" />;
          })}
          {[0, 90, 180, 270].map((a) => {
            const [x, y] = polar(114, a);
            return <circle key={a} cx={x} cy={y} r="8" fill="url(#gold)" />;
          })}
        </svg>
      </motion.div>

      {/* ball */}
      <motion.div className="pointer-events-none absolute inset-0" style={{ rotate: ballRot, opacity: ballOpacity }}>
        <svg viewBox="0 0 500 500" className="h-full w-full overflow-visible">
          <defs>
            <radialGradient id="ball" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#e8e8ea" />
              <stop offset="100%" stopColor="#8d8d95" />
            </radialGradient>
          </defs>
          <motion.circle cx={C} cy={ballCy} r="9" fill="url(#ball)" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,.7))" }} />
        </svg>
      </motion.div>

      {/* hub */}
      <div className="absolute inset-[34%] flex items-center justify-center rounded-full border-2 border-[#f5c542]/70 bg-black/80 shadow-[inset_0_0_30px_rgba(0,0,0,.9),0_0_30px_rgba(0,0,0,.6)] backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
});
