"use client";

import { HealthAd } from "@/components/HealthAd";
import { useAuth } from "@/health/components/auth/AuthContext";

/** An in-article ad that stays hidden for premium members, and until we know who's reading. */
export function PremiumAwareAd({ className }: { className?: string }) {
  const { isPremium, loading } = useAuth();
  return <HealthAd hidden={loading || isPremium} className={className} />;
}
