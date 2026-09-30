"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ShoppingBag, Star, ExternalLink } from "lucide-react";
import type { AffiliateProduct, DigitalProduct, Coupon, Sponsor } from "@/lib/monetization/types";
import { trackMonetizationEvent, getAttributionFromUrl } from "@/lib/monetization/analytics";
import { ProductImage } from "./ProductImage";

export function AffiliateProductCard({ product, page = "/" }: { product: AffiliateProduct; page?: string }) {
  useEffect(() => {
    trackMonetizationEvent({ type: "affiliate_product_view", productId: product.id, page, utm: getAttributionFromUrl() });
  }, [product.id, page]);

  const handleClick = () => {
    trackMonetizationEvent({ type: "affiliate_product_click", productId: product.id, page, cta: product.ctaText, utm: getAttributionFromUrl() });
    // also track via existing affiliate click API
    try {
      fetch("/api/affiliate/click", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id, merchant: product.merchant, page }) });
    } catch {}
  };

  return (
    <div className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-xl dark:border-stone-700 dark:bg-stone-900">
      <ProductImage
        image={product.image}
        alt={product.title}
        className="mb-3 aspect-[4/3] w-full"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{product.category} · {product.merchant} · Demo</p>
      <h3 className="mt-1 font-bold leading-snug">{product.title}</h3>
      <p className="mt-1 line-clamp-2 text-[13px] text-stone-600 dark:text-stone-300">{product.description}</p>
      {product.rating && (
        <p className="mt-2 flex items-center gap-1 text-xs"><Star className="h-3 w-3 text-amber-500" /> {product.rating} {product.ratingCount ? `(${product.ratingCount})` : ""}</p>
      )}
      <div className="mt-2 flex items-center gap-2">
        <span className="text-sm font-black text-emerald-700">₹{product.price.toLocaleString("en-IN")}</span>
        {product.originalPrice && <span className="text-xs line-through text-stone-400">₹{product.originalPrice.toLocaleString("en-IN")}</span>}
        {product.discountPercent && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">{product.discountPercent}% OFF</span>}
      </div>
      <div className="mt-3 flex gap-2">
        <Link href={`/products/${product.slug}`} className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-bold hover:bg-stone-50 dark:border-stone-700">View Product</Link>
        <a href={product.affiliateUrl || "#"} target="_blank" rel="noopener noreferrer" onClick={handleClick} className="flex items-center gap-1 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800">
          {product.ctaText} <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <p className="mt-2 text-[10px] text-stone-400">{product.disclosure}</p>
    </div>
  );
}

export function DigitalProductCard({ product, page = "/" }: { product: DigitalProduct; page?: string }) {
  useEffect(() => {
    trackMonetizationEvent({ type: "digital_product_view", productId: product.id, page, utm: getAttributionFromUrl() });
  }, [product.id, page]);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-xl dark:border-stone-700 dark:bg-stone-900">
      <ProductImage
        image={product.image}
        alt={product.title}
        className="mb-3 aspect-[4/3] w-full"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">{product.category} · {product.format} · {product.pages ? `${product.pages} pages` : ""} {product.fileSize ? `· ${product.fileSize}` : ""}</p>
      <h3 className="mt-1 font-bold leading-snug">{product.title}</h3>
      <p className="mt-1 line-clamp-2 text-[13px] text-stone-600 dark:text-stone-300">{product.description}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-sm font-black text-emerald-700">₹{product.price}</span>
        {product.originalPrice && <span className="text-xs line-through text-stone-400">₹{product.originalPrice}</span>}
      </div>
      <div className="mt-3 flex gap-2">
        <Link href={`/store/${product.slug}`} className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-bold hover:bg-stone-50 dark:border-stone-700">View Details</Link>
        <Link href={`/store/${product.slug}`} className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-stone-900 hover:bg-amber-400">{product.ctaText}</Link>
      </div>
      <p className="mt-2 text-[10px] text-stone-400">Educational resource — not a medical diagnosis. Discuss with qualified professional.</p>
    </div>
  );
}

export function SponsoredCard({ sponsor, page = "/" }: { sponsor: Sponsor; page?: string }) {
  const handleClick = () => {
    trackMonetizationEvent({ type: "sponsor_clicked", page, campaign: sponsor.campaign, cta: sponsor.ctaText, utm: getAttributionFromUrl() });
  };
  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-amber-800 dark:from-amber-950/30">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">Sponsored · Paid Partnership · {sponsor.placement}</p>
      <h3 className="mt-1 font-bold">{sponsor.sponsorName} — {sponsor.campaign}</h3>
      <p className="mt-1 text-[13px] text-stone-600 dark:text-stone-300">{sponsor.description}</p>
      <a href={sponsor.url} onClick={handleClick} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800">
        {sponsor.ctaText} <ExternalLink className="h-3 w-3" />
      </a>
      <p className="mt-2 text-[10px] text-stone-500">{sponsor.disclosure} Editorial independence maintained.</p>
    </div>
  );
}

/**
 * Reference time for coupon expiry, captured once at module load.
 *
 * Reading Date.now() during render is impure and makes the result drift between
 * re-renders (a coupon could flip to "expired" mid-session). Coupon expiry is
 * day-granular, so a single snapshot is both stable and sufficient — and it keeps
 * the server and client render passes deterministic.
 */
const COUPON_REFERENCE_TIME = Date.now();

export function CouponCard({ coupon, page = "/" }: { coupon: Coupon; page?: string }) {
  const handleClick = () => {
    trackMonetizationEvent({ type: "coupon_clicked", productId: coupon.id, page, cta: coupon.code, utm: getAttributionFromUrl() });
    try {
      fetch("/api/monetization/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "coupon_clicked", productId: coupon.id, page }) });
    } catch {}
  };
  const isExpired = new Date(coupon.expirationDate).getTime() <= COUPON_REFERENCE_TIME;
  return (
    <div className={`rounded-2xl border p-5 ${isExpired ? "border-stone-200 bg-stone-50 opacity-60" : "border-emerald-200 bg-white dark:border-stone-700 dark:bg-stone-900"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <ProductImage image={coupon.image} alt={coupon.title} className="h-16 w-16 shrink-0 rounded-xl" sizes="64px" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{coupon.merchant} · {coupon.category} {isExpired ? "· Expired" : ""}</p>
            <h3 className="mt-1 font-bold">{coupon.title}</h3>
            <p className="mt-1 text-[13px] text-stone-600 dark:text-stone-300">{coupon.description}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${isExpired ? "bg-stone-200 text-stone-500" : "bg-emerald-600 text-white"}`}>{coupon.discount}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-1 font-mono text-sm font-bold dark:border-stone-700 dark:bg-stone-800">{coupon.code}</span>
        <span className="text-[11px] text-stone-500">Expires: {new Date(coupon.expirationDate).toLocaleDateString("en-IN")} · {coupon.terms}</span>
      </div>
      {!isExpired ? (
        <a href={coupon.affiliateUrl} onClick={handleClick} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800">
          {coupon.ctaText}
        </a>
      ) : (
        <span className="mt-3 inline-block rounded-xl bg-stone-200 px-4 py-2 text-xs font-bold text-stone-500">Expired — automatically hidden from active deals</span>
      )}
      <p className="mt-2 text-[10px] text-stone-400">Affiliate link — we may earn commission at no extra cost to you. Never display expired offers as active — auto-filtered.</p>
    </div>
  );
}
