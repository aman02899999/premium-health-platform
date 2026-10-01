"use client";

import { useCallback, useSyncExternalStore } from "react";
import { MAX_CART_ITEMS } from "@/lib/library/cart";

// The library cart lives in localStorage (ids only — prices always come from the server).
const KEY = "rfc-library-cart";
const EVENT = "rfc-library-cart";
const EMPTY: string[] = [];
let cache: { raw: string | null; items: string[] } = { raw: null, items: EMPTY };

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return cache.items;
  }
  if (raw === cache.raw) return cache.items;
  let items: string[] = EMPTY;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    items = Array.isArray(parsed) ? parsed.filter((i): i is string => typeof i === "string").slice(0, MAX_CART_ITEMS) : EMPTY;
  } catch {
    items = EMPTY;
  }
  cache = { raw, items };
  return items;
}

function write(items: string[]) {
  const next = [...new Set(items)].slice(0, MAX_CART_ITEMS);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    cache = { raw: JSON.stringify(next), items: next };
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  const add = useCallback((id: string) => write([...read(), id]), []);
  const remove = useCallback((id: string) => write(read().filter((i) => i !== id)), []);
  const replace = useCallback((ids: string[]) => write(ids), []);
  const clear = useCallback(() => write([]), []);
  return { items, add, remove, replace, clear, has: (id: string) => items.includes(id) };
}
