"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, LogOut, Mail } from "lucide-react";
import { getBrowserClient, signInWithEmail, signInWithGoogle } from "@/lib/supabase/browser";

export function GoogleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function GoogleSignIn({ next, label = "Continue with Google", className = "" }: { next: string; label?: string; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          const err = await signInWithGoogle(next);
          if (err) {
            setError(err);
            setBusy(false);
          }
        }}
        className={`flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-3 font-semibold text-[#1f1f1f] shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-70 ${className}`}
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />} {label}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}

/** One-time sign-in link by email: works even when Google sign-in is switched off. */
export function EmailSignIn({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const [error, setError] = useState("");

  if (state === "sent") {
    return (
      <p className="flex items-start gap-2 rounded-2xl bg-sky/10 p-4 text-left text-sm text-white/85">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky" /> Check {email} — we sent you a sign-in link.
      </p>
    );
  }
  return (
    <form
      className="space-y-3 text-left"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("busy");
        setError("");
        const err = await signInWithEmail(email, next);
        if (err) {
          setError(err);
          setState("idle");
        } else setState("sent");
      }}
    >
      <label htmlFor="signin-email" className="sr-only">
        Email
      </label>
      <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 focus-within:border-sky">
        <Mail className="h-4 w-4 shrink-0 text-white/50" />
        <input
          id="signin-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full bg-transparent text-white outline-none placeholder:text-white/35"
        />
      </div>
      <button
        type="submit"
        disabled={state === "busy" || !email}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 font-semibold text-white transition-colors hover:border-sky disabled:opacity-60"
      >
        {state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Email me a sign-in link
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-200">
          {error}
        </p>
      )}
    </form>
  );
}

/** Google button, an "or" divider, then the email link form. */
export function SignInOptions({ next, googleLabel }: { next: string; googleLabel?: string }) {
  return (
    <div className="space-y-4">
      <GoogleSignIn next={next} label={googleLabel} />
      <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-white/35">
        <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
      </div>
      <EmailSignIn next={next} />
    </div>
  );
}

export function SignOutButton({ next = "/", label = "Sign out" }: { next?: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        await getBrowserClient()?.auth.signOut();
        await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
        window.location.href = next;
      }}
      className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:border-brand"
    >
      <LogOut className="h-4 w-4" /> {label}
    </button>
  );
}
