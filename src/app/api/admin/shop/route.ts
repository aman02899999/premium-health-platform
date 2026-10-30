import { NextResponse } from "next/server";
import { adminIdentity, isAdmin, isManager } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { emailConfigured } from "@/lib/growth/providers";
import { razorpayConfigured } from "@/lib/payments/razorpay";
import { suggestCombo } from "@/lib/shop/pricing";
import { expireShop, expireStoreLinks } from "@/lib/shop/server";
import {
  deleteCategory, deleteCombo, deletePost, deleteProduct, listOrders, listPosts, loadCatalog, saveCategory, saveCombo, savePost, saveProduct, saveSettings, updateOrder,
} from "@/lib/shop/store";
import { parseCategory, parseCombo, parsePost, parseProduct, parseSettings } from "@/lib/shop/validate";
import { parseScan } from "@/lib/shop/scan-code";
import { STOCK_REASONS, applyCount, changeStock, findBarcode, linkBarcode, listBarcodes, listStockMoves, type StockReason } from "@/lib/shop/scanner";
import { cancelCounterSale, createCounterSale, listCounterSales } from "@/lib/shop/counter-sales";
import { PAYMENTS, type BillLineInput, type Payment } from "@/lib/shop/counter";
import { openFoodFactsProvider } from "@/health/services/health/providers/openfoodfacts/provider";
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
    const [cat, posts, orders, barcodes, counterSales] = await Promise.all([
      loadCatalog(false),
      listPosts(false),
      listOrders({ limit: 1000 }),
      // Before the barcode migration runs, the rest of the store admin keeps working.
      listBarcodes().catch(() => []),
      listCounterSales(100).catch(() => []),
    ]);
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
      barcodes,
      counterSales,
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
    expireShop();
    return NextResponse.json({ ok: true, ...data });
  };
  const bad = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });
  try {
    switch (b.action) {
      case "save-product": {
        const p = parseProduct(b);
        if (typeof p === "string") return bad(p);
        // A product added from the scanner carries the code that was scanned.
        const scan = typeof b.barcode === "string" && b.barcode ? parseScan(b.barcode) : null;
        if (scan && !p.id) {
          const taken = await findBarcode(scan.code);
          if (taken) return bad("That barcode is already on another product. Scan it again to open that product.");
        }
        const product = await saveProduct(p);
        const refused = scan ? await linkBarcode(scan.code, product.id, typeof b.barcodeVariant === "string" ? b.barcodeVariant : "") : null;
        return refused ? NextResponse.json({ error: refused }, { status: 409 }) : done({ product });
      }
      case "scan": {
        const scan = parseScan(String(b.code ?? ""));
        if (!scan) return bad("That code is too short. Scan again or type the numbers under the barcode.");
        const match = await findBarcode(scan.code);
        if (match) return NextResponse.json({ ok: true, scan, match });
        // New code: try the free Open Food Facts database for a name and photo. Supplements are often missing.
        const found = scan.kind === "qr" ? null : await Promise.race([openFoodFactsProvider.getById(scan.code).catch(() => null), new Promise<null>((r) => setTimeout(() => r(null), 6000))]);
        const suggestion = found?.name ? { name: found.name, brand: found.brand ?? "", image: found.image ?? "", source: found.provenance?.source_url ?? "" } : null;
        return NextResponse.json({ ok: true, scan, match: null, suggestion });
      }
      case "link-barcode": {
        const scan = parseScan(String(b.code ?? ""));
        if (!scan || !isUuid(b.productId)) return bad("Invalid barcode or product");
        const refused = await linkBarcode(scan.code, b.productId, typeof b.variant === "string" ? b.variant : "", b.move === true);
        return refused ? NextResponse.json({ error: refused }, { status: 409 }) : done({ code: scan.code });
      }
      case "stock": {
        if (!isUuid(b.productId) || !STOCK_REASONS.includes(b.reason as StockReason)) return bad("Invalid stock change");
        const r = await changeStock(b.productId, Number(b.qty), b.reason as StockReason, typeof b.note === "string" ? b.note : "");
        return typeof r === "string" ? bad(r) : done(r);
      }
      case "count": {
        const counts = Array.isArray(b.counts) ? (b.counts as { productId?: unknown; qty?: unknown }[]) : [];
        if (counts.some((c) => !isUuid(c?.productId))) return bad("Invalid count");
        const r = await applyCount(counts.map((c) => ({ productId: c.productId as string, qty: Number(c.qty) })), typeof b.note === "string" ? b.note : "");
        return typeof r === "string" ? bad(r) : done(r);
      }
      case "sale": {
        const lines = Array.isArray(b.lines) ? (b.lines as Record<string, unknown>[]) : [];
        if (lines.some((l) => !isUuid(l?.productId))) return bad("Invalid item");
        if (!PAYMENTS.some((p) => p.id === b.payment)) return bad("Pick how the customer paid.");
        const phone = typeof b.customerPhone === "string" ? b.customerPhone.replace(/\D/g, "").slice(-10) : "";
        if (phone && !/^[6-9]\d{9}$/.test(phone)) return bad("Enter a 10-digit mobile number, or leave it empty.");
        const sale = await createCounterSale({
          lines: lines.map((l) => ({
            productId: l.productId as string,
            qty: Number(l.qty),
            unitPrice: l.unitPrice === null || l.unitPrice === undefined || l.unitPrice === "" ? null : Number(l.unitPrice),
            variant: typeof l.variant === "string" ? l.variant : "",
            code: typeof l.code === "string" ? l.code : "",
          })) satisfies BillLineInput[],
          billDiscount: Number(b.billDiscount ?? 0),
          payment: b.payment as Payment,
          customerName: typeof b.customerName === "string" ? b.customerName : "",
          customerPhone: phone,
          note: typeof b.note === "string" ? b.note : "",
          madeBy: await adminIdentity(),
        });
        return typeof sale === "string" ? bad(sale) : done({ sale });
      }
      case "cancel-sale": {
        if (!(await isManager())) return NextResponse.json({ error: "Only the owner or a manager can cancel a bill." }, { status: 403 });
        if (!isUuid(b.id)) return bad("Invalid id");
        const sale = await cancelCounterSale(b.id, typeof b.reason === "string" ? b.reason : "");
        return typeof sale === "string" ? bad(sale) : done({ sale });
      }
      case "moves": {
        if (b.productId !== undefined && !isUuid(b.productId)) return bad("Invalid id");
        return NextResponse.json({ ok: true, moves: await listStockMoves(b.productId as string | undefined, 30) });
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
        expireStoreLinks();
        return done();
      }
      case "delete": {
        if (!isUuid(b.id)) return bad("Invalid id");
        const fn = { product: deleteProduct, category: deleteCategory, combo: deleteCombo, post: deletePost }[String(b.kind)];
        if (!fn) return bad("Invalid kind");
        const refused = await fn(b.id);
        return refused ? NextResponse.json({ error: refused }, { status: 409 }) : done();
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
