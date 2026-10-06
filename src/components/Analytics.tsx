"use client";

import { useEffect } from "react";
import { BEACON_SRC, beaconToken } from "@/lib/analytics";

/**
 * Cloudflare Web Analytics. The beacon is appended after hydration instead of being a
 * <script src> in the HTML: Cloudflare updates beacon.min.js in place, so it cannot carry
 * Subresource Integrity, and an external script without `integrity` in the markup costs the
 * Observatory SRI test. The CSP still has to allow its origin (BEACON_ORIGIN).
 */
export function Analytics() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (document.querySelector(`script[src="${BEACON_SRC}"]`)) return;
    const beacon = document.createElement("script");
    beacon.type = "module";
    beacon.src = BEACON_SRC;
    beacon.dataset.cfBeacon = JSON.stringify({ token: beaconToken });
    document.body.appendChild(beacon);
  }, []);
  return null;
}
