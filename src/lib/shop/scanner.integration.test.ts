// Real-database test (see src/lib/growth/db.integration.test.ts for how to run it).
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("store scanner on a real database", () => {
  let pool: import("pg").Pool;
  let s: typeof import("./store");
  let sc: typeof import("./scanner");
  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    pool = (await import("@/health/db")).pool;
    s = await import("./store");
    sc = await import("./scanner");
  });
  beforeEach(async () => {
    await pool.query("truncate public.shop_stock_moves, public.shop_barcodes, public.shop_orders, public.shop_combos, public.shop_products cascade");
  });
  afterAll(async () => {
    await pool.end();
  });

  const product = (over: Partial<import("./types").Product> = {}) => ({
    slug: "blackwolf-whey", name: "Blackwolf Whey", brand: "Blackwolf", categoryId: null, sku: null, listPrice: 5999, discountPct: null, stock: 5, size: "2 kg", flavours: ["Chocolate"],
    images: [], shortDescription: "", description: "", highlights: [], nutrition: [], howToUse: "", warnings: "", featured: false, active: true, seoTitle: null, seoDescription: null, ...over,
  });

  it("links a barcode to one product and refuses to steal it without 'move'", async () => {
    const whey = await s.saveProduct(product());
    const eaa = await s.saveProduct(product({ slug: "eaa", name: "EAA" }));
    expect(await sc.linkBarcode("8901030875021", whey.id, "Chocolate 2 kg")).toBeNull();
    expect(await sc.findBarcode("8901030875021")).toEqual({ code: "8901030875021", productId: whey.id, variant: "Chocolate 2 kg" });
    expect(await sc.linkBarcode("8901030875021", eaa.id, "")).toMatch(/already on “Blackwolf Whey”/);
    expect((await sc.findBarcode("8901030875021"))?.productId).toBe(whey.id);
    expect(await sc.linkBarcode("8901030875021", eaa.id, "", true)).toBeNull();
    expect((await sc.findBarcode("8901030875021"))?.productId).toBe(eaa.id);
    // A second code on the same product is fine.
    expect(await sc.linkBarcode("96385074", eaa.id, "")).toBeNull();
    expect((await sc.listBarcodes()).filter((b) => b.productId === eaa.id)).toHaveLength(2);
    expect(await sc.linkBarcode("12345678", "00000000-0000-0000-0000-000000000000", "")).toMatch(/no longer exists/);
  });

  it("records every stock change with its reason, including form edits and online orders", async () => {
    const whey = await s.saveProduct(product());
    expect(await sc.changeStock(whey.id, 10, "stock-in", "Bill 42 from distributor")).toEqual({ stock: 15 });
    expect(await sc.changeStock(whey.id, -2, "damaged")).toEqual({ stock: 13 });
    expect(await sc.changeStock(whey.id, -20, "sold")).toMatch(/Only 13/);
    expect(await sc.changeStock(whey.id, 0, "sold")).toMatch(/whole number/);
    await s.saveProduct({ ...product({ stock: 12 }), id: whey.id });
    await s.insertOrder({
      number: "RS-SCAN01", razorpayOrderId: "order_scan", userId: null, name: "Aman", email: "a@x.in", phone: "9876543210",
      address: { line1: "1", line2: "", landmark: "", city: "Noida", state: "UP", pincode: "201304" },
      items: [{ kind: "product", id: whey.id, slug: whey.slug, name: whey.name, qty: 1, unitList: 5999, unitPrice: 3000 }],
      listTotal: 5999, discountTotal: 2999, shipping: 0, total: 3000, note: "",
    });
    await s.markShopPaid("order_scan", "pay_scan");
    const moves = await sc.listStockMoves(whey.id);
    expect(moves.map((m) => [m.reason, m.delta, m.stockAfter, m.note])).toEqual([
      ["online-order", -1, 11, "RS-SCAN01"],
      ["edit", -1, 12, ""],
      ["damaged", -2, 13, ""],
      ["stock-in", 10, 15, "Bill 42 from distributor"],
      ["new-product", 5, 5, ""],
    ]);
  });

  it("a shelf count sets the real numbers in one go and only logs real changes", async () => {
    const a = await s.saveProduct(product({ stock: 9999 }));
    const b = await s.saveProduct(product({ slug: "bcaa", name: "BCAA", stock: 3 }));
    expect(await sc.applyCount([{ productId: a.id, qty: 4 }, { productId: b.id, qty: 3 }], "Shelf count 30 Oct")).toEqual({ changed: 1 });
    expect((await s.listProducts()).find((p) => p.id === a.id)?.stock).toBe(4);
    const counts = (await sc.listStockMoves()).filter((m) => m.reason === "count");
    expect(counts).toHaveLength(1);
    expect(counts[0]).toMatchObject({ productId: a.id, delta: -9995, stockAfter: 4, note: "Shelf count 30 Oct" });
    expect(await sc.applyCount([{ productId: a.id, qty: -1 }])).toMatch(/0 or more/);
  });
});
