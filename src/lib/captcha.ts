export type CaptchaVerificationResult = {
  ok: boolean;
  provider: "turnstile" | "placeholder";
  reason?: string;
};

export async function verifyTurnstileToken(token?: string): Promise<CaptchaVerificationResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        provider: "turnstile",
        reason: "Turnstile secret key is not configured."
      };
    }

    return {
      ok: true,
      provider: "placeholder",
      reason: "Turnstile is not configured in local development."
    };
  }

  if (!token) {
    return {
      ok: false,
      provider: "turnstile",
      reason: "Captcha token is required."
    };
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      secret,
      response: token
    })
  });

  if (!response.ok) {
    return {
      ok: false,
      provider: "turnstile",
      reason: "Captcha verification request failed."
    };
  }

  const result = (await response.json()) as { success?: boolean; "error-codes"?: string[] };

  return {
    ok: Boolean(result.success),
    provider: "turnstile",
    reason: result.success ? undefined : result["error-codes"]?.join(", ") ?? "Captcha verification failed."
  };
}
