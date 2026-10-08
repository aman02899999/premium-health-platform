import type { Metadata } from "next";
import { getCatalog } from "@/lib/shop/server";
import { ComboCard } from "@/components/shop/cards";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Supplement Combo Offers — Extra Savings on Bundles",
  description: "Supplement combos at sale prices plus an extra discount: protein, pre-workout, aminos and multivitamins bundled together.",
  alternates: { canonical: "/shop/combos" },
};

export default async function CombosPage() {
  const { combos } = await getCatalog();
  const list = [...combos].sort((a, b) => Number(b.available) - Number(a.available) || a.price - b.price);
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-widest text-amber-300">Bundle & save more</p>
      <h1 className="font-display text-4xl text-white sm:text-5xl">Combo deals</h1>
      <p className="mt-2 max-w-2xl text-white/60">Every combo is priced from the products&apos; sale prices, then an extra discount on top. The crossed-out price is what the items cost at their regular prices.</p>
      {list.length === 0 ? (
        <p className="mt-10 rounded-3xl border border-white/10 p-10 text-center text-white/60">New combos are on the way.</p>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <ComboCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </section>
  );
}
