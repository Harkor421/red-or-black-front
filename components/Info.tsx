"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Dices, ExternalLink, Flame, Loader2, RefreshCcw, ShieldCheck, Timer, XCircle } from "lucide-react";
import { useLive } from "@/lib/live";
import { cn, lamports, short, sol } from "@/lib/format";
import { verifyRound } from "@/lib/wheel";
import type { Settle } from "@/lib/types";

export function HowItWorks() {
  const live = useLive();
  const mins = Math.round((live.rules?.roundMs ?? 300_000) / 60_000);
  const ticker = live.brand.ticker;
  const steps = [
    { icon: <Timer />, title: `${mins} minutes to pick`, body: "Every round, tap RED or BLACK. It's free — no wallet, no bet. Switch as often as you like until the bell." },
    { icon: <Dices />, title: "The wheel spins", body: "At the bell the majority color is locked in and a public drand beacon — not us — decides where the ball lands." },
    { icon: <Flame />, title: "Win → buyback & burn", body: `If the ball lands on the community's color, the whole pot of creator rewards buys $${ticker} and burns it. On chain, with the signatures.` },
    { icon: <RefreshCcw />, title: "Lose → the pot rolls over", body: "Nothing is lost. The pot carries to the next spin and keeps growing with every trade until the community hits." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center font-display text-3xl text-white sm:text-4xl">HOW IT WORKS</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -6, rotate: i % 2 ? 1 : -1 }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.01] p-5"
          >
            <div className="absolute -top-4 -right-2 font-display text-7xl text-white/5">{i + 1}</div>
            <div className={cn("flex size-10 items-center justify-center rounded-xl", i % 2 ? "bg-white/10 text-white" : "bg-[#e11d2e]/20 text-[#ff4a57]")}>{s.icon}</div>
            <div className="mt-3 font-display text-lg text-white">{s.title}</div>
            <p className="mt-1 text-sm leading-relaxed text-white/60">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function Fairness({ picked }: { picked: Settle | null }) {
  const live = useLive();
  const rows = live.history.filter((r) => r.drand && r.result);
  const r = picked && picked.drand ? picked : rows[0] ?? null;
  const [state, setState] = useState<{ id: number; busy: boolean; ok?: boolean; msg?: string } | null>(null);
  const explorer = live.rules?.explorer ?? "https://solscan.io";

  async function run() {
    if (!r || !r.result || !live.rules) return;
    setState({ id: r.id, busy: true });
    try {
      const v = await verifyRound({
        roundId: r.id,
        beacon: r.beacon,
        chainHash: live.rules.drand.chainHash,
        drandUrl: live.rules.drand.url,
        claimed: r.result,
        tie: r.tie,
        pick: r.pick,
      });
      setState({
        id: r.id,
        busy: false,
        ok: v.sigOk && v.matches,
        msg: v.sigOk && v.matches ? `drand #${r.beacon} → pocket ${v.derived.number} ${v.derived.color}. Matches.` : `Derived ${v.derived.number} ${v.derived.color} — does not match!`,
      });
    } catch (e) {
      setState({ id: r.id, busy: false, ok: false, msg: (e as Error).message });
    }
  }

  const st = state && r && state.id === r.id ? state : null;

  return (
    <section id="fair" className="mx-auto max-w-4xl px-4 pb-20">
      <div className="rounded-3xl border border-emerald-400/20 bg-gradient-to-b from-emerald-400/[0.06] to-transparent p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-emerald-300" />
          <h2 className="font-display text-2xl text-white">PROVABLY FAIR</h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/65">
          The ball is decided by <b className="text-white">drand quicknet</b>, a public randomness beacon signed by an independent network (Cloudflare, Protocol Labs, EPFL…).
          The beacon round each spin uses is fixed when the round opens and only exists <b className="text-white">after</b> the bell — nobody, us included, can know or choose it
          while votes are open. The wheel has 18 red and 18 black pockets, no zero.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-black/50 p-4 font-mono text-[11px] leading-relaxed text-emerald-200/90">
{`pocket = WHEEL[ uint64(sha256(randomness + ":" + roundId + ":spin")) mod 36 ]
tie    = sha256(randomness + ":" + roundId + ":tie")[0] is even ? red : black`}
        </pre>

        {r ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <Field k="round" v={String(r.id)} />
              <Field k="drand beacon" v={`#${r.beacon}`} href={r.drand?.url} />
              <Field k="randomness" v={short(r.drand?.randomness, 10, 10)} />
              <Field k="votes" v={`${r.votes.red} red · ${r.votes.black} black → ${r.pick}${r.tie ? " (tie)" : ""}`} />
              <Field k="result" v={r.result ? `${r.result.number} ${r.result.color}` : "void"} />
              <Field k="outcome" v={r.win ? "community won" : "rolled over"} />
              {r.claim?.sig && <Field k="claim" v={short(r.claim.sig, 6, 6)} href={`${explorer}/tx/${r.claim.sig}`} />}
              {r.buy?.sig && <Field k="buyback" v={`${sol(lamports(r.buy.lamports), 4)} SOL`} href={`${explorer}/tx/${r.buy.sig}`} />}
              {r.burn?.sig && <Field k="burn" v={short(r.burn.sig, 6, 6)} href={`${explorer}/tx/${r.burn.sig}`} />}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button onClick={run} className="flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-bold text-black hover:brightness-110">
                {st?.busy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Verify this spin in your browser
              </button>
              {st && !st.busy && (
                <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className={cn("flex items-center gap-1.5 text-sm", st.ok ? "text-emerald-300" : "text-red-400")}>
                  {st.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />} {st.msg}
                </motion.span>
              )}
            </div>
            <div className="mt-2 text-[11px] text-white/35">Fetched straight from drand, not from our server. Tap any spin on the board to check that one.</div>
          </div>
        ) : (
          <div className="mt-5 text-sm text-white/40">The first spin will show up here to verify.</div>
        )}
      </div>
    </section>
  );
}

function Field({ k, v, href }: { k: string; v: string; href?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
      <span className="text-white/40">{k}</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-mono text-white/85 hover:text-white">
          {v} <ExternalLink size={12} />
        </a>
      ) : (
        <span className="font-mono text-white/85">{v}</span>
      )}
    </div>
  );
}
