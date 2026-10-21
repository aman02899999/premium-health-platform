import type { ReactNode } from "react";
import { AdsenseScript } from "@/components/ads/AdsenseScript";
import { AuthProvider } from "@/health/components/auth/AuthContext";

// The blog is the one part of the gym site that carries ads (in-article units only, never the gym
// pages). The auth provider tells the ad units whether the reader is a premium member (ad-free).
export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <AdsenseScript />
    </AuthProvider>
  );
}
