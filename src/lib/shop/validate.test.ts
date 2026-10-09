import { describe, expect, it } from "vitest";
import { orderNumber, parseBuyer, parseCart } from "./checkout";
import { parseCategory, parseCombo, parsePost, parseProduct, parseSettings } from "./validate";
import { DEFAULT_SETTINGS } from "./defaults";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("admin input", () => {
  it("products: required fields, slug, discount override, lists", () => {
    expect(parseProduct({ name: "x" })).toMatch(/name/);
    expect(parseProduct({ name: "Whey", listPrice: "abc", stock: 1 })).toMatch(/real price/);
    expect(parseProduct({ name: "Whey", listPrice: 100, stock: -1 })).toMatch(/stock/);
    expect(parseProduct({ name: "Whey", listPrice: 100, stock: 1, discountPct: 95 })).toMatch(/0–90/);
    const p = parseProduct({ name: "Blackwolf Whey 2kg!", listPrice: "5999", stock: "12", discountPct: "", flavours: "Chocolate, Vanilla\nMango", images: ["https://cdn.x/a.png", "javascript:alert(1)", "/api/media/x.png"], nutrition: [{ label: "Protein", value: "24 g" }, { label: "", value: "x" }] });
    if (typeof p === "string") throw new Error(p);
    expect(p).toMatchObject({ slug: "blackwolf-whey-2kg", listPrice: 5999, stock: 12, discountPct: null, flavours: ["Chocolate", "Vanilla", "Mango"], images: ["https://cdn.x/a.png", "/api/media/x.png"], nutrition: [{ label: "Protein", value: "24 g" }], active: true });
  });
  it("categories, combos, posts", () => {
    expect(parseCategory({ name: "Protein", discountPct: 50 })).toMatchObject({ slug: "protein", discountPct: 50 });
    expect(parseCategory({ name: "Protein", discountPct: 91 })).toMatch(/0 to 90/);
    expect(parseCombo({ name: "Duo", items: [{ productId: id(1), qty: 1 }], extraPct: 10 })).toMatch(/at least 2/);
    expect(parseCombo({ name: "Duo", items: [{ productId: id(1) }, { productId: id(1) }], extraPct: 10 })).toMatch(/at least 2/); // duplicates collapse
    expect(parseCombo({ name: "₹5000 Combo", items: [{ productId: id(1), qty: 2 }, { productId: id(2) }], extraPct: "10" })).toMatchObject({ slug: "5000-combo", extraPct: 10, items: [{ productId: id(1), qty: 2 }, { productId: id(2), qty: 1 }] });
    expect(parsePost({ title: "Hi", body: "x" })).toMatch(/title/);
    expect(parsePost({ title: "Creatine guide", body: "A long enough body for the article." })).toMatchObject({ slug: "creatine-guide", published: true });
  });
  it("settings: emails, licence numbers, delivery", () => {
    expect(parseSettings({ ...DEFAULT_SETTINGS, orderEmail: "a@b.in, c@d.in" })).toMatchObject({ orderEmail: "a@b.in, c@d.in" });
    expect(parseSettings({ ...DEFAULT_SETTINGS, orderEmail: "nope" })).toMatch(/email/);
    expect(parseSettings({ ...DEFAULT_SETTINGS, fssaiLicence: "1234" })).toMatch(/14 digits/);
    expect(parseSettings({ ...DEFAULT_SETTINGS, fssaiLicence: "1234 5678 9012 34", gstin: "09abcde1234f1z5" })).toMatchObject({ fssaiLicence: "12345678901234", gstin: "09ABCDE1234F1Z5" });
    expect(parseSettings({ ...DEFAULT_SETTINGS, shippingFee: "x" })).toMatch(/whole rupees/);
  });
});

describe("checkout input", () => {
  const ok = { name: "Aman Sharma", email: "Aman@X.in", phone: "+91 98765 43210", line1: "H-12, Sector 93", city: "Noida", state: "Uttar Pradesh", pincode: "201304" };
  it("cleans a valid buyer", () => {
    expect(parseBuyer(ok)).toMatchObject({ email: "aman@x.in", phone: "9876543210", address: { pincode: "201304", state: "Uttar Pradesh" } });
    expect(parseBuyer({ ...ok, phone: "09876543210" })).toMatchObject({ phone: "9876543210" });
  });
  it("rejects what a courier can't deliver", () => {
    expect(parseBuyer({ ...ok, pincode: "01234" })).toMatch(/PIN/);
    expect(parseBuyer({ ...ok, state: "Atlantis" })).toMatch(/state/);
    expect(parseBuyer({ ...ok, phone: "12345" })).toMatch(/mobile/);
    expect(parseBuyer({ ...ok, email: "x" })).toMatch(/email/);
  });
  it("cart lines and order numbers", () => {
    expect(parseCart([{ kind: "product", id: id(1), qty: 99 }, { kind: "evil", id: id(2) }, { kind: "combo", id: "not-a-uuid" }, null])).toEqual([{ kind: "product", id: id(1), qty: 20, flavour: undefined }]);
    expect(orderNumber()).toMatch(/^RS-[2-9A-HJKMNP-Z]{8}$/);
  });
});

describe("page titles", () => {
  it("drops the store suffix, then trims, to stay inside a Google result", async () => {
    const { fitTitle } = await import("./format");
    expect(fitTitle("Protein — 50% off", "Royal Supplements Store")).toBe("Protein — 50% off");
    expect(fitTitle("Pre-Workout Supplements: What Works and How to Stay Safe", "Royal Supplements Store")).toEqual({ absolute: "Pre-Workout Supplements: What Works and How to Stay Safe" });
    expect((fitTitle("x".repeat(90), "S") as { absolute: string }).absolute).toHaveLength(63);
  });
});
