import type { Metadata } from "next";
import "./(gym)/globals.css";
import NotFound from "./(gym)/not-found";

// The app has two root layouts ((gym) and (health)), so URLs that match neither
// render this standalone 404 page.
export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function GlobalNotFound() {
  return (
    <html lang="en-IN">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- standalone page with its own <head> */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Oswald:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="noise min-h-screen">
        <NotFound />
      </body>
    </html>
  );
}
