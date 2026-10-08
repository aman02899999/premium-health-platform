import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { emailConfigured } from "@/lib/growth/providers";
import { razorpayConfigured } from "@/lib/payments/razorpay";
import { suggestCombo } from "@/lib/shop/pricing";
import {
  deleteCategory, deleteCombo, deletePost, deleteProduct, listOrders, listPosts, loadCatalog, saveCategory, saveCombo, savePost, saveProduct, saveSettings, updateOrder,
} from "@/lib/shop/store";
import { parseCategory, parseCombo, parsePost, parseProduct, parseSettings } from "@/lib/shop/validate";
import { todayIST } from "@/lib/growth/dates";
import type { Fulfilment } from "@/lib/shop/types";

export const dynamic = "force-dynamic";

const OFFLINE = () => NextResponse.json({ error: "The database connection isn't configured, so the store admin is offline." }, { status: 503 });
const isUuid = (s: unknown): s is string => typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const FULFILMENT: Fulfilment[] = ["new", "packed", "shipped", "delivered", "cancelled", "refunded"];

/** Everything the store admin shows, in one request. */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return OFFLINE();
  try {
    const [cat, posts, orders] = await Promise.all([loadCatalog(false), listPosts(false), listOrders({ limit: 1000 })]);
    const paid = orders.filter((o) => o.status === "paid");
    const today = todayIST();
    const dayOf = (iso: string) => todayIST(new Date(iso));
    const last30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const sold = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of paid) for (const i of o.items) {
      const k = `${i.kind}:${i.id}`;
      const x = sold.get(k) ?? { name: i.name, qty: 0, revenue: 0 };
      x.qty += i.qty;
      x.revenue += i.unitPrice * i.qty;
      sold.set(k, x);
    }
    const daily = Array.from({ length: 14 }, (_, k) => {
      const d = todayIST(new Date(Date.now() - (13 - k) * 86_400_000));
      const day = paid.filter((o) => dayOf(o.paidAt ?? o.createdAt) === d);
      return { day: d.slice(5), orders: day.length, revenue: day.reduce((s, o) => s + o.total, 0) };
    });
    return NextResponse.json({
      today,
      channels: { razorpay: razorpayConfigured(), email: emailConfigured() },
      settings: cat.settings,
      categories: cat.categories,
      products: cat.products,
      combos: cat.combos,
      posts,
      orders,
      stats: {
        revenueTotal: paid.reduce((s, o) => s + o.total, 0),
        revenue30: paid.filter((o) => (o.paidAt ?? o.createdAt) >= last30).reduce((s, o) => s + o.total, 0),
        ordersPaid: paid.length,
        ordersToShip: paid.filter((o) => o.fulfilment === "new" || o.fulfilment === "packed").length,
        todayOrders: paid.filter((o) => dayOf(o.paidAt ?? o.createdAt) === today).length,
        abandoned: orders.filter((o) => o.status === "created").length,
        avgOrder: paid.length ? Math.round(paid.reduce((s, o) => s + o.total, 0) / paid.length) : 0,
        lowStock: cat.products.filter((p) => p.active && p.stock <= 5).map((p) => ({ id: p.id, name: p.name, stock: p.stock })),
        top: [...sold.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8),
        daily,
      },
    });
  } catch (err) {
    console.error("[shop admin] load failed:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load the store. Check that the latest database migration is applied." }, { status: 500 });
  }
}

/** Admin actions: { action, ...fields }. Every save refreshes the storefront. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return OFFLINE();
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b || typeof b.action !== "string") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const done = (data: Record<string, unknown> = {}) => {
    revalidatePath("/shop", "layout");
    revalidatePath("/sitemap.xml");
    return NextResponse.json({ ok: true, ...data });
  };
  const bad = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });
  try {
    switch (b.action) {
      case "save-product": {
        const p = parseProduct(b);
        return typeof p === "string" ? bad(p) : done({ product: await saveProduct(p) });
      }
      case "save-category": {
        const c = parseCategory(b);
        return typeof c === "string" ? bad(c) : done({ category: await saveCategory(c) });
      }
      case "save-combo": {
        const c = parseCombo(b);
        return typeof c === "string" ? bad(c) : done({ combo: await saveCombo(c) });
      }
      case "save-post": {
        const p = parsePost(b);
        return typeof p === "string" ? bad(p) : done({ post: await savePost(p) });
      }
      case "save-settings": {
        const s = parseSettings(b);
        if (typeof s === "string") return bad(s);
        await saveSettings(s);
        return done();
      }
      case "delete": {
        if (!isUuid(b.id)) return bad("Invalid id");
        const fn = { product: deleteProduct, category: deleteCategory, combo: deleteCombo, post: deletePost }[String(b.kind)];
        if (!fn) return bad("Invalid kind");
        await fn(b.id);
        return done();
      }
      case "order": {
        if (!isUuid(b.id)) return bad("Invalid id");
        if (b.fulfilment !== undefined && !FULFILMENT.includes(b.fulfilment as Fulfilment)) return bad("Invalid status");
        const order = await updateOrder(b.id, {
          fulfilment: b.fulfilment as Fulfilment | undefined,
          courier: typeof b.courier === "string" ? b.courier : undefined,
          tracking: typeof b.tracking === "string" ? b.tracking : undefined,
          adminNotes: typeof b.adminNotes === "string" ? b.adminNotes : undefined,
        });
        return order ? NextResponse.json({ ok: true, order }) : bad("Order not found");
      }
      case "suggest-combo": {
        const target = Number(b.target);
        const extra = Number(b.extraPct ?? 10);
        if (!Number.isInteger(target) || target < 200 || target > 200_000 || !Number.isInteger(extra) || extra < 0 || extra > 50) return bad("Enter a target in rupees and an extra discount of 0–50%.");
        const cat = await loadCatalog(true);
        const exclude = new Set(Array.isArray(b.exclude) ? (b.exclude as string[]) : []);
        const s = suggestCombo(target, extra, cat.products.filter((p) => !exclude.has(p.id)));
        return s ? NextResponse.json({ ok: true, suggestion: s }) : bad("No set of in-stock products fits that amount. Add products or try a different amount.");
      }
    }
    return bad("Invalid request");
  } catch (err) {
    const e = err as { code?: string; message: string };
    if (e.code === "23505") return bad("That URL name is already used. Change the slug.");
    console.error("[shop admin] action failed:", e.message);
    return NextResponse.json({ error: "That didn't work. Please try again." }, { status: 500 });
  }
}
