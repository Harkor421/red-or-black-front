"use client";

import { useEffect, useState } from "react";

// Two slow blobs of colour and suits drifting up through the dark. Generated
// after mount so the server render and the first client render agree.

const SUITS = ["♥", "♠", "♦", "♣"];

export function Background() {
  const [suits, setSuits] = useState<{ s: string; left: number; size: number; dur: number; delay: number; red: boolean }[]>([]);
  useEffect(() => {
    setSuits(
      Array.from({ length: 22 }, (_, i) => ({
        s: SUITS[i % 4],
        left: Math.random() * 100,
        size: 14 + Math.random() * 34,
        dur: 16 + Math.random() * 22,
        delay: -Math.random() * 30,
        red: i % 2 === 0,
      }))
    );
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#07070a]">
      <div className="blob blob-red" />
      <div className="blob blob-dark" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#07070a_75%)]" />
      <div className="felt absolute inset-0 opacity-[0.05]" />
      {suits.map((x, i) => (
        <span
          key={i}
          className="suit"
          style={{ left: `${x.left}%`, fontSize: x.size, animationDuration: `${x.dur}s`, animationDelay: `${x.delay}s`, color: x.red ? "rgba(225,29,46,.18)" : "rgba(255,255,255,.07)" }}
        >
          {x.s}
        </span>
      ))}
    </div>
  );
}
