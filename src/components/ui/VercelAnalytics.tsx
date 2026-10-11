import Script from "next/script";

/**
 * Vercel Web Analytics without the npm package (its optional Svelte peer clashes with vitest's vite).
 * Counts page views once Web Analytics is switched on in the Vercel dashboard; until then the
 * script request simply 404s and nothing is recorded. No cookies, no personal data.
 */
export function VercelAnalytics() {
  return (
    <>
      <Script id="va-init" strategy="afterInteractive">{`window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };`}</Script>
      <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
    </>
  );
}
