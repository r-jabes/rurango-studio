/**
 * Shared secret for the read-only public content API.
 * Optional in local UI work; required for portfolio pull.
 */
export function getCmsContentToken() {
  const token = process.env.CMS_CONTENT_TOKEN?.trim();
  return token && token.length >= 16 ? token : null;
}

export function assertCmsContentToken(request: Request) {
  const expected = getCmsContentToken();
  if (!expected) {
    return {
      ok: false as const,
      status: 503,
      error: "CMS_CONTENT_TOKEN is not configured on Studio.",
    };
  }

  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const alt = request.headers.get("x-cms-content-token")?.trim() ?? "";
  const provided = bearer || alt;

  if (!provided || provided !== expected) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  return { ok: true as const };
}
