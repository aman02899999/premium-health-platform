import type { Metadata } from "next";
import { Suspense } from "react";
import { getCatalog } from "@/lib/shop/server";
import { ProductBrowser } from "@/components/shop/ProductBrowser";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "All Supplements — Protein, Pre-Workout, Aminos & More",
  description: "Shop genuine whey protein, pre-workout, EAA, BCAA, glutamine, creatine and multivitamins at sale prices. Secure Razorpay checkout.",
  alternates: { canonical: "/shop/products" },
};

export default async function AllProducts() {
  const { products, categories } = await getCatalog();
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="font-display mb-5 text-4xl text-white">All products</h1>
      <Suspense>
        <ProductBrowser products={products} categories={categories} />
      </Suspense>
    </section>
  );
}
