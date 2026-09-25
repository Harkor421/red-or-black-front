import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `next dev` would otherwise write AGENTS.md / CLAUDE.md into the repo on every start.
  agentRules: false,
  devIndicators: false,
};

export default nextConfig;
