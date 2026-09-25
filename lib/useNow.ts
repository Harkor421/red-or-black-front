"use client";

import { useEffect, useState } from "react";
import { serverNow } from "./live";

/**
 * Server time, re-read on an interval. setInterval, not requestAnimationFrame:
 * rAF stops in a hidden tab, and a countdown that freezes in the background
 * comes back wrong.
 */
export function useNow(ms = 250) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(serverNow());
    const t = setInterval(() => setNow(serverNow()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
