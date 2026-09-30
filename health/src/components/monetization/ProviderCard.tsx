"use client";

import Link from "next/link";
import type { BusinessListing } from "@/lib/monetization/types";
import { MapPin, BadgeCheck, Star } from "lucide-react";

export function ProviderCard({ listing }: { listing: BusinessListing }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{listing.providerType} · {listing.tier} {listing.tier !== "free" && "· Featured"}</p>
          <h3 className="mt-1 font-bold leading-snug">{listing.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-stone-500"><MapPin className="h-3 w-3" /> {listing.location}</p>
        </div>
        {listing.tier !== "free" && <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${listing.tier === "premium" ? "bg-amber-500 text-stone-900" : "bg-emerald-600 text-white"}`}>{listing.tier}</span>}
      </div>
      <p className="mt-2 line-clamp-3 text-sm text-stone-600 dark:text-stone-300">{listing.description}</p>
      <p className="mt-2 text-[11px] text-stone-500">{listing.credentials} {listing.verified ? <span className="inline-flex items-center gap-1 font-bold text-emerald-700"><BadgeCheck className="h-3 w-3" /> Verified</span> : <span className="text-amber-600">Demo — not verified</span>}</p>
      <p className="mt-2 text-[10px] text-stone-400">Clearly separate “Featured” from “Recommended based on clinical evidence.” Do not imply paid listing = medically superior. Do not fabricate credentials.</p>
      <div className="mt-3 flex gap-2">
        <Link href={`/providers/${listing.slug}`} className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-bold hover:bg-stone-50 dark:border-stone-700">View Profile</Link>
        <Link href={`/consultation?provider=${listing.id}`} className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800">Inquire</Link>
      </div>
    </div>
  );
}
