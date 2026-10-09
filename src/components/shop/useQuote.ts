"use client";

import { useEffect, useState } from "react";
import type { Quote } from "@/lib/shop/pricing";
import { useCart } from "./cart";

/** Server-side prices for the current cart, refreshed whenever the cart changes. */
export function useQuote() {
  const { lines, ready } = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(lines);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for the fetch below
    setLoading(true);
    fetch("/api/shop/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: key === "[]" ? '{"lines":[]}' : JSON.stringify({ lines: JSON.parse(key) }) })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!alive) return;
        if (!r.ok) setError(j.error || "Couldn't load prices.");
        else {
          setError("");
          setQuote(j.quote);
        }
      })
      .catch(() => alive && setError("Network error — check your connection."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [key, ready]);

  return { quote, error, loading: loading || !ready };
}
