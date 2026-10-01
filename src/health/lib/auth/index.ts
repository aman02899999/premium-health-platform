/**
 * Auth types shared by client and server.
 * Sign-in is Supabase Auth (Google or email magic link) — the same project and
 * user pool as the Royal Fitness Club site. The session lives in Supabase's
 * cookies and is verified server-side; nothing here is trusted on its own.
 */

export type UserRole = "user" | "premium" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  provider: "google" | "email";
  createdAt: string;
  premiumUntil?: string;
};

export type AuthSession = {
  user: AuthUser | null;
  expires: string;
  isAuthenticated: boolean;
};

export function isPremium(user: AuthUser | null) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role !== "premium") return false;
  return !user.premiumUntil || new Date(user.premiumUntil) > new Date();
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
