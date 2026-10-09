import type { Metadata } from "next";
import { ShopAccount } from "@/components/shop/ShopAccount";

export const metadata: Metadata = { title: "My Orders", robots: { index: false, follow: false } };

export default function AccountPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-4xl text-white">My orders</h1>
      <ShopAccount />
    </section>
  );
}
