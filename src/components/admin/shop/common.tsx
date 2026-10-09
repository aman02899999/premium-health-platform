"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { Priced, PricedCombo } from "@/lib/shop/pricing";
import type { Category, Order, Post, ShopSettings } from "@/lib/shop/types";

export type Stats = {
  revenueTotal: number;
  revenue30: number;
  ordersPaid: number;
  ordersToShip: number;
  todayOrders: number;
  abandoned: number;
  avgOrder: number;
  lowStock: { id: string; name: string; stock: number }[];
  top: { name: string; qty: number; revenue: number }[];
  daily: { day: string; orders: number; revenue: number }[];
};

export type ShopData = {
  today: string;
  channels: { razorpay: boolean; email: boolean };
  settings: ShopSettings;
  categories: Category[];
  products: Priced[];
  combos: PricedCombo[];
  posts: Post[];
  orders: Order[];
  stats: Stats;
};

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
export const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export async function shopPost<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/admin/shop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json as T;
}

export function Label({ label, help, children, wide }: { label: string; help?: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/55">{label}</span>
      {children}
      {help && <span className="mt-1 block text-xs text-white/40">{help}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white/80">
      <input type="checkbox" className="h-5 w-5 accent-amber-400" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function SaveBar({ busy, onSave, onCancel, onDelete, saveLabel = "Save" }: { busy: boolean; onSave: () => void; onCancel?: () => void; onDelete?: () => void; saveLabel?: string }) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-6 flex flex-wrap items-center gap-2 border-t border-white/10 bg-coal/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5">
      <button type="button" disabled={busy} onClick={onSave} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-black text-black disabled:opacity-60">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} {saveLabel}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/75">
          Cancel
        </button>
      )}
      {onDelete && (
        <button type="button" disabled={busy} onClick={onDelete} className="ml-auto rounded-xl border border-red-400/40 px-4 py-2.5 text-sm text-red-200 hover:bg-red-500/10">
          Delete
        </button>
      )}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 ${className}`}>{children}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/50">{children}</p>;
}
