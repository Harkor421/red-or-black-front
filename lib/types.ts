export type Side = "red" | "black";
export type Mode = "demo" | "dry" | "live";

export type Counts = { red: number; black: number };

export type Round = {
  id: number;
  startedAt: number;
  endsAt: number;
  lengthMs: number;
  beacon: number;
  beaconAt: number;
  counts: Counts;
  eligibleCounts: Counts;
  voters: number;
};

export type Payout = { wallet: string; lamports: number; sig: string | null };

export type Settle = {
  id: number;
  startedAt: number;
  endsAt: number;
  mode: Mode;
  votes: Counts;
  eligibleVotes: Counts;
  voters: number;
  beacon: number;
  beaconAt: number;
  beaconUrl: string;
  drand: { round: number; randomness: string; signature: string; url: string } | null;
  result: { index: number; number: number; color: Side } | null;
  /** Wallets that picked the winning colour, and how many of them held the minimum. */
  winners: number;
  eligible: number;
  shareLamports: number;
  totalLamports: number;
  payouts: Payout[];
  win: boolean | null;
  stage: "locked" | "spinning" | "paying" | "done";
  status: "paid" | "partial" | "pay_failed" | "rollover" | "too_small" | "void" | "dry" | null;
  potLamports: number | null;
  claim: { sig?: string; lamports?: number; error?: string; skipped?: boolean; dry?: boolean; simulated?: string } | null;
  note: string | null;
  settledAt: number | null;
};

export type Pot = {
  lamports: number;
  sol: number;
  usd: number | null;
  carried: number;
  claimable: number;
  wallet: number | null;
  solUsd: number | null;
  at: number;
};

export type Coin = {
  mint: string;
  creator: string | null;
  venue: "curve" | "amm";
  decimals: number;
  mcapSol: number | null;
  mcapUsd: number | null;
  minHold: number | null;
};

export type Totals = {
  rounds: number;
  paidRounds: number;
  rollovers: number;
  voids: number;
  solPaid: number;
  walletsPaid: number;
  claimed: number;
  biggestShare: number;
  solPaidSol: number;
  claimedSol: number;
  biggestShareSol: number;
  streak: { kind: "paid" | "rollover" | null; n: number };
};

export type Rules = {
  roundMs: number;
  minHoldPct: number;
  minShareSol: number;
  maxPayoutSol: number | null;
  explorer: string;
  drand: { chainHash: string; genesis: number; period: number; url: string };
};

export type Brand = { name: string; ticker: string; twitter: string; site: string };

export type FeedItem = { key: string; wallet: string; side: Side; at: number; switched: boolean; eligible: boolean | null };

export type Me = {
  roundId: number | null;
  side: Side | null;
  eligible?: boolean | null;
  holding?: number | null;
  minHold?: number | null;
  excluded?: boolean;
  won?: { lamports: number; sol: number; wins: number };
};

export type LiveState = {
  connected: boolean;
  ready: boolean;
  offset: number;
  viewers: number;
  brand: Brand;
  mode: Mode;
  modeNote: string;
  coin: Coin | null;
  round: Round | null;
  pot: Pot | null;
  history: Settle[];
  settling: Settle | null;
  totals: Totals | null;
  rules: Rules | null;
  feed: FeedItem[];
  wallet: string | null;
  me: Me | null;
  toast: { key: number; text: string } | null;
};
