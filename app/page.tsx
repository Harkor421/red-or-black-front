"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Background } from "@/components/Background";
import { CopyCA, Header, ModeBanner, Toast } from "@/components/Header";
import { Table } from "@/components/Table";
import { VoteButtons } from "@/components/VoteButtons";
import { Pot } from "@/components/Pot";
import { Feed, History, Stats } from "@/components/Board";
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
        </div>

        <div className="order-1 lg:col-start-1 lg:row-span-2 lg:row-start-1 xl:col-start-2 xl:row-span-1">
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-center font-display text-sm tracking-wide text-white/70 sm:text-base"
          >
            CALL THE COLOR. IF THE BALL AGREES, <span className="text-[#ff4a57]">${ticker} BURNS.</span>
          </motion.p>
          <Table />
          <div className="mt-6">
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
          Voting is free and nobody wagers anything: the only thing on the table is the creator rewards of ${ticker}. Every spin is verifiable from a public beacon, and
          every claim, buyback and burn links to its transaction. Not financial advice.
        </p>
      </footer>
      <Toast />
    </>
  );
}
