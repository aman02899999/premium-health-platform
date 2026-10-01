"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "./AuthContext";
import { safeNext } from "@/health/lib/supabase/config";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

export function LoginClient() {
  const { signInWithGoogle, signInWithEmail, user, loading, available } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(params.get("error") === "signin" ? "Sign-in failed or the link expired. Please try again." : "");

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    setError("");
    const err = await signInWithEmail(email, next);
    setBusy(false);
    if (err) setError(err);
    else setSent(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center rounded-3xl border border-stone-200 bg-white p-10 dark:border-stone-700 dark:bg-stone-900">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
        <p className="text-sm font-bold">Signed in as {user.name} ({user.email})</p>
        <button onClick={() => router.push(next)} className="mt-3 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-bold text-white">Continue</button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
      <h1 className="flex items-center gap-2 text-xl font-black"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Sign in</h1>
      <p className="mt-1 text-xs text-stone-500">One account for Premium Health Platform and Royal Fitness Club.</p>

      {!available && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Sign-in isn&apos;t configured on this deployment yet (Supabase environment variables are missing).
        </p>
      )}

      <button
        onClick={() => { setBusy(true); void signInWithGoogle(next); }}
        disabled={busy || !available}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-bold shadow-sm hover:bg-stone-50 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-800"
      >
        <GoogleIcon /> Continue with Google
      </button>

      <div className="my-4 flex items-center gap-2 text-[11px] text-stone-400">
        <span className="h-px flex-1 bg-stone-200 dark:bg-stone-700" /> OR <span className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
      </div>

      {sent ? (
        <p className="flex items-start gap-2 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> Check {email} — we sent you a sign-in link.
        </p>
      ) : (
        <form onSubmit={handleEmail} className="space-y-3">
          <label className="block text-xs font-bold" htmlFor="login-email">Email</label>
          <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 dark:border-stone-700 dark:bg-stone-800">
            <Mail className="h-4 w-4 text-stone-400" />
            <input id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" placeholder="you@example.com" className="w-full bg-transparent text-sm outline-none" />
          </div>
          <button type="submit" disabled={busy || !email || !available} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Email me a sign-in link
          </button>
        </form>
      )}

      {error && <p className="mt-3 text-xs font-semibold text-red-600" role="alert">{error}</p>}

      <p className="mt-4 text-[11px] text-stone-400">By continuing you agree to the Terms and Privacy Policy. We only receive your name, email and profile photo from Google.</p>
    </div>
  );
}
