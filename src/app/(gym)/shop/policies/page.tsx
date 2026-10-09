import type { Metadata } from "next";
import { getCatalog } from "@/lib/shop/server";

export const metadata: Metadata = { title: "Shipping, Returns & Contact", description: "Delivery times, return policy, seller details and how to contact the store.", alternates: { canonical: "/shop/policies" } };

export default async function Policies() {
  const { settings: s } = await getCatalog();
  return (
    <section className="prose-royal mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1>Shipping, returns & contact</h1>
      <h2>Delivery</h2>
      <p>{s.dispatchText}</p>
      <p>{s.shippingFee > 0 ? `Delivery charge ₹${s.shippingFee}${s.freeShippingOver > 0 ? `, free on orders of ₹${s.freeShippingOver.toLocaleString("en-IN")} or more` : ""}.` : "Delivery is free on every order."}</p>
      <h2>Returns & replacements</h2>
      <p>{s.returnPolicy}</p>
      <h2>Payments</h2>
      <p>Payments are processed securely by Razorpay (UPI, cards, net banking, wallets). We never see or store your card or UPI details.</p>
      <h2>Seller details</h2>
      <p>
        {s.storeName}
        <br />
        {s.address}
        {s.fssaiLicence && (
          <>
            <br />
            FSSAI Licence No. {s.fssaiLicence}
          </>
        )}
        {s.gstin && (
          <>
            <br />
            GSTIN {s.gstin}
          </>
        )}
      </p>
      <h2>Contact</h2>
      <p>
        Phone / WhatsApp: <a href={`https://wa.me/${s.whatsapp}`}>{s.phone}</a>
      </p>
    </section>
  );
}
