/**
 * SSO-optimized auth — lightweight, JWT-ready, OAuth-ready
 * Works client-side with localStorage + cookie, server-side via /api/auth/*
 * Ready for NextAuth migration: same shape as NextAuth session
 */

export type UserRole = "user" | "premium" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  provider: "google" | "email" | "guest";
  createdAt: string;
  premiumUntil?: string;
};

export type AuthSession = {
  user: AuthUser | null;
  expires: string;
  isAuthenticated: boolean;
};

const STORAGE_KEY = "bhg-auth-user";
const COOKIE_NAME = "bhg_session";

export function saveSession(user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  // Cookie for server-side reading (non-HttpOnly for demo — in prod use HttpOnly JWT)
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function mockGoogleUser(): AuthUser {
  return {
    id: `google_${Date.now()}`,
    email: `user${Math.floor(Math.random() * 10000)}@gmail.com`,
    name: "Demo User",
    image: `https://i.pravatar.cc/150?u=${Date.now()}`,
    role: "user",
    provider: "google",
    createdAt: new Date().toISOString(),
  };
}

export function mockEmailUser(email: string, name?: string): AuthUser {
  return {
    id: `email_${Date.now()}`,
    email,
    name: name || email.split("@")[0],
    role: "user",
    provider: "email",
    createdAt: new Date().toISOString(),
  };
}

export function isPremium(user: AuthUser | null) {
  if (!user) return false;
  if (user.role === "premium" || user.role === "admin") {
    if (!user.premiumUntil) return true;
    return new Date(user.premiumUntil) > new Date();
  }
  return false;
}

// SEO: user schema for logged-in
export function userJsonLd(user: AuthUser) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: user.name,
    email: user.email,
    image: user.image,
  };
}
