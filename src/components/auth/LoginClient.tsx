"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, LogIn, ShieldCheck, Globe } from "lucide-react";
import { useAuth } from "./AuthContext";

export function LoginClient() {
  const { signInWithGoogle, signInWithEmail, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
    router.push("/profile");
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await signInWithEmail(email, name || undefined);
    setLoading(false);
    router.push("/profile");
  };

  if (user) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
        <p className="text-sm font-bold">Already logged in as {user.name} ({user.email})</p>
        <button onClick={() => router.push("/profile")} className="mt-3 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-bold text-white">Go to Profile</button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
      <h1 className="flex items-center gap-2 text-xl font-black"><ShieldCheck className="h-5 w-5 text-emerald-600" /> SSO Optimized Login</h1>
      <p className="mt-1 text-xs text-stone-500">Google SSO + Email — JWT-ready, OAuth-ready, secure cookies. Demo mode stores locally.</p>

      <button onClick={handleGoogle} disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-bold shadow-sm hover:bg-stone-50 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-800">
        <Globe className="h-4 w-4" /> {loading ? "Signing in…" : "Continue with Google (SSO)"}
      </button>

      <div className="my-4 flex items-center gap-2 text-[11px] text-stone-400">
        <span className="h-px flex-1 bg-stone-200 dark:bg-stone-700" /> OR <span className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
      </div>

      <form onSubmit={handleEmail} className="space-y-3">
        <div>
          <label className="text-xs font-bold">Email</label>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 dark:border-stone-700 dark:bg-stone-800">
            <Mail className="h-4 w-4 text-stone-400" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@example.com" className="w-full bg-transparent text-sm outline-none" />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold">Name (optional)</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm dark:border-stone-700 dark:bg-stone-800" />
        </div>
        <button type="submit" disabled={loading || !email} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50">
          <LogIn className="h-4 w-4" /> {loading ? "Signing in…" : "Continue with Email"}
        </button>
      </form>

      <p className="mt-4 text-[11px] text-stone-400">By continuing, you agree to Terms & Privacy. SSO optimized for Google OAuth, JWT, secure cookies, CSRF. In production, replace mock with NextAuth.</p>
    </div>
  );
}
