"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { CaptchaPlaceholder } from "@/components/forms/CaptchaPlaceholder";

export function StaffApplicationForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("loading");
    setMessage("");
    if (!captchaToken) {
      setStatus("error");
      setMessage("Please complete the captcha before submitting.");
      return;
    }

    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    if (password !== String(data.get("confirmPassword") ?? "")) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          studentId: data.get("studentId"),
          universityName: data.get("universityName"),
          password,
          applicationReason: data.get("applicationReason"),
          captchaToken
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Application could not be submitted.");
      form.reset();
      setStatus("success");
      setMessage("Application submitted. An administrator must approve it before you can sign in.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Network error while submitting your application.");
    } finally {
      setCaptchaToken("");
      setCaptchaResetSignal((current) => current + 1);
    }
  }

  return (
    <form className="panel grid gap-5 p-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="name" label="Full name" autoComplete="name" />
        <Field id="email" label="Email" type="email" autoComplete="email" />
        <Field id="studentId" label="Student ID" />
        <Field id="universityName" label="University name" />
        <Field id="password" label="Password" type="password" autoComplete="new-password" minLength={8} maxLength={72} />
        <Field id="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" minLength={8} maxLength={72} />
      </div>
      <label className="grid gap-2 text-sm font-bold" htmlFor="applicationReason">
        Why do you want to join the staff team?
        <textarea className="field min-h-32 resize-y" id="applicationReason" name="applicationReason" minLength={10} maxLength={500} required />
      </label>
      <p className="text-sm muted">If a previous application was rejected, submit the same email and original password to update and resubmit it.</p>
      <CaptchaPlaceholder onTokenChange={setCaptchaToken} resetSignal={captchaResetSignal} />
      {message ? <p className={`rounded-md p-3 text-sm font-bold ${status === "success" ? "bg-[#dff5e9] text-[#1d6544]" : "bg-[#ffe5e1] text-[#8f2016]"}`}>{message}</p> : null}
      <button className="button button-primary w-fit" type="submit" disabled={status === "loading"}>
        <Send size={16} aria-hidden />
        {status === "loading" ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}

function Field({ id, label, type = "text", ...props }: {
  id: string;
  label: string;
  type?: React.HTMLInputTypeAttribute;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "name" | "type">) {
  return (
    <label className="grid gap-2 text-sm font-bold" htmlFor={id}>
      {label}
      <input className="field" id={id} name={id} type={type} required {...props} />
    </label>
  );
}
