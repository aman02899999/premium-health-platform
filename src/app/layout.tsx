import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SITE } from "@/lib/site";
import { Providers, Header, Footer, MobileBottomNav } from "@/components/layout";
import { BackToTop } from "@/components/engagement";
import { LiveTicker } from "@/components/live";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

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
  ],
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "Health",
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.heroSubtitle,
    locale: "en_IN",
    url: SITE.url,
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: `${SITE.name} — Indian health knowledge` }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.tagline,
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  alternates: { canonical: SITE.url },
  icons: { icon: "/logo.svg", apple: "/logo.svg" },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://images.pexels.com" crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }} />
      </head>
      <body className="min-h-screen bg-[#fdfbf6] text-stone-900 antialiased dark:bg-stone-950 dark:text-stone-100">
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-emerald-700 focus:px-4 focus:py-2 focus:text-white">Skip to content</a>
          <LiveTicker />
          <Header />
          <main id="main" className="min-h-[60vh]">{children}</main>
          <Footer />
          <MobileBottomNav />
          <BackToTop />
        </Providers>
      </body>
    </html>
  );
}
