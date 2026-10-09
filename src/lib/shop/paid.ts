import "server-only";
import { notifyOrderPaid } from "./notify";
import { expireShop } from "./server";
import { getSettings, markShopPaid } from "./store";

/**
 * Called by the browser verify step and the Razorpay webhook, in either order.
 * Returns false when the Razorpay order isn't a store order. Emails go out once.
 */
export async function afterShopPaid(razorpayOrderId: string, paymentId: string): Promise<boolean> {
  const res = await markShopPaid(razorpayOrderId, paymentId);
  if (!res) return false;
  if (res.firstTime) {
    try {
      await notifyOrderPaid(res.order, await getSettings());
    } catch (err) {
      console.error("[shop] notify failed:", (err as Error).message);
    }
    // Stock changed: refresh the storefront pages.
    try {
      expireShop();
    } catch {
      /* outside a request context (tests) */
    }
  }
  return true;
}
