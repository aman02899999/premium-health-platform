import { NextResponse } from "next/server";
import { isDbConfigured } from "@/health/db";
import { currentCustomer } from "@/lib/shop/server";
import { allowTest } from "@/lib/push/core";
import { pushConfigured, pushToMember } from "@/lib/push/send";

// "Send me a test": a member checks notifications reach their own phone. Only ever to themselves.
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "private, no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

export async function POST() {
  const member = await currentCustomer();
  if (!member) return json({ error: "Please sign in again." }, 401);
  if (!pushConfigured() || !isDbConfigured) return json({ error: "Notifications aren't switched on yet." }, 503);
  if (!allowTest(member.email)) return json({ error: "That's a few tests already. Try again in 10 minutes." }, 429);
  try {
    const out = await pushToMember(member.email, {
      title: "Notifications are on",
      body: "This phone will get a note from Royal Fitness Club when your plan is ready. Turn it off any time in My account.",
      url: "/account",
      tag: "test",
    });
    if (out.sent === 0) return json({ error: "No phone or browser is switched on for your account. Turn notifications on first.", ...out }, 409);
    return json({ ok: true, ...out });
  } catch (err) {
    console.error("[push] test failed:", (err as Error).message);
    return json({ error: "Couldn't send a test just now. Please try again in a minute." }, 500);
  }
}
