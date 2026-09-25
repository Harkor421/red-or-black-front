"use client";

// The stream view. Point an OBS browser source at /live (1920×1080): a fixed
// 16:9 stage scaled to whatever window it is in, no scrolling, nothing to
// click. ?sound=1 turns the ball, the bell and the burn on from the start.

import { useEffect, useState } from "react";
import { Background } from "@/components/Background";
import { CopyCA, Logo } from "@/components/Header";
import { Table } from "@/components/Table";
import { VoteButtons } from "@/components/VoteButtons";
import { Pot } from "@/components/Pot";
import { History, Stats } from "@/components/Board";
import { useLive } from "@/lib/live";
import { restoreSound } from "@/lib/sound";

const W = 1920;
const H = 1080;

export default function LivePage() {
  const live = useLive();
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / W, window.innerHeight / H));
    fit();
    window.addEventListener("resize", fit);
    if (new URLSearchParams(location.search).get("sound") === "1") restoreSound(true);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const site = live.brand.site?.replace(/^https?:\/\//, "") || "";

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Background />
      <div className="absolute top-1/2 left-1/2" style={{ width: W, height: H, transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div className="flex h-full flex-col px-14 py-10">
          <div className="flex items-center justify-between">
            <Logo size="xl" />
            <div className="flex items-center gap-4">
              {live.mode !== "live" && (
                <span className="rounded-full bg-white/10 px-5 py-2 font-display text-2xl tracking-widest text-white/70">{live.mode === "dry" ? "DRY RUN" : "DEMO"}</span>
              )}
              <CopyCA big />
            </div>
          </div>

          <div className="mt-8 grid flex-1 grid-cols-[1fr_800px_1fr] gap-10">
            <div className="flex flex-col gap-6">
              <Pot stream />
              <Stats stream />
            </div>
            <div>
              <Table stream />
            </div>
            <div className="flex flex-col gap-6">
              <VoteButtons stream />
              <History stream max={20} />
              <div className="rounded-3xl border border-[#f5c542]/30 bg-[#f5c542]/5 p-6 text-center">
                <div className="font-display text-2xl text-white/70">PICK YOUR COLOR AT</div>
                <div className="mt-1 font-display text-4xl text-[#f5c542]">{site || "the link in the description"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
