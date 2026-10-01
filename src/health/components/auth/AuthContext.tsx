"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { AuthUser, AuthSession, isPremium } from "@/health/lib/auth";
import { getBrowserClient, signInWithGoogle as startGoogle } from "@/health/lib/supabase/browser";
import { supabaseConfigured } from "@/health/lib/supabase/config";

/**
 * Real sign-in via Supabase Auth (shared with the Royal Fitness Club site).
 * The browser client owns the session cookies; the profile we show (role,
 * premium) comes from /api/auth/session, which verifies the JWT and reads
 * premium status from the database — so nothing here can be forged client-side.
 */

type AuthContextType = {
  user: AuthUser | null;
  session: AuthSession;
  loading: boolean;
  isPremium: boolean;
  /** False when Supabase env vars are missing (local dev): sign-in is unavailable. */
  available: boolean;
  /** Resolves with an error message, or null once the browser is heading to Google. */
  signInWithGoogle: (next?: string) => Promise<string | null>;
  /** Sends a magic link; resolves with an error message or null on success. */
  signInWithEmail: (email: string, next?: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const SIGNED_OUT: AuthSession = { user: null, expires: "", isAuthenticated: false };

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: SIGNED_OUT,
  loading: true,
  isPremium: false,
  available: false,
  signInWithGoogle: async () => null,
  signInWithEmail: async () => null,
  signOut: async () => {},
  refresh: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function track(method: string) {
  const gtag = typeof window !== "undefined" ? (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag : undefined;
  gtag?.("event", "login", { method });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession>(SIGNED_OUT);
  const [loading, setLoading] = useState(supabaseConfigured);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/health/api/auth/session", { cache: "no-store" });
      const data = (await res.json()) as AuthSession;
      setSession(data.user ? data : SIGNED_OUT);
    } catch {
      setSession(SIGNED_OUT);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return;
    // INITIAL_SESSION fires right away, so this also does the first load.
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setSession(SIGNED_OUT);
        setLoading(false);
      } else if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "USER_UPDATED") {
        void refresh();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const signInWithGoogle = useCallback(async (next = "/health/profile") => {
    track("Google");
    return startGoogle(next);
  }, []);

  const signInWithEmail = useCallback(async (email: string, next = "/health/profile") => {
    const supabase = getBrowserClient();
    if (!supabase) return "Sign-in is not configured on this site yet.";
    track("Email");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    return error ? error.message : null;
  }, []);

  const signOut = useCallback(async () => {
    await getBrowserClient()?.auth.signOut();
    setSession(SIGNED_OUT);
    try {
      await fetch("/health/api/auth/signout", { method: "POST" });
    } catch {}
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user: session.user,
      session,
      loading,
      isPremium: isPremium(session.user),
      available: supabaseConfigured,
      signInWithGoogle,
      signInWithEmail,
      signOut,
      refresh,
    }),
    [session, loading, signInWithGoogle, signInWithEmail, signOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
