"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartLine } from "@/lib/shop/types";

// The cart lives in this browser (localStorage). It only holds ids and quantities:
// every price is recalculated on the server from the catalogue.
const KEY = "rs-cart-v1";

type Cart = {
  lines: CartLine[];
  count: number;
  ready: boolean;
  add: (line: CartLine) => void;
  setQty: (index: number, qty: number) => void;
  remove: (index: number) => void;
  clear: () => void;
  /** Last add, for the "added to cart" toast. */
  lastAdded: { name: string; at: number } | null;
  announce: (name: string) => void;
};

const Ctx = createContext<Cart | null>(null);

const same = (a: CartLine, b: CartLine) => a.kind === b.kind && a.id === b.id && (a.kind === "combo" || b.kind === "combo" || (a.flavour ?? "") === (b.flavour ?? ""));

function read(): CartLine[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((l) => l && (l.kind === "product" || l.kind === "combo") && typeof l.id === "string").slice(0, 50) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [lastAdded, setLastAdded] = useState<Cart["lastAdded"]>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount
    setLines(read());
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === KEY && setLines(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: CartLine[]) => {
    setLines(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage full or blocked */
    }
  }, []);

  const value = useMemo<Cart>(
    () => ({
      lines,
      ready,
      count: lines.reduce((s, l) => s + l.qty, 0),
      lastAdded,
      add: (line) => {
        const i = lines.findIndex((l) => same(l, line));
        if (i >= 0) persist(lines.map((l, k) => (k === i ? { ...l, qty: Math.min(20, l.qty + line.qty) } : l)));
        else persist([...lines, { ...line, qty: Math.min(20, Math.max(1, line.qty)) }].slice(0, 50));
      },
      setQty: (index, qty) => persist(lines.map((l, k) => (k === index ? { ...l, qty: Math.min(20, Math.max(1, qty)) } : l))),
      remove: (index) => persist(lines.filter((_, k) => k !== index)),
      clear: () => persist([]),
      announce: (name) => setLastAdded({ name, at: Date.now() }),
    }),
    [lines, ready, lastAdded, persist],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): Cart {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
