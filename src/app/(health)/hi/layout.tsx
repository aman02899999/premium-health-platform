import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../health/globals.css";
import { SITE } from "@/health/lib/site";
import { ADSENSE_CLIENT } from "@/lib/adsense";
import { HealthShell } from "@/health/components/HealthShell";

// Root layout for the Hindi health pages (/hi/health/**): the same chrome as /health with
// lang="hi" and a Devanagari font.
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
  title: { default: "हिंदी में स्वास्थ्य गाइड", template: `%s | ${SITE.name}` },
  description: "भारतीय परिवारों के लिए हिंदी में गहराई से लिखी, स्रोतों सहित स्वास्थ्य गाइड।",
  openGraph: { type: "website", siteName: SITE.name, locale: "hi_IN" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  icons: { icon: ["/health/logo.svg", { url: "/health/icon-192.png", type: "image/png" }], apple: "/health/apple-icon.png" },
  other: { "google-adsense-account": ADSENSE_CLIENT },
};

export default function HindiRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hi" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/health/fonts/fraunces-latin-opsz-wght.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <HealthShell skipLabel="मुख्य सामग्री पर जाएँ">
        <div style={{ fontFamily: "'Noto Sans Devanagari', Inter, sans-serif" }}>{children}</div>
      </HealthShell>
    </html>
  );
}
