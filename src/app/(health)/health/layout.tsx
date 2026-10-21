import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SITE } from "@/health/lib/site";
import { HealthShell } from "@/health/components/HealthShell";
import { ADSENSE_CLIENT } from "@/lib/adsense";
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
  other: { "google-adsense-account": ADSENSE_CLIENT },
  verification: {
    // Add real verification tokens via env when available.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/health/fonts/fraunces-latin-opsz-wght.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.pexels.com" crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }} />
      </head>
      <HealthShell>{children}</HealthShell>
    </html>
  );
}
