import { describe, expect, it } from "vitest";
import { BEACON_SRC, beaconToken } from "@/lib/analytics";
import { BEACON_ORIGIN, buildCsp } from "@/lib/security-headers";

describe("analytics beacon", () => {
  it("loads from the origin the CSP allows in script-src", () => {
    expect(new URL(BEACON_SRC).origin).toBe(BEACON_ORIGIN);
    expect(buildCsp(false, [])).toMatch(new RegExp(`script-src [^;]*${BEACON_ORIGIN}`));
  });

  it("has a 32-digit hex site token", () => {
    expect(beaconToken).toMatch(/^[0-9a-f]{32}$/);
  });
});
