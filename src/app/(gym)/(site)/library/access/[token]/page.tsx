import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Download, Bookmark } from "lucide-react";
import { coverSrc } from "@/lib/library/catalog";
import { orderByToken } from "@/lib/library/orders";
import { DOWNLOADS_PER_BOOK, bookBySlug } from "@/lib/library/pricing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your Library Downloads", robots: { index: false, follow: false } };

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ paid?: string }> };

export default async function AccessPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { paid } = await searchParams;
  let order: Awaited<ReturnType<typeof orderByToken>> = null;
  try {
    order = await orderByToken(token);
  } catch (err) {
    console.error("[library] access lookup failed:", (err as Error).message);
  }

  if (!order) {
    return (
      <section className="mx-auto max-w-xl px-4 pb-24 pt-32 text-center sm:px-6">
        <h1 className="font-display text-3xl text-white">Link not found</h1>
        <p className="mt-4 text-white/65">This download page doesn&apos;t exist or has expired. If you bought a book, recover your downloads with your email and payment ID.</p>
        <Link href="/library/recover" className="btn-brand mt-8 inline-block rounded-full px-6 py-3 font-bold">Recover my books</Link>
      </section>
    );
  }

  const books = order.slugs.map((s) => bookBySlug(s)).filter((b): b is NonNullable<typeof b> => Boolean(b));
  return (
    <section className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6">
      {paid && (
        <p className="mb-6 flex items-center gap-2 rounded-2xl bg-emerald-500/15 p-4 text-emerald-200">
          <CheckCircle2 className="h-5 w-5" /> Payment successful — thank you, {order.name.split(" ")[0]}!
        </p>
      )}
      <h1 className="font-display text-4xl text-white">Your downloads</h1>
      <p className="mt-2 text-white/65">{order.title}</p>
      <div className="mt-5 flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        <Bookmark className="h-5 w-5 shrink-0 text-brand" />
        <p>
          <strong className="text-white">Bookmark this page.</strong> It&apos;s your private link — each book can be downloaded {DOWNLOADS_PER_BOOK} times. Lost it? Use{" "}
          <Link href="/library/recover" className="text-brand underline">Recover my books</Link> with {order.email} and payment ID {order.razorpayPaymentId}.
        </p>
      </div>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {books.map((b) => {
          const used = order.downloads[b.slug] ?? 0;
          const left = Math.max(0, DOWNLOADS_PER_BOOK - used);
          return (
            <li key={b.slug} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md">
                <Image src={coverSrc(b.volume)} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <p className="text-xs text-white/45">Vol. {b.volume} · {b.pages} pages</p>
                  <p className="truncate font-semibold text-white">{b.title}</p>
                </div>
                {left > 0 ? (
                  <a href={`/api/library/download/${token}/${b.slug}`} className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white">
                    <Download className="h-4 w-4" /> Download PDF <span className="font-normal opacity-75">({left} left)</span>
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-white/50">Download limit reached</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
