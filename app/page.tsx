"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Background } from "@/components/Background";
import { CopyCA, Header, ModeBanner, Toast } from "@/components/Header";
import { Table } from "@/components/Table";
import { VoteButtons } from "@/components/VoteButtons";
import { Pot } from "@/components/Pot";
import { Feed, History, Stats, Winners } from "@/components/Board";
import { WalletBox } from "@/components/WalletBox";
import { Fairness, HowItWorks } from "@/components/Info";
import { useLive } from "@/lib/live";
import type { Settle } from "@/lib/types";

export default function Home() {
  const live = useLive();
  const [picked, setPicked] = useState<Settle | null>(null);
  const ticker = live.brand.ticker;

  return (
    <>
      <Background />
      <Header />
      <ModeBanner />

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start xl:grid-cols-[minmax(0,1fr)_minmax(0,560px)_minmax(0,1fr)]">
        <div className="order-2 space-y-4 lg:col-start-2 lg:row-start-1 xl:col-start-1">
          <Pot />
          <Stats />
          <Winners />
        </div>

        <div className="order-1 lg:col-start-1 lg:row-span-2 lg:row-start-1 xl:col-start-2 xl:row-span-1">
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-center font-display text-sm tracking-wide text-white/70 sm:text-base"
          >
            PICK A COLOR. IF THE BALL LANDS ON IT, <span className="text-[#f5c542]">YOU SPLIT THE POT.</span>
          </motion.p>
          <Table />
          <div className="mt-6">
            <WalletBox />
            <VoteButtons />
          </div>
        </div>

        <div className="order-3 space-y-4 lg:col-start-2 lg:row-start-2 xl:col-start-3 xl:row-start-1">
          <History
            onPick={(r) => {
              setPicked(r);
              document.getElementById("fair")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
          <Feed />
        </div>
      </main>

      <HowItWorks />
      <Fairness picked={picked} />

      <footer className="border-t border-white/5 py-10 text-center">
        <div className="flex justify-center">
          <CopyCA />
        </div>
        <p className="mx-auto mt-4 max-w-xl px-4 text-[11px] leading-relaxed text-white/35">
          Picking is free and nobody wagers anything: the only thing on the table is the creator rewards of ${ticker}, split between the wallets that call the color. Every
          spin is verifiable from a public beacon, and every claim and payout links to its transaction. Not financial advice.
        </p>
      </footer>
      <Toast />
    </>
  );
}
