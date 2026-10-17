import { afterEach, describe, expect, it } from "vitest";
import {
  assertCmsContentToken,
  getCmsContentToken,
} from "@/lib/cms/content-token";

const ORIGINAL = process.env.CMS_CONTENT_TOKEN;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.CMS_CONTENT_TOKEN;
  else process.env.CMS_CONTENT_TOKEN = ORIGINAL;
});

describe("getCmsContentToken", () => {
  it("requires a 16+ character token", () => {
    process.env.CMS_CONTENT_TOKEN = "short";
    expect(getCmsContentToken()).toBeNull();
    process.env.CMS_CONTENT_TOKEN = "0123456789abcdef";
    expect(getCmsContentToken()).toBe("0123456789abcdef");
  });
});

describe("assertCmsContentToken", () => {
  it("returns 503 when unset", () => {
    delete process.env.CMS_CONTENT_TOKEN;
    const result = assertCmsContentToken(new Request("http://localhost/api"));
    expect(result).toEqual({
      ok: false,
      status: 503,
      error: "CMS_CONTENT_TOKEN is not configured on Studio.",
    });
  });

  it("accepts Bearer or x-cms-content-token", () => {
    process.env.CMS_CONTENT_TOKEN = "0123456789abcdef";
    const bearer = assertCmsContentToken(
      new Request("http://localhost/api", {
        headers: { authorization: "Bearer 0123456789abcdef" },
      }),
    );
    expect(bearer).toEqual({ ok: true });

    const header = assertCmsContentToken(
      new Request("http://localhost/api", {
        headers: { "x-cms-content-token": "0123456789abcdef" },
      }),
    );
    expect(header).toEqual({ ok: true });

    const bad = assertCmsContentToken(
      new Request("http://localhost/api", {
        headers: { authorization: "Bearer wrong-token!!!!!!" },
      }),
    );
    expect(bad).toEqual({ ok: false, status: 401, error: "Unauthorized" });
  });
});
