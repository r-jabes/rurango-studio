import { afterEach, describe, expect, it } from "vitest";
import {
  clientIpFromRequest,
  rateLimit,
  resetRateLimitBuckets,
} from "@/lib/rate-limit";

afterEach(() => {
  resetRateLimitBuckets();
});

describe("rateLimit", () => {
  it("allows up to the limit then blocks", () => {
    const key = "test:auth";
    expect(rateLimit({ key, limit: 2, windowMs: 60_000 }).ok).toBe(true);
    expect(rateLimit({ key, limit: 2, windowMs: 60_000 }).ok).toBe(true);
    const blocked = rateLimit({ key, limit: 2, windowMs: 60_000 });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBeGreaterThanOrEqual(1);
    }
  });

  it("opens a new window after resetAt", () => {
    const key = "test:window";
    expect(rateLimit({ key, limit: 1, windowMs: 60_000 }).ok).toBe(true);
    expect(rateLimit({ key, limit: 1, windowMs: 60_000 }).ok).toBe(false);
    resetRateLimitBuckets();
    expect(rateLimit({ key, limit: 1, windowMs: 60_000 }).ok).toBe(true);
  });
});

describe("clientIpFromRequest", () => {
  it("prefers the first x-forwarded-for hop", () => {
    const request = new Request("http://localhost/login", {
      headers: {
        "x-forwarded-for": "203.0.113.10, 10.0.0.1",
        "x-real-ip": "10.0.0.1",
      },
    });
    expect(clientIpFromRequest(request)).toBe("203.0.113.10");
  });

  it("falls back to x-real-ip then unknown", () => {
    expect(
      clientIpFromRequest(
        new Request("http://localhost/", {
          headers: { "x-real-ip": "198.51.100.1" },
        }),
      ),
    ).toBe("198.51.100.1");
    expect(clientIpFromRequest(new Request("http://localhost/"))).toBe(
      "unknown",
    );
  });
});
