"use client";

import { useMemo, useState } from "react";
import { Loader2, MessageCircle, Minus, Plus, Printer, Receipt, Trash2, X } from "lucide-react";
import { PAYMENTS, billText, priceBill, type BillProduct, type Payment } from "@/lib/shop/counter";
import { todayIST } from "@/lib/growth/dates";
import { Card, Label, inr, shopPost, when, type CounterSale, type ShopData } from "./common";

type Done = (m: string) => Promise<void>;
/** One line in the cart. `unitPrice` "" = the product's sale price. */
export type CartLine = { key: string; productId: string; variant: string; code: string; qty: number; unitPrice: number | "" };
export const CART_KEY = "rfc-shop-cart";
export const lineKey = (productId: string, variant: string) => `${productId}|${variant}`;

/** Adds one unit of a product (scanned or picked by name) to the cart. */
export function addToCart(cart: CartLine[], productId: string, variant = "", code = ""): CartLine[] {
  const key = lineKey(productId, variant);
  const at = cart.findIndex((l) => l.key === key);
  if (at >= 0) return cart.map((l, i) => (i === at ? { ...l, qty: Math.min(100, l.qty + 1) } : l));
  return [...cart, { key, productId, variant, code, qty: 1, unitPrice: "" }];
}

export function SalePanel({ data, cart, setCart, done }: { data: ShopData; cart: CartLine[]; setCart: (f: (c: CartLine[]) => CartLine[]) => void; done: Done }) {
  const [payment, setPayment] = useState<Payment>("cash");
  const [discount, setDiscount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [bill, setBill] = useState<CounterSale | null>(null);

  const products = useMemo(() => new Map<string, BillProduct & { stock: number }>(data.products.map((p) => [p.id, { id: p.id, name: p.name, listPrice: p.listPrice, salePrice: p.salePrice, stock: p.stock }])), [data.products]);
  const priced = priceBill(
    cart.map((l) => ({ productId: l.productId, qty: l.qty, unitPrice: l.unitPrice === "" ? null : l.unitPrice, variant: l.variant, code: l.code })),
    products,
    Number(discount) || 0,
  );
  const update = (key: string, patch: Partial<CartLine>) => setCart((c) => c.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  async function makeBill() {
    if (typeof priced === "string") return setErr(priced);
    setBusy(true);
    setErr("");
    try {
      const r = await shopPost<{ sale: CounterSale }>({
        action: "sale",
        lines: cart.map((l) => ({ productId: l.productId, qty: l.qty, unitPrice: l.unitPrice, variant: l.variant, code: l.code })),
        billDiscount: Number(discount) || 0,
        payment,
        customerName,
        customerPhone,
        note,
      });
      setBill(r.sale);
      setCart(() => []);
      setDiscount("");
      setCustomerName("");
      setCustomerPhone("");
      setNote("");
      await done(`Bill ${r.sale.number} made: ${inr(r.sale.total)}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (bill) return <BillView sale={bill} data={data} close={() => setBill(null)} />;

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="flex items-center gap-2 font-display text-lg">
          <Receipt className="h-5 w-5 text-amber-300" /> Counter sale
        </h2>
        {cart.length === 0 ? (
          <p className="mt-3 text-sm text-white/55">Scan each item the customer is buying, or search by name above. Scanning the same pack again adds one more.</p>
        ) : (
          <ul className="mt-3 divide-y divide-white/5">
            {cart.map((l) => {
              const p = products.get(l.productId);
              if (!p) return null;
              const short = p.stock < cart.filter((x) => x.productId === l.productId).reduce((s, x) => s + x.qty, 0);
              return (
                <li key={l.key} className="py-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug">{p.name}</p>
                      <p className="text-xs text-white/50">
                        {l.variant && `${l.variant} · `}MRP {inr(p.listPrice)} · {p.stock} in stock
                      </p>
                      {short && <p className="mt-0.5 text-xs font-semibold text-red-300">More than the stock says. Fix the stock first if the shelf has more.</p>}
                    </div>
                    <button type="button" onClick={() => setCart((c) => c.filter((x) => x.key !== l.key))} className="rounded-lg p-1.5 text-white/50 hover:text-red-200" aria-label={`Remove ${p.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="flex">
                      <button type="button" onClick={() => update(l.key, { qty: Math.max(1, l.qty - 1) })} className="rounded-l-lg border border-white/15 px-2" aria-label={`One less ${p.name}`}>
                        <Minus className="h-4 w-4" />
                      </button>
                      <input className="field w-14 rounded-none py-1.5 text-center" inputMode="numeric" value={l.qty} onChange={(e) => update(l.key, { qty: Math.min(100, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)) })} aria-label={`Quantity ${p.name}`} />
                      <button type="button" onClick={() => update(l.key, { qty: Math.min(100, l.qty + 1) })} className="rounded-r-lg border border-white/15 px-2" aria-label={`One more ${p.name}`}>
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="text-xs text-white/45">×</span>
                    <label className="flex items-center gap-1 text-sm">
                      <span className="text-white/50">₹</span>
                      <input
                        className="field w-24 py-1.5"
                        inputMode="numeric"
                        placeholder={String(p.salePrice)}
                        value={l.unitPrice}
                        onChange={(e) => update(l.key, { unitPrice: e.target.value === "" ? "" : Number(e.target.value.replace(/\D/g, "")) })}
                        aria-label={`Price each ${p.name}`}
                      />
                    </label>
                    <b className="ml-auto text-sm text-amber-200">{inr((l.unitPrice === "" ? p.salePrice : l.unitPrice) * l.qty)}</b>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {cart.length > 0 && (
        <Card>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/55">Paid by</span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Paid by">
                {PAYMENTS.map((p) => (
                  <button key={p.id} type="button" role="radio" aria-checked={payment === p.id} onClick={() => setPayment(p.id)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${payment === p.id ? "bg-amber-400 text-black" : "border border-white/15 text-white/75"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <Label label="Extra discount on the bill (₹)">
              <input className="field" inputMode="numeric" value={discount} onChange={(e) => setDiscount(e.target.value.replace(/\D/g, ""))} placeholder="0" />
            </Label>
            <Label label="Customer mobile (optional)">
              <input className="field" inputMode="tel" value={customerPhone} maxLength={14} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="98765 43210" />
            </Label>
            <Label label="Customer name (optional)">
              <input className="field" value={customerName} maxLength={80} onChange={(e) => setCustomerName(e.target.value)} />
            </Label>
            <Label label="Note (optional)">
              <input className="field" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="UPI ref, member, etc." />
            </Label>
          </div>
          {typeof priced !== "string" && (
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between text-white/55">
                <dt>MRP total</dt>
                <dd>{inr(priced.mrpTotal)}</dd>
              </div>
              {priced.billDiscount > 0 && (
                <div className="flex justify-between text-white/55">
                  <dt>Extra discount</dt>
                  <dd>−{inr(priced.billDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-lg">
                <dt className="font-semibold">To collect</dt>
                <dd className="font-display text-2xl text-amber-200">{inr(priced.total)}</dd>
              </div>
              {priced.mrpTotal > priced.total && <p className="text-right text-xs text-emerald-300">Customer saves {inr(priced.mrpTotal - priced.total)} on MRP</p>}
            </dl>
          )}
          {(err || typeof priced === "string") && <p className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm text-red-100">{err || (priced as string)}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={busy || typeof priced === "string"} onClick={makeBill} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-black disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Make bill & take out of stock
            </button>
            <button type="button" onClick={() => confirm("Empty this cart?") && setCart(() => [])} className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white/70">
              Empty cart
            </button>
          </div>
          <p className="mt-2 text-xs text-white/40">This records the sale only. Collect the money in cash, UPI or card as usual; no online payment is taken here.</p>
        </Card>
      )}

      <TodaySales data={data} done={done} open={setBill} />
    </div>
  );
}

function TodaySales({ data, done, open }: { data: ShopData; done: Done; open: (s: CounterSale) => void }) {
  const [busy, setBusy] = useState("");
  const today = todayIST();
  const sales = data.counterSales.filter((s) => todayIST(new Date(s.createdAt)) === today);
  const paid = sales.filter((s) => s.status === "paid");
  const byPay = PAYMENTS.map((p) => ({ ...p, total: paid.filter((s) => s.payment === p.id).reduce((t, s) => t + s.total, 0) })).filter((p) => p.total > 0);
  const older = data.counterSales.filter((s) => !sales.includes(s)).slice(0, 20);

  async function cancel(s: CounterSale) {
    const reason = prompt(`Cancel bill ${s.number} (${inr(s.total)})? Its items go back into stock.\n\nWhy? (e.g. customer returned it, billed by mistake)`);
    if (!reason?.trim()) return;
    setBusy(s.id);
    try {
      await shopPost({ action: "cancel-sale", id: s.id, reason });
      await done(`Bill ${s.number} cancelled, stock put back`);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  const row = (s: CounterSale) => (
    <li key={s.id} className="flex items-center gap-3 py-2 text-sm">
      <button type="button" onClick={() => open(s)} className="min-w-0 flex-1 text-left">
        <span className={`font-mono ${s.status === "cancelled" ? "text-white/40 line-through" : ""}`}>{s.number}</span>
        <span className="ml-2 text-white/50">
          {s.items.reduce((n, i) => n + i.qty, 0)} item(s) · {PAYMENTS.find((p) => p.id === s.payment)?.label} · {when(s.createdAt)}
        </span>
        {s.status === "cancelled" && <span className="block text-xs text-red-200/80">Cancelled: {s.cancelReason}</span>}
      </button>
      <b className={s.status === "cancelled" ? "text-white/40 line-through" : "text-amber-200"}>{inr(s.total)}</b>
      {s.status === "paid" && (
        <button type="button" disabled={busy === s.id} onClick={() => cancel(s)} className="rounded-lg border border-white/15 p-1.5 text-white/55 hover:text-red-200" aria-label={`Cancel bill ${s.number}`} title="Cancel bill (owner/manager)">
          {busy === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        </button>
      )}
    </li>
  );

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg">Today at the counter</h3>
        <p className="text-sm text-white/60">
          {paid.length} bill(s) · <b className="text-amber-200">{inr(paid.reduce((t, s) => t + s.total, 0))}</b>
          {byPay.length > 0 && <span className="text-white/45"> ({byPay.map((p) => `${p.label} ${inr(p.total)}`).join(", ")})</span>}
        </p>
      </div>
      {sales.length === 0 ? <p className="mt-2 text-sm text-white/45">No bills yet today.</p> : <ul className="mt-2 divide-y divide-white/5">{sales.map(row)}</ul>}
      {older.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-white/55">Earlier bills</summary>
          <ul className="mt-2 divide-y divide-white/5">{older.map(row)}</ul>
        </details>
      )}
    </Card>
  );
}

const PAPER_KEY = "rfc-bill-paper";
type Paper = "58" | "80" | "a4";

/** The bill on screen, ready to print on a thermal printer or A4, or to send on WhatsApp by hand. */
export function BillView({ sale, data, close }: { sale: CounterSale; data: ShopData; close: () => void }) {
  const [paper, setPaperState] = useState<Paper>(() => {
    try {
      const v = localStorage.getItem(PAPER_KEY);
      return v === "58" || v === "a4" ? v : "80";
    } catch {
      return "80";
    }
  });
  const setPaper = (p: Paper) => {
    setPaperState(p);
    try {
      localStorage.setItem(PAPER_KEY, p);
    } catch {}
  };
  const s = data.settings;
  const saved = sale.mrpTotal - sale.total;
  const text = billText(sale, s.storeName);
  const wa = sale.customerPhone ? `https://wa.me/91${sale.customerPhone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
  const width = paper === "58" ? "54mm" : paper === "80" ? "76mm" : "180mm";

  return (
    <div className="space-y-4">
      <style>{`@media print {
  @page { size: ${paper === "a4" ? "A4" : `${paper}mm auto`}; margin: ${paper === "a4" ? "12mm" : "2mm"}; }
  body * { visibility: hidden !important; }
  .print-bill, .print-bill * { visibility: visible !important; }
  .print-bill { position: absolute; left: 0; top: 0; width: ${width}; box-shadow: none !important; }
}`}</style>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-black">
          <Printer className="h-4 w-4" /> Print
        </button>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/50 px-4 py-2.5 text-sm font-semibold text-emerald-200">
          <MessageCircle className="h-4 w-4" /> Send on WhatsApp
        </a>
        <select className="field w-auto py-2 text-sm" value={paper} onChange={(e) => setPaper(e.target.value as Paper)} aria-label="Paper size">
          <option value="58">58 mm roll</option>
          <option value="80">80 mm roll</option>
          <option value="a4">A4 page</option>
        </select>
        <button type="button" onClick={close} className="ml-auto rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/75">
          New sale
        </button>
      </div>

      <div className="print-bill mx-auto rounded-lg bg-white p-4 font-mono text-[12px] leading-snug text-black shadow-xl" style={{ width, maxWidth: "100%" }}>
        <p className="text-center text-sm font-bold">{s.storeName}</p>
        {s.sellerName && <p className="text-center">{s.sellerName}</p>}
        <p className="text-center">{s.address}</p>
        {s.phone && <p className="text-center">Ph: {s.phone}</p>}
        {s.gstin ? <p className="text-center">GSTIN: {s.gstin}</p> : null}
        {s.fssaiLicence && <p className="text-center">FSSAI: {s.fssaiLicence}</p>}
        <p className="mt-2 border-y border-dashed border-black py-1 text-center font-bold">{s.gstin ? "BILL" : "CASH MEMO"}</p>
        <div className="mt-1 flex justify-between">
          <span>{sale.number}</span>
          <span>{new Date(sale.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        {(sale.customerName || sale.customerPhone) && <p>Customer: {[sale.customerName, sale.customerPhone].filter(Boolean).join(" · ")}</p>}
        <table className="mt-2 w-full border-t border-dashed border-black">
          <thead>
            <tr>
              <th className="pt-1 text-left font-bold">Item</th>
              <th className="pt-1 pl-2 text-right font-bold">Qty</th>
              <th className="pt-1 pl-2 text-right font-bold">Amt</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((i, k) => (
              <tr key={k} className="align-top">
                <td className="py-0.5 pr-1">
                  {i.name}
                  {i.variant && ` (${i.variant})`}
                  <br />
                  <span className="text-[11px]">
                    MRP ₹{i.mrp.toLocaleString("en-IN")} · @ ₹{i.unitPrice.toLocaleString("en-IN")}
                  </span>
                </td>
                <td className="py-0.5 pl-2 text-right">{i.qty}</td>
                <td className="py-0.5 pl-2 text-right">{(i.unitPrice * i.qty).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-1 border-t border-dashed border-black pt-1">
          <div className="flex justify-between">
            <span>MRP total</span>
            <span>₹{sale.mrpTotal.toLocaleString("en-IN")}</span>
          </div>
          {sale.billDiscount > 0 && (
            <div className="flex justify-between">
              <span>Extra discount</span>
              <span>−₹{sale.billDiscount.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold">
            <span>TOTAL</span>
            <span>₹{sale.total.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid by</span>
            <span>{PAYMENTS.find((p) => p.id === sale.payment)?.label}</span>
          </div>
          {saved > 0 && <p className="mt-1 text-center font-bold">You saved ₹{saved.toLocaleString("en-IN")} on MRP</p>}
          {sale.status === "cancelled" && <p className="mt-1 text-center font-bold">CANCELLED: {sale.cancelReason}</p>}
        </div>
        <p className="mt-2 text-center text-[11px]">{s.returnPolicy}</p>
        <p className="mt-2 text-center">Thank you!</p>
      </div>
    </div>
  );
}
