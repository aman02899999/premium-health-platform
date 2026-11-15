import Script from "next/script";

/**
 * Vercel Web Analytics without the npm package (its optional Svelte peer clashes with vitest's vite).
 * Only rendered on Vercel builds: /_vercel/insights/script.js exists nowhere else, and on other
 * hosts (Cloud Run) the request 404s and logs a console error on every page.
 * No cookies, no personal data.
 */
export function VercelAnalytics() {
  if (!process.env.VERCEL) return null;
  return (
    <>
      <Script id="va-init" strategy="afterInteractive">{`window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };`}</Script>
      <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
    </>
  );
}
