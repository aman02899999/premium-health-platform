// Real-database test (see src/lib/growth/db.integration.test.ts for how to run it).
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("supplement store on a real database", () => {
  let pool: import("pg").Pool;
  let s: typeof import("./store");
  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    pool = (await import("@/health/db")).pool;
    s = await import("./store");
  });
  beforeEach(async () => {
    await pool.query("truncate public.shop_orders, public.shop_combos, public.shop_products, public.shop_posts, public.shop_categories, public.shop_settings");
    vi.resetModules();
    s = await import("./store"); // fresh "seeded" flag
  });
  afterAll(async () => {
    await pool.end();
  });

  const product = (over: Partial<import("./types").Product> = {}) => ({
    slug: "blackwolf-whey", name: "Blackwolf Whey", brand: "Blackwolf", categoryId: null, sku: null, listPrice: 5999, discountPct: null, stock: 5, size: "2 kg", flavours: ["Chocolate"],
    images: [], shortDescription: "", description: "", highlights: [], nutrition: [], howToUse: "", warnings: "", featured: true, active: true, seoTitle: null, seoDescription: null, ...over,
  });

  it("seeds a fresh store once: settings, discount categories, starter blog", async () => {
    const cats = await s.listCategories();
    expect(cats.find((c) => c.slug === "protein")?.discountPct).toBe(50);
    expect(cats.find((c) => c.slug === "multivitamins-tablets")?.discountPct).toBe(30);
    expect(cats.find((c) => c.slug === "amino-acids")?.discountPct).toBe(50);
    expect((await s.listPosts()).length).toBe(8);
    expect((await s.getSettings()).storeName).toBe("Royal Supplements Store");
    // Deleting all posts doesn't bring them back.
    await pool.query("delete from public.shop_posts");
    vi.resetModules();
    s = await import("./store");
    expect((await s.listPosts()).length).toBe(0);
  });

  it("products are priced from their category; combos add the extra 10% off", async () => {
    const cats = await s.listCategories();
    const protein = cats.find((c) => c.slug === "protein")!.id;
    const tabs = cats.find((c) => c.slug === "multivitamins-tablets")!.id;
    const whey = await s.saveProduct(product({ categoryId: protein }));
    const multi = await s.saveProduct(product({ slug: "multi", name: "Multi", categoryId: tabs, listPrice: 1499, flavours: [] }));
    await s.saveCombo({ slug: "starter", name: "Starter combo", description: "", image: null, items: [{ productId: whey.id, qty: 1 }, { productId: multi.id, qty: 1 }], extraPct: 10, featured: true, active: true });
    const c = await s.loadCatalog();
    expect(c.productById.get(whey.id)?.salePrice).toBe(3000);
    expect(c.productById.get(multi.id)?.salePrice).toBe(1049);
    expect(c.combos[0].price).toBe(Math.round((3000 + 1049) * 0.9));
    // Hiding a product hides it and any combo that contains it.
    await s.saveProduct({ ...product({ categoryId: protein }), id: whey.id, active: false });
    const c2 = await s.loadCatalog();
    expect(c2.products.map((p) => p.slug)).toEqual(["multi"]);
    expect(c2.combos).toHaveLength(0);
  });

  it("an order is paid once and stock goes down once, even with concurrent confirmations", async () => {
    const whey = await s.saveProduct(product());
    const combo = await s.saveCombo({ slug: "duo", name: "Duo", description: "", image: null, items: [{ productId: whey.id, qty: 2 }], extraPct: 10, featured: false, active: true });
    await s.insertOrder({
      number: "RS-ABC123", razorpayOrderId: "order_1", userId: null, name: "Aman", email: "A@x.in", phone: "9876543210",
      address: { line1: "1", line2: "", landmark: "", city: "Noida", state: "UP", pincode: "201304" },
      items: [{ kind: "product", id: whey.id, slug: whey.slug, name: whey.name, qty: 1, unitList: 5999, unitPrice: 3000 }, { kind: "combo", id: combo.id, slug: "duo", name: "Duo", qty: 1, unitList: 11998, unitPrice: 5400 }],
      listTotal: 17997, discountTotal: 9597, shipping: 0, total: 8400, note: "",
    });
    const results = await Promise.all([s.markShopPaid("order_1", "pay_1"), s.markShopPaid("order_1", "pay_1"), s.markShopPaid("order_1", "pay_1")]);
    expect(results.filter((r) => r?.firstTime)).toHaveLength(1);
    const left = (await s.listProducts())[0].stock;
    expect(left).toBe(5 - 1 - 2);
    expect(await s.markShopPaid("missing", "p")).toBeNull();
    // Visible to the customer by email, any letter case.
    expect((await s.ordersForCustomer("00000000-0000-0000-0000-000000000000", "a@X.in")).map((o) => o.number)).toEqual(["RS-ABC123"]);
    const shipped = await s.updateOrder(results[0]!.order.id, { fulfilment: "shipped", courier: "Delhivery", tracking: "DL123" });
    expect(shipped).toMatchObject({ fulfilment: "shipped", courier: "Delhivery", tracking: "DL123" });
  });

  it("uses the combo contents the customer bought, and flags overselling instead of hiding it", async () => {
    const whey = await s.saveProduct(product({ stock: 1 }));
    const multi = await s.saveProduct(product({ slug: "multi", name: "Multi", listPrice: 999, stock: 10, flavours: [] }));
    const combo = await s.saveCombo({ slug: "pair", name: "Pair", description: "", image: null, items: [{ productId: whey.id, qty: 1 }, { productId: multi.id, qty: 1 }], extraPct: 10, featured: false, active: true });
    const order = (n: string, rzp: string) =>
      s.insertOrder({
        number: n, razorpayOrderId: rzp, userId: null, name: "Aman", email: "a@x.in", phone: "9876543210",
        address: { line1: "1", line2: "", landmark: "", city: "Noida", state: "UP", pincode: "201304" },
        items: [{ kind: "combo", id: combo.id, slug: "pair", name: "Pair", qty: 1, unitList: 6998, unitPrice: 3599, contents: [{ productId: whey.id, name: "Blackwolf Whey", qty: 1 }, { productId: multi.id, name: "Multi", qty: 1 }] }],
        listTotal: 6998, discountTotal: 3399, shipping: 0, total: 3599, note: "",
      });
    await order("RS-AAA111", "order_a");
    await order("RS-BBB222", "order_b");
    // The admin edits the combo after both checkouts: payment must still deduct what was sold.
    await s.saveCombo({ id: combo.id, slug: "pair", name: "Pair", description: "", image: null, items: [{ productId: multi.id, qty: 3 }, { productId: whey.id, qty: 1 }], extraPct: 10, featured: false, active: true });
    const a = await s.markShopPaid("order_a", "pay_a");
    const b = await s.markShopPaid("order_b", "pay_b");
    const stock = new Map((await s.listProducts()).map((p) => [p.slug, p.stock]));
    expect(stock.get("multi")).toBe(8);
    expect(stock.get("blackwolf-whey")).toBe(0);
    expect(a!.order.adminNotes).toBe("");
    expect(b!.order.adminNotes).toMatch(/Stock was short.*Blackwolf Whey: needed 1, had 0/);
  });

  it("holds stock for other shoppers' open checkouts, but not against the buyer's own retry", async () => {
    const whey = await s.saveProduct(product({ stock: 5 }));
    const order = (n: string, phone: string, email: string, items: import("./types").OrderItem[], minsAgo = 0) =>
      s.insertOrder({ number: n, razorpayOrderId: `o-${n}`, userId: null, name: "Buyer", email, phone, address: { line1: "1", line2: "", landmark: "", city: "Noida", state: "UP", pincode: "201304" }, items, listTotal: 1, discountTotal: 0, shipping: 0, total: 1, note: "" })
        .then(() => pool.query(`update public.shop_orders set created_at = now() - make_interval(mins => $2) where number = $1`, [n, minsAgo]));
    const line = (qty: number): import("./types").OrderItem => ({ kind: "product", id: whey.id, slug: whey.slug, name: whey.name, qty, unitList: 1, unitPrice: 1 });
    await order("RS-HLD001", "9000000001", "a@x.in", [line(2)]); // held
    await order("RS-HLD002", "9000000002", "b@x.in", [{ kind: "combo", id: "c", slug: "duo", name: "Duo", qty: 2, unitList: 1, unitPrice: 1, contents: [{ productId: whey.id, name: whey.name, qty: 1 }] }]); // 2 held via a combo
    await order("RS-HLD003", "9000000003", "c@x.in", [line(4)], 30); // expired
    await order("RS-HLD004", "9000000004", "d@x.in", [line(1)]);
    await pool.query(`update public.shop_orders set status = 'paid' where number = 'RS-HLD004'`); // already deducted on payment
    expect((await s.heldStock("9999999999", "z@x.in")).get(whey.id)).toBe(4);
    expect((await s.heldStock("9000000001", "new@x.in")).get(whey.id)).toBe(2); // own retry by phone
    expect((await s.heldStock("9999999999", "B@X.in")).get(whey.id)).toBe(2); // own retry by email

    const { withHolds, quoteCart, priceProduct } = await import("./pricing");
    const priced = new Map([[whey.id, priceProduct(whey, [])]]);
    const cart = [{ kind: "product" as const, id: whey.id, qty: 2 }];
    const settings = { shippingFee: 0, freeShippingOver: 0 };
    expect(quoteCart(cart, priced, new Map(), settings).problems).toEqual([]);
    expect(quoteCart(cart, withHolds(priced, await s.heldStock("9999999999", "z@x.in")), new Map(), settings).problems[0]).toMatch(/Only 1 of/);
  });
});
