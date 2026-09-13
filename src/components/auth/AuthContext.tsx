"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, ReactNode } from "react";
import { AuthUser, AuthSession, getStoredUser, saveSession, clearSession, mockGoogleUser, mockEmailUser, isPremium } from "@/lib/auth";

/**
 * AUDIT FIX (defect #6): the previous implementation rebuilt the session on every
 * render with `expires: new Date(Date.now() + 30 days)`, so the expiry drifted
 * forward forever and never actually expired — and it hydrated localStorage inside
 * a `setState` in `useEffect`.
 *
 * Auth state now lives in a client-only external store read through
 * `useSyncExternalStore`:
 *  - the snapshot is created once (on hydration / on sign-in) and is referentially
 *    stable, so `session.expires` is a fixed timestamp instead of a moving target;
 *  - the session expiry is derived from the persisted sign-in time (30-day TTL), so
 *    it survives reloads and genuinely expires;
 *  - no setState-in-effect, no hydration-time state writes.
 */

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

type AuthStoreState = {
  user: AuthUser | null;
  session: AuthSession;
  loading: boolean;
};

const SIGNED_OUT_STATE: AuthStoreState = {
  user: null,
  session: { user: null, expires: "", isAuthenticated: false },
  loading: false,
};

function buildSession(user: AuthUser | null): AuthSession {
  if (!user) return SIGNED_OUT_STATE.session;
  const signedInAt = new Date(user.createdAt).getTime();
  const expiresAt = Number.isFinite(signedInAt) ? signedInAt + SESSION_TTL_MS : 0;
  return {
    user,
    expires: new Date(expiresAt).toISOString(),
    // A session past its TTL is treated as signed out even if the record lingers.
    isAuthenticated: expiresAt > Date.now(),
  };
}

function buildState(user: AuthUser | null): AuthStoreState {
  if (!user) return SIGNED_OUT_STATE;
  return { user, session: buildSession(user), loading: false };
}

let clientState: AuthStoreState | null = null;
const listeners = new Set<() => void>();

/** Reads the persisted session exactly once per client — never during SSR. */
function getClientSnapshot(): AuthStoreState {
  if (clientState === null) {
    const stored = getStoredUser();
    if (stored && !buildSession(stored).isAuthenticated) {
      // TTL elapsed — drop the stale record instead of resurrecting the session.
      clearSession();
      clientState = SIGNED_OUT_STATE;
    } else {
      clientState = buildState(stored);
    }
  }
  return clientState;
}

function getServerSnapshot(): AuthStoreState {
  return SIGNED_OUT_STATE;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function writeUser(user: AuthUser | null): void {
  if (user) saveSession(user);
  else clearSession();
  clientState = buildState(user);
  for (const listener of listeners) listener();
}

type AuthContextType = {
  user: AuthUser | null;
  session: AuthSession;
  loading: boolean;
  isPremium: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  upgradeToPremium: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: { user: null, expires: "", isAuthenticated: false },
  loading: true,
  isPremium: false,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signOut: async () => {},
  upgradeToPremium: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, session, loading } = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  const signInWithGoogle = useCallback(async () => {
    // In prod: redirect to /api/auth/signin?provider=google (NextAuth)
    // For demo: mock
    const u = mockGoogleUser();
    writeUser(u);
    // Fire analytics
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "login", { method: "Google" });
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, name?: string) => {
    const u = mockEmailUser(email, name);
    writeUser(u);
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "login", { method: "Email" });
    }
  }, []);

  const signOut = useCallback(async () => {
    writeUser(null);
    // Call server to clear cookie
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch {}
  }, []);

  const upgradeToPremium = useCallback(() => {
    if (!user) return;
    const premiumUser: AuthUser = {
      ...user,
      role: "premium",
      premiumUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
    };
    // `user.createdAt` is preserved, so the session expiry stays anchored to the
    // original sign-in time and does not drift when the role changes.
    writeUser(premiumUser);
  }, [user]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      loading,
      isPremium: isPremium(user),
      signInWithGoogle,
      signInWithEmail,
      signOut,
      upgradeToPremium,
    }),
    [user, session, loading, signInWithGoogle, signInWithEmail, signOut, upgradeToPremium]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
