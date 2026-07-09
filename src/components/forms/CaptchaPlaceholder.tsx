import { ShieldCheck } from "lucide-react";

export function CaptchaPlaceholder() {
  return (
    <div className="flex min-h-20 items-center justify-between gap-4 rounded-md border border-dashed border-[#b7aa9a] bg-[#fffdf8] px-4 py-3">
      <div>
        <p className="font-bold">Captcha placeholder</p>
        <p className="text-sm muted">Provider-neutral anti-spam slot for Turnstile, hCaptcha, or reCAPTCHA.</p>
      </div>
      <ShieldCheck className="shrink-0 text-mint" aria-hidden />
    </div>
  );
}
