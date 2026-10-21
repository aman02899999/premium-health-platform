import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { isAdmin } from "@/lib/auth";
import { pool } from "@/health/db";
import { getContent } from "@/lib/content/store";
import { SITE_URL } from "@/lib/site";
import { QR_PAGES, type QrKind } from "@/lib/admin/qr-core";
import { PrintButton } from "@/components/admin/qr/PrintButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "QR poster · Admin", robots: { index: false, follow: false } };

// What the poster says above the code, by what the code opens.
const HEADLINE: Record<QrKind, { title: string; sub: string }> = {
  bot: { title: "Fees, timings & free trial", sub: "Scan to get instant answers on WhatsApp, 24×7" },
  desk: { title: "Talk to us on WhatsApp", sub: "Scan to chat with the front desk" },
  optin: { title: "Get our offers on WhatsApp", sub: "Scan and tap send. Reply STOP PROMOTIONS any time to stop." },
  page: { title: "Scan for details", sub: "Opens on your phone" },
  review: { title: "Enjoying your workouts?", sub: "Scan to leave us a Google review. It takes 30 seconds." },
};

// A printable A4 poster for one QR code: big code, a clear headline, the gym's name and phone.
export default async function QrPoster({ params }: { params: Promise<{ code: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { code } = await params;
  if (!/^[A-Za-z0-9]{6,12}$/.test(code)) notFound();
  const { rows } = await pool.query<{ label: string; kind: QrKind; target: string }>(`select label, kind, target from public.qr_codes where code = $1`, [code]);
  if (!rows[0]) notFound();
  const b = (await getContent()).business;
  const svg = await QRCode.toString(`${SITE_URL}/q/${code}`, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#111111", light: "#ffffff" } });
  // A page poster is titled with the page it opens ("Book a free trial").
  const u = new URL(rows[0].target);
  const page = rows[0].kind === "page" ? QR_PAGES.find((p) => p.path === `${u.pathname}${u.hash}`) : undefined;
  const h = page ? { title: page.label, sub: "Scan to open it on your phone" } : HEADLINE[rows[0].kind];
  return (
    <div className="min-h-screen bg-white text-[#111] print:min-h-0">
      <style>{`@page { size: A4; margin: 14mm } @media print { .no-print { display: none } }`}</style>
      <div className="no-print flex items-center gap-3 border-b border-black/10 px-4 py-3 text-sm">
        <a href="/admin/qr" className="underline">
          ← QR codes
        </a>
        <span className="text-black/50">{rows[0].label}</span>
        <PrintButton />
      </div>
      <main className="mx-auto flex max-w-[180mm] flex-col items-center px-6 py-10 text-center">
        <p className="text-lg font-semibold uppercase tracking-[0.2em] text-[#c8102e]">{b.name}</p>
        <h1 className="mt-4 text-5xl font-black leading-tight">{h.title}</h1>
        <p className="mt-3 text-xl text-black/70">{h.sub}</p>
        <div className="mt-8 w-[120mm] max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-6 text-lg text-black/60">Point your phone camera at the code</p>
        <p className="mt-8 text-xl font-semibold">
          {b.address.street}, {b.address.locality} · Call / WhatsApp {b.phone}
        </p>
      </main>
    </div>
  );
}
