export function isStudioEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getStudioFromEmail() {
  return (
    process.env.STUDIO_FROM_EMAIL?.trim() || "contact@rurango.com"
  );
}

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendStudioEmail(
  input: SendEmailInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      error:
        "Email is not configured. Add RESEND_API_KEY (and optionally STUDIO_FROM_EMAIL) to enable password recovery.",
    };
  }

  const from = getStudioFromEmail();

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        ...(input.html ? { html: input.html } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Resend error:", response.status, detail);
      return {
        ok: false,
        error: "The message could not be delivered. Try again shortly.",
      };
    }

    return { ok: true };
  } catch (error) {
    console.error("Studio email send failed:", error);
    return {
      ok: false,
      error: "The message could not be delivered. Try again shortly.",
    };
  }
}
