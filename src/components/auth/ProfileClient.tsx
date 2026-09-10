"use client";

import { useAuth } from "./AuthContext";
import { useRouter } from "next/navigation";
import { LogOut, Crown, User, Mail, Calendar } from "lucide-react";
import { PremiumCTA, EarningStats } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";

export function ProfileClient() {
  const { user, signOut, isPremium, upgradeToPremium } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center dark:border-stone-700 dark:bg-stone-900">
        <p className="text-sm font-bold">Not logged in</p>
        <p className="mt-1 text-xs text-stone-500">Login to access SSO profile, premium, saved thali plans.</p>
        <button onClick={() => router.push("/login")} className="mt-4 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white">Login — SSO Optimized</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white text-xl font-black">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-black"><User className="h-5 w-5" /> {user.name} {isPremium && <Crown className="h-4 w-4 text-amber-500" />}</h1>
            <p className="flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-300"><Mail className="h-4 w-4" /> {user.email} · {user.provider} SSO</p>
            <p className="flex items-center gap-1.5 text-xs text-stone-500"><Calendar className="h-3 w-3" /> Joined {new Date(user.createdAt).toLocaleDateString("en-IN")} · Role {user.role}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={async () => { await signOut(); router.push("/"); }} className="flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2 text-sm font-bold hover:bg-stone-50 dark:border-stone-700">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
          {!isPremium && <button onClick={upgradeToPremium} className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-stone-900">Demo Upgrade to Premium</button>}
        </div>
      </div>

      <PremiumCTA />
      <EarningStats />
      <AffiliateProducts limit={4} />

      <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <h3 className="text-sm font-bold">SSO Optimized — Technical Details</h3>
        <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
          <li>Google SSO ready — replace mock with NextAuth Google provider + env GOOGLE_CLIENT_ID/SECRET</li>
          <li>JWT stored in HttpOnly cookie in prod (currently localStorage + cookie for demo)</li>
          <li>CSRF protection via SameSite=Lax + token</li>
          <li>Session endpoint /api/auth/session returns same shape as NextAuth</li>
          <li>Role-based: user/premium/admin — premium unlocks earning features</li>
          <li>Analytics: gtag login events + UTM capture</li>
        </ul>
      </div>
    </div>
  );
}
