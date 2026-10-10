import type { DietOrder } from "./diet-orders";

// DIET_AUTO_SEND (Vercel env) decides who gets their plan without a coach looking at it first:
//   off            (default) every plan waits for the coach's "Approve & send"
//   no-conditions  plans for clients who reported no health condition and no medicines go out at once
//   all            every plan goes out at once — not recommended
export type AutoSend = "off" | "no-conditions" | "all";
export function autoSendMode(): AutoSend {
  const v = process.env.DIET_AUTO_SEND;
  return v === "no-conditions" || v === "all" ? v : "off";
}
export const needsReview = (o: Pick<DietOrder, "intake">, mode = autoSendMode()) =>
  mode === "off" || (mode === "no-conditions" && (o.intake.conditions.length > 0 || !!o.intake.medicines?.trim() || o.intake.age < 18));

