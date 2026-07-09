"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export function CaptchaPlaceholder({ onTokenChange }: { onTokenChange?: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!siteKey) {
      onTokenChange?.("local-placeholder-token");
      return;
    }

    if (!scriptReady || !containerRef.current || !window.turnstile || widgetIdRef.current) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: "light",
      callback: (token) => onTokenChange?.(token),
      "expired-callback": () => onTokenChange?.(""),
      "error-callback": () => onTokenChange?.("")
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onTokenChange, scriptReady, siteKey]);

  if (siteKey) {
    return (
      <div className="grid gap-2">
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          async
          defer
          onLoad={() => setScriptReady(true)}
        />
        <div ref={containerRef} className="min-h-[65px]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-20 items-center justify-between gap-4 rounded-md border border-dashed border-[#b7aa9a] bg-[#fffdf8] px-4 py-3">
      <div>
        <p className="font-bold">Turnstile not configured</p>
        <p className="text-sm muted">Set NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY in deployment.</p>
      </div>
      <ShieldCheck className="shrink-0 text-mint" aria-hidden />
    </div>
  );
}
