export const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export function sol(n: number | null | undefined, digits = 3) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function usd(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: n < 100 ? 2 : 0 })}`;
}

export function compact(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  // A crumb of a bag still counts, so it must not read as 0.
  if (n > 0 && n < 1) return n.toPrecision(2);
  return n.toLocaleString("en-US", { maximumFractionDigits: n < 10 ? 2 : 0 });
}

export const lamports = (l: number | null | undefined) => (l == null ? null : l / 1e9);

export const short = (s: string | null | undefined, a = 4, b = 4) => (s ? `${s.slice(0, a)}…${s.slice(-b)}` : "");

export function clock(ms: number) {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}
