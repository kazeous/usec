export type CaptchaVerificationResult = {
  ok: boolean;
  provider: "placeholder";
  reason?: string;
};

export async function verifyCaptchaPlaceholder(token?: string): Promise<CaptchaVerificationResult> {
  if (!token) {
    return {
      ok: true,
      provider: "placeholder",
      reason: "Captcha provider is not configured yet."
    };
  }

  return {
    ok: true,
    provider: "placeholder"
  };
}
