"use client";

import { useState } from "react";
import { trackMonetizationEvent, getAttributionFromUrl } from "@/lib/monetization/analytics";

export function BuyButton({ productId, price, page }: { productId: string; price: number; page: string }) {
  const [busy, setBusy] = useState(false);

  const handleBuy = async () => {
    setBusy(true);
    trackMonetizationEvent({ type: "checkout_started", productId, page, utm: getAttributionFromUrl() });
    try {
      const res = await fetch("/api/monetization/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, productType: "digital", page, utm: getAttributionFromUrl() }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.order) {
        // fallback to mock checkout
        window.location.href = `/api/monetization/checkout/mock?orderId=${data.order.id}`;
      } else {
        alert(JSON.stringify(data));
      }
    } catch (e) {
      alert("Failed to create order");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button onClick={handleBuy} disabled={busy} className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-stone-900 hover:bg-amber-400 disabled:opacity-60">
      {busy ? "Creating order…" : `Buy Now — ₹${price} (Demo Checkout)`}
    </button>
  );
}
