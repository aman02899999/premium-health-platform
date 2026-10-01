import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import "./globals.css";
import { SITE } from "@/health/lib/site";
import { Providers, Header, Footer, MobileBottomNav } from "@/health/components/layout";
import { AuthProvider } from "@/health/components/auth/AuthContext";
import { BackToTop } from "@/health/components/engagement";
import { LiveTicker } from "@/health/components/live";
import { Analytics } from "@/health/components/marketing/Analytics";
import { ExitIntent, StickyCTA } from "@/health/components/marketing/ExitIntent";
import { NewsletterPopup } from "@/health/components/marketing/NewsletterPopup";
import { ADSENSE_SRC } from "@/lib/adsense";
import { organizationJsonLd, websiteJsonLd } from "@/health/lib/seo";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0b5c3f" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1512" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.heroSubtitle,
  keywords: [
    "Indian health", "Ayurveda", "diabetes India", "thyroid", "PCOS", "herbs",
    "nutrition", "lab tests", "homeopathy", "diet plans", "HbA1c", "hypertension",
    "millets", "yoga", "health calculators India", "ayurvedic herbs evidence",
    "thali builder", "millet swap", "IDRS", "herb drug interaction", "barcode scanner",
    "Ritucharya", "dosha meals", "fasting planner", "Hinglish health search",
  ],
  authors: [{ name: SITE.name, url: `${SITE.url}/health` }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "Health",
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.heroSubtitle,
    locale: "en_IN",
    url: `${SITE.url}/health`,
    images: [{ url: "/health/og-default.jpg", width: 1200, height: 630, alt: `${SITE.name} — Indian health knowledge` }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.tagline,
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  icons: { icon: ["/health/logo.svg", { url: "/health/icon-192.png", type: "image/png" }, { url: "/health/icon-512.png", type: "image/png" }], apple: "/health/apple-icon.png" },
  verification: {
    // Add real verification tokens via env when available.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google AdSense — a plain <script> (not next/script, whose data-nscript attribute AdSense rejects) */}
        <script async src={ADSENSE_SRC} crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- root layout of the /health site, fonts are global to it */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..900&family=Inter:opsz,wght@14..32,400..800&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://images.pexels.com" crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }} />
      </head>
      <body className="min-h-screen bg-[#fdfbf6] text-stone-900 antialiased dark:bg-stone-950 dark:text-stone-100">
        <AuthProvider>
          <Providers>
            <Suspense fallback={null}>
              <Analytics />
            </Suspense>
            <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-emerald-700 focus:px-4 focus:py-2 focus:text-white">Skip to content</a>
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
      </body>
    </html>
  );
}
