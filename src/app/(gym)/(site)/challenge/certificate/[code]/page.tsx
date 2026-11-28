import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Download, Share2 } from "lucide-react";
import { isDbConfigured } from "@/health/db";
import { SITE_URL } from "@/lib/site";
import { levelName, monthLabel, scorePct } from "@/lib/challenge/levels";
import { certificate } from "@/lib/challenge/store";

// Public verify page for a Certificate of Achievement. Shows only first name + surname initial.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Certificate of Achievement: Royal Knowledge Challenge", robots: { index: false, follow: false } };

export default async function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const cert = isDbConfigured ? await certificate(code) : null;
  if (!cert) notFound();
  const image = `/api/challenge/certificate/${cert.code}`;
  const share = `Maine Royal Knowledge Challenge ka ${levelName(cert.level)} level ${scorePct(cert.correct)}% se pass kiya! Aap bhi try karo: ${SITE_URL}/challenge`;
  return (
    <section className="mx-auto max-w-3xl px-4 pb-10 pt-28 sm:px-6 sm:pt-36">
      <p className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-400/40">
        <BadgeCheck className="h-4 w-4" aria-hidden /> Verified by Royal Fitness Club
      </p>
      <h1 className="mt-3 font-display text-3xl text-white">Certificate of Achievement</h1>
      <p className="mt-2 text-white/80">
        <strong className="text-white">{cert.name}</strong> passed the {levelName(cert.level)} level of the Royal Knowledge Challenge with {scorePct(cert.correct)}% in {monthLabel(cert.month)}. Code {cert.code}.
      </p>
      {/* A generated PNG from our own API route: next/image would only re-encode it. */}
      <a href={image} target="_blank" rel="noopener" className="mt-6 block overflow-hidden rounded-2xl ring-1 ring-white/10">
        <picture>
          <img src={image} alt={`Certificate of Achievement for ${cert.name}`} width={1754} height={1240} className="h-auto w-full" />
        </picture>
      </a>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <a href={image} download={`royal-certificate-${cert.code}.png`} className="btn-brand inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl font-semibold">
          <Download className="h-5 w-5" aria-hidden /> Download
        </a>
        <a href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] font-semibold text-black">
          <Share2 className="h-5 w-5" aria-hidden /> Share on WhatsApp
        </a>
      </div>
      <p className="mt-6 text-xs text-white/50">This is a Certificate of Achievement from Royal Fitness Club for a fitness knowledge quiz. It is not a professional qualification.</p>
      <Link prefetch={false} href="/challenge" className="mt-4 inline-block text-sm font-semibold text-sky hover:text-white">Take the challenge yourself</Link>
    </section>
  );
}
