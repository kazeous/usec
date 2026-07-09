"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";

export function LoginForm() {
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password")
      })
    });

    if (!response.ok) {
      const result = await response.json();
      setError(result.error ?? "Login failed.");
      return;
    }

    window.location.href = "/staff";
  }

  return (
    <form className="panel grid gap-4 p-5" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <label className="text-sm font-bold" htmlFor="email">
          Email
        </label>
        <input className="field" id="email" name="email" type="email" required />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-bold" htmlFor="password">
          Password
        </label>
        <input className="field" id="password" name="password" type="password" required />
      </div>
      {error ? <p className="rounded-md bg-[#ffe5e1] p-3 text-sm font-bold text-[#8f2016]">{error}</p> : null}
      <button className="button button-primary" type="submit">
        <LogIn size={16} aria-hidden />
        Sign in
      </button>
    </form>
  );
}
