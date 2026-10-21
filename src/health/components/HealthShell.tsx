import type { ReactNode } from "react";
import { Suspense } from "react";
import { Providers, Header, Footer, MobileBottomNav } from "@/health/components/layout";
import { AuthProvider } from "@/health/components/auth/AuthContext";
import { BackToTop } from "@/health/components/engagement";
import { LiveTicker } from "@/health/components/live";
import { Analytics } from "@/health/components/marketing/Analytics";
import { ExitIntent, StickyCTA } from "@/health/components/marketing/ExitIntent";
import { NewsletterPopup } from "@/health/components/marketing/NewsletterPopup";
import { AdsenseScript } from "@/components/ads/AdsenseScript";
import { VercelAnalytics } from "@/components/ui/VercelAnalytics";

/** The health site's page chrome, shared by the /health (English) and /hi/health (Hindi) root layouts. */
export function HealthShell({ children, skipLabel = "Skip to content" }: { children: ReactNode; skipLabel?: string }) {
  return (
    <body className="min-h-screen bg-[#fdfbf6] text-stone-900 antialiased dark:bg-stone-950 dark:text-stone-100">
      <AuthProvider>
        <Providers>
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-emerald-700 focus:px-4 focus:py-2 focus:text-white">{skipLabel}</a>
          <LiveTicker />
          <Header />
          <main id="main" className="min-h-[60vh]">{children}</main>
          <Footer />
          <MobileBottomNav />
          <BackToTop />
          <ExitIntent />
          <StickyCTA />
          <NewsletterPopup />
        </Providers>
      </AuthProvider>
      {/* Skips itself on sign-in, account, checkout and admin pages. */}
      <AdsenseScript />
      <VercelAnalytics />
    </body>
  );
}
