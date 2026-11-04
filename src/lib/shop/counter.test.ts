import { describe, expect, it } from "vitest";
import { billText, priceBill, unitsByProduct, type BillProduct } from "./counter";

const products = new Map<string, BillProduct>([
  ["whey", { id: "whey", name: "ISO Whey 2 kg", listPrice: 8999, salePrice: 4500 }],
  ["eaa", { id: "eaa", name: "EAA 300 g", listPrice: 2999, salePrice: 1500 }],
]);

describe("counter bills", () => {
  it("prices from the catalogue and totals MRP, selling price and the bill discount", () => {
    const b = priceBill([{ productId: "whey", qty: 1, code: "8901030875021", variant: "Chocolate" }, { productId: "eaa", qty: 2 }], products, 100);
    expect(b).toEqual({
      items: [
        { productId: "whey", name: "ISO Whey 2 kg", variant: "Chocolate", code: "8901030875021", qty: 1, mrp: 8999, unitPrice: 4500 },
        { productId: "eaa", name: "EAA 300 g", variant: "", code: "", qty: 2, mrp: 2999, unitPrice: 1500 },
      ],
      mrpTotal: 14997,
      subtotal: 7500,
      billDiscount: 100,
      total: 7400,
    });
  });

  it("lets the cashier change a price, but never above MRP or below ₹1", () => {
    expect(priceBill([{ productId: "eaa", qty: 1, unitPrice: 2999 }], products)).toMatchObject({ total: 2999 });
    expect(priceBill([{ productId: "eaa", qty: 1, unitPrice: 1200 }], products)).toMatchObject({ total: 1200 });
    expect(priceBill([{ productId: "eaa", qty: 1, unitPrice: 3000 }], products)).toMatch(/above its MRP of ₹2,999/);
    expect(priceBill([{ productId: "eaa", qty: 1, unitPrice: 0 }], products)).toMatch(/at least ₹1/);
    expect(priceBill([{ productId: "eaa", qty: 1, unitPrice: 12.5 }], products)).toMatch(/at least ₹1/);
  });

  it("refuses empty bills, unknown items, odd quantities and oversized discounts", () => {
    expect(priceBill([], products)).toMatch(/at least one/);
    expect(priceBill([{ productId: "gone", qty: 1 }], products)).toMatch(/no longer in the store/);
    expect(priceBill([{ productId: "eaa", qty: 0 }], products)).toMatch(/1 to 100/);
    expect(priceBill([{ productId: "eaa", qty: 1.5 }], products)).toMatch(/1 to 100/);
    expect(priceBill([{ productId: "eaa", qty: 1 }], products, 1501)).toMatch(/more than the bill/);
    expect(priceBill([{ productId: "eaa", qty: 1 }], products, -5)).toMatch(/whole number/);
    expect(priceBill(Array.from({ length: 101 }, () => ({ productId: "eaa", qty: 1 })), products)).toMatch(/at most 100/);
  });

  it("adds up units of the same product across lines", () => {
    expect([...unitsByProduct([{ productId: "eaa", qty: 2 }, { productId: "whey", qty: 1 }, { productId: "eaa", qty: 1 }])]).toEqual([["eaa", 3], ["whey", 1]]);
  });

  it("writes a plain bill for WhatsApp with the saving on MRP", () => {
    const b = priceBill([{ productId: "eaa", qty: 2 }], products, 0);
    if (typeof b === "string") throw new Error(b);
    const text = billText({ ...b, number: "RB-000007", createdAt: "2026-10-30T12:00:00Z", payment: "upi" }, "Royal Supplements Store");
    expect(text).toContain("Bill RB-000007 · 30 Oct 2026");
    expect(text).toContain("2 × EAA 300 g @ ₹1,500 = ₹3,000");
    expect(text).toContain("Total paid (UPI): ₹3,000");
    expect(text).toContain("You saved ₹2,998 on MRP");
  });
});
