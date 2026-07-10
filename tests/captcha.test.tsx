import { createElement, useEffect } from "react";
import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CaptchaPlaceholder } from "@/components/forms/CaptchaPlaceholder";

vi.mock("next/script", () => {
  function ScriptMock({ onReady }: { onReady?: () => void }) {
    useEffect(() => {
      onReady?.();
    }, [onReady]);

    return null;
  }

  return { default: ScriptMock };
});

describe("CaptchaPlaceholder", () => {
  const originalSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  afterEach(() => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = originalSiteKey;
    delete window.turnstile;
    vi.restoreAllMocks();
  });

  it("resets the existing Turnstile widget without removing it", async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "test-site-key";

    const renderWidget = vi.fn(() => "widget-1");
    const resetWidget = vi.fn();
    const removeWidget = vi.fn();
    const onTokenChange = vi.fn();

    window.turnstile = {
      render: renderWidget,
      reset: resetWidget,
      remove: removeWidget
    };

    const view = render(createElement(CaptchaPlaceholder, { onTokenChange, resetSignal: 0 }));

    await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(1));

    view.rerender(createElement(CaptchaPlaceholder, { onTokenChange, resetSignal: 1 }));

    await waitFor(() => expect(resetWidget).toHaveBeenCalledWith("widget-1"));
    expect(renderWidget).toHaveBeenCalledTimes(1);
    expect(removeWidget).not.toHaveBeenCalled();
    expect(onTokenChange).toHaveBeenCalledWith("");
  });
});
