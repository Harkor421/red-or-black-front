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
  voters: number;
};

export type Settle = {
  id: number;
  startedAt: number;
  endsAt: number;
  mode: Mode;
  votes: Counts;
  voters: number;
  pick: Side | null;
  tie: boolean;
  beacon: number;
  beaconAt: number;
  beaconUrl: string;
  drand: { round: number; randomness: string; signature: string; url: string } | null;
  result: { index: number; number: number; color: Side } | null;
  win: boolean | null;
  stage: "locked" | "spinning" | "buying" | "burning" | "done";
  status: "lost" | "void" | "burned" | "burn_pending" | "won_small" | "buy_failed" | "dry_win" | null;
  potLamports: number | null;
  claim: { sig?: string; lamports?: number; error?: string; skipped?: boolean; dry?: boolean; simulated?: string } | null;
  buy: { sig?: string | null; lamports?: number; tokensRaw?: number; venue?: string | null; demo?: boolean; dry?: boolean; simulated?: string | null } | null;
  burn: { sig?: string | null; raw?: number; demo?: boolean } | null;
  note: string | null;
  settledAt: number | null;
};

export type Pot = {
  lamports: number;
  sol: number;
  usd: number | null;
  carried: number;
  claimable: number;
  pendingBurnRaw: number;
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
};

export type Totals = {
  rounds: number;
  wins: number;
  losses: number;
  voids: number;
  burnedRaw: number;
  solSpent: number;
  claimed: number;
  buybacks: number;
  burned: number;
  solSpentSol: number;
  claimedSol: number;
  streak: { kind: "win" | "loss" | null; n: number };
};

export type Rules = {
  roundMs: number;
  minBuySol: number;
  burnMode: string;
  explorer: string;
  drand: { chainHash: string; genesis: number; period: number; url: string };
};

export type Brand = { name: string; ticker: string; twitter: string; site: string };

export type FeedItem = { key: string; who: string; side: Side; at: number; switched: boolean };

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
  me: { roundId: number; side: Side | null } | null;
  toast: { key: number; text: string } | null;
};
