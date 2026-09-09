"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthUser, AuthSession, getStoredUser, saveSession, clearSession, mockGoogleUser, mockEmailUser, isPremium } from "@/lib/auth";

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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
    setLoading(false);
  }, []);

  const session: AuthSession = {
    user,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    isAuthenticated: !!user,
  };

  const signInWithGoogle = async () => {
    // In prod: redirect to /api/auth/signin?provider=google (NextAuth)
    // For demo: mock
    const u = mockGoogleUser();
    setUser(u);
    saveSession(u);
    // Fire analytics
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "login", { method: "Google" });
    }
  };

  const signInWithEmail = async (email: string, name?: string) => {
    const u = mockEmailUser(email, name);
    setUser(u);
    saveSession(u);
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "login", { method: "Email" });
    }
  };

  const signOut = async () => {
    setUser(null);
    clearSession();
    // Call server to clear cookie
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch {}
  };

  const upgradeToPremium = () => {
    if (!user) return;
    const premiumUser: AuthUser = {
      ...user,
      role: "premium",
      premiumUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
    };
    setUser(premiumUser);
    saveSession(premiumUser);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isPremium: isPremium(user), signInWithGoogle, signInWithEmail, signOut, upgradeToPremium }}>
      {children}
    </AuthContext.Provider>
  );
}
