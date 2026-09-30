"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const password = new FormData(e.currentTarget).get("password");
        const res = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
        if (res.ok) location.href = "/admin";
        else {
          setError((await res.json().catch(() => ({}))).error || "Login failed");
          setBusy(false);
        }
      }}
    >
      <label className="block">
        <span className="mb-1.5 block text-sm text-white/70">Password</span>
        <input name="password" type="password" required autoFocus autoComplete="current-password" className="field" />
      </label>
      {error && (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-gold flex w-full items-center justify-center gap-2 rounded-full py-3 font-bold">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
      </button>
    </form>
  );
}
