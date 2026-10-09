import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";
import { getContent } from "@/lib/content/store";
import { ADSENSE_SRC } from "@/lib/adsense";
import { SITE_URL } from "@/lib/site";

// Self-hosted variable fonts (SIL OFL), preloaded with a size-matched fallback; builds never need to reach Google Fonts.
const inter = localFont({ src: "./fonts/inter-latin-wght-normal.woff2", weight: "100 900", variable: "--font-inter", display: "swap" });
const oswald = localFont({ src: "./fonts/oswald-latin-wght-normal.woff2", weight: "200 700", variable: "--font-oswald", display: "swap" });

export const viewport: Viewport = {
  themeColor: "#06111c",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: c.seo.title, template: `%s | ${c.business.name}` },
    description: c.seo.description,
    keywords: c.seo.keywords,
    applicationName: c.business.name,
    authors: [{ name: c.business.name, url: SITE_URL }],
    creator: c.business.name,
    publisher: c.business.name,
    category: "Fitness",
    formatDetection: { telephone: true, address: true },
    openGraph: {
      type: "website",
      siteName: c.business.name,
      title: c.seo.title,
      description: c.seo.description,
      locale: "en_IN",
      url: SITE_URL,
      images: [{ url: c.seo.ogImage || "/opengraph-image", width: 1200, height: 630, alt: c.business.name }],
    },
    twitter: { card: "summary_large_image", title: c.seo.title, description: c.seo.description },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    alternates: { canonical: SITE_URL },
    icons: { icon: [{ url: "/brand/favicon-48.png", type: "image/png", sizes: "48x48" }, { url: "/icon-192.png", type: "image/png", sizes: "192x192" }], apple: "/apple-icon.png" },
    manifest: "/manifest.webmanifest",
    verification: { google: c.seo.googleVerification || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined },
    other: {
      "geo.region": "IN-UP",
      "geo.placename": `${c.business.address.locality}, ${c.business.address.city}`,
      "geo.position": `${c.business.geo.lat};${c.business.geo.lng}`,
      ICBM: `${c.business.geo.lat}, ${c.business.geo.lng}`,
    },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const c = await getContent();
  return (
    <html lang="en-IN" className={`${inter.variable} ${oswald.variable}`} style={{ "--brand": c.theme.primary, "--navy": c.theme.secondary } as React.CSSProperties}>
      <head>
        {/* Google AdSense — a plain <script> (not next/script, whose data-nscript attribute AdSense rejects) */}
        <script async src={ADSENSE_SRC} crossOrigin="anonymous" />
      </head>
      <body className="noise min-h-screen">{children}</body>
    </html>
  );
}
