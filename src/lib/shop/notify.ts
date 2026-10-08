import "server-only";
import { SITE_URL } from "@/lib/site";
import { sendEmail, emailConfigured } from "@/lib/growth/providers";
import type { Order, ShopSettings } from "./types";

const inr = (n: number) => `Rs ${n.toLocaleString("en-IN")}`;

export function orderText(o: Order): string {
  const a = o.address;
  const items = o.items
    .map((i) => `- ${i.qty} x ${i.name}${i.flavour ? ` (${i.flavour})` : ""} — ${inr(i.unitPrice * i.qty)}${i.contents ? `\n    contains: ${i.contents.map((c) => `${c.qty} x ${c.name}`).join(", ")}` : ""}`)
    .join("\n");
  return [
    `Order ${o.number} — ${inr(o.total)} paid`,
    "",
    items,
    "",
    `Items at regular price: ${inr(o.listTotal)}`,
    `Discount: -${inr(o.discountTotal)}`,
    `Delivery: ${o.shipping ? inr(o.shipping) : "Free"}`,
    `Total paid: ${inr(o.total)} (Razorpay ${o.razorpayPaymentId ?? ""})`,
    "",
    "Deliver to:",
    o.name,
    a.line1,
    a.line2,
    a.landmark ? `Landmark: ${a.landmark}` : "",
    `${a.city}, ${a.state} ${a.pincode}`,
    `Phone: ${o.phone}`,
    `Email: ${o.email}`,
    o.note ? `Note: ${o.note}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Emails the store and the customer when an order is paid. Silent no-op until email is configured. */
export async function notifyOrderPaid(o: Order, s: ShopSettings): Promise<void> {
  if (!emailConfigured()) return;
  const to = (s.orderEmail || process.env.SHOP_ORDER_EMAIL || "").split(",").map((x) => x.trim()).filter(Boolean);
  const body = orderText(o);
  await Promise.all([
    ...to.map((addr) => sendEmail(addr, `New order ${o.number} — ${inr(o.total)} — ${o.name}`, `${body}\n\nManage it: ${SITE_URL}/admin/shop`)),
    sendEmail(
      o.email,
      `Order confirmed: ${o.number} — ${s.storeName}`,
      `Hi ${o.name.split(" ")[0]},\n\nThank you! We've received your payment and are packing your order.\n\n${body}\n\n${s.dispatchText}\nTrack it any time: ${SITE_URL}/shop/account\n\n${s.storeName} · ${s.phone}`,
    ),
  ]).catch((err) => console.error("[shop] order email failed:", (err as Error).message));
}
