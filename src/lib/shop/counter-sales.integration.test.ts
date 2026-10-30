// Real-database test (see src/lib/growth/db.integration.test.ts for how to run it).
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("counter bills on a real database", () => {
  let pool: import("pg").Pool;
  let s: typeof import("./store");
  let cs: typeof import("./counter-sales");
  let sc: typeof import("./scanner");
  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    pool = (await import("@/health/db")).pool;
    s = await import("./store");
    cs = await import("./counter-sales");
    sc = await import("./scanner");
  });
  beforeEach(async () => {
    await pool.query("truncate public.shop_counter_sales, public.shop_stock_moves, public.shop_barcodes, public.shop_orders, public.shop_combos, public.shop_products cascade");
  });
  afterAll(async () => {
    await pool.end();
  });

  const product = (over: Partial<import("./types").Product> = {}) => ({
    slug: "blackwolf-whey", name: "Blackwolf Whey", brand: "Blackwolf", categoryId: null, sku: null, listPrice: 6000, discountPct: 50, stock: 5, size: "2 kg", flavours: [],
    images: [], shortDescription: "", description: "", highlights: [], nutrition: [], howToUse: "", warnings: "", featured: false, active: true, seoTitle: null, seoDescription: null, ...over,
  });
  const sale = (lines: import("./counter").BillLineInput[], over: Partial<import("./counter-sales").NewSale> = {}) =>
    cs.createCounterSale({ lines, billDiscount: 0, payment: "cash", customerName: "", customerPhone: "", note: "", madeBy: "test", ...over });

  it("makes a numbered bill at catalogue prices and takes the units out of stock with the bill number", async () => {
    const whey = await s.saveProduct(product());
    const hidden = await s.saveProduct(product({ slug: "eaa", name: "EAA", listPrice: 3000, discountPct: 0, stock: 2, active: false }));
    const b = await sale([{ productId: whey.id, qty: 2 }, { productId: hidden.id, qty: 1, unitPrice: 2500 }], { billDiscount: 50, payment: "upi", customerPhone: "9876543210" });
    if (typeof b === "string") throw new Error(b);
    expect(b.number).toMatch(/^RB-\d{6}$/);
    expect(b).toMatchObject({ mrpTotal: 15000, subtotal: 8500, billDiscount: 50, total: 8450, payment: "upi", status: "paid" });
    const stock = new Map((await s.listProducts()).map((p) => [p.id, p.stock]));
    expect(stock.get(whey.id)).toBe(3);
    expect(stock.get(hidden.id)).toBe(1);
    expect((await sc.listStockMoves(whey.id))[0]).toMatchObject({ reason: "sold", delta: -2, note: `Bill ${b.number}` });
    const b2 = await sale([{ productId: whey.id, qty: 1 }]);
    // Numbers run on, one per bill.
    expect(typeof b2 !== "string" && Number(b2.number.slice(3))).toBe(Number(b.number.slice(3)) + 1);
  });

  it("refuses a bill when stock is short or a price breaks the rules, and changes nothing", async () => {
    const whey = await s.saveProduct(product({ stock: 1 }));
    const eaa = await s.saveProduct(product({ slug: "eaa", name: "EAA", stock: 5 }));
    expect(await sale([{ productId: eaa.id, qty: 1 }, { productId: whey.id, qty: 2 }])).toMatch(/Only 1 of Blackwolf Whey/);
    expect(await sale([{ productId: whey.id, qty: 1, unitPrice: 6001 }])).toMatch(/above its MRP/);
    expect(new Map((await s.listProducts()).map((p) => [p.id, p.stock])).get(eaa.id)).toBe(5);
    expect(await cs.listCounterSales()).toHaveLength(0);
    // The same product on two lines (two flavours) counts together.
    expect(await sale([{ productId: whey.id, qty: 1, variant: "Choc" }, { productId: whey.id, qty: 1, variant: "Vanilla" }])).toMatch(/Only 1 of/);
    // Refused bills don't use up numbers: the next real bill follows the last one with no gap.
    const a = await sale([{ productId: eaa.id, qty: 1 }]);
    expect(await sale([{ productId: whey.id, qty: 5 }])).toMatch(/Only 1/);
    const c = await sale([{ productId: eaa.id, qty: 1 }]);
    if (typeof a === "string" || typeof c === "string") throw new Error("bill refused");
    expect(Number(c.number.slice(3))).toBe(Number(a.number.slice(3)) + 1);
  });

  it("cancelling a bill puts the stock back once and keeps the bill", async () => {
    const whey = await s.saveProduct(product());
    const b = await sale([{ productId: whey.id, qty: 3 }]);
    if (typeof b === "string") throw new Error(b);
    expect(await cs.cancelCounterSale(b.id, "  ")).toMatch(/why/);
    const c = await cs.cancelCounterSale(b.id, "Customer returned sealed pack");
    expect(c).toMatchObject({ status: "cancelled", cancelReason: "Customer returned sealed pack" });
    expect(await cs.cancelCounterSale(b.id, "again")).toMatch(/already cancelled/);
    expect((await s.listProducts())[0].stock).toBe(5);
    expect((await sc.listStockMoves(whey.id))[0]).toMatchObject({ reason: "returned", delta: 3, note: `Bill ${b.number} cancelled: Customer returned sealed pack` });
    expect((await cs.listCounterSales()).map((x) => x.status)).toEqual(["cancelled"]);
  });
});
