"use client";

import { useMemo, useState } from "react";
import { Download, MessageCircle, Phone, Printer } from "lucide-react";
import type { Fulfilment, Order } from "@/lib/shop/types";
import { Card, Empty, Label, SaveBar, inr, shopPost, when, type ShopData } from "./common";

const STAGES: { id: Fulfilment; label: string; tone: string }[] = [
  { id: "new", label: "New — to pack", tone: "bg-amber-400 text-black" },
  { id: "packed", label: "Packed", tone: "bg-sky-500/20 text-sky-200" },
  { id: "shipped", label: "Shipped", tone: "bg-violet-500/20 text-violet-200" },
  { id: "delivered", label: "Delivered", tone: "bg-emerald-500/20 text-emerald-200" },
  { id: "cancelled", label: "Cancelled", tone: "bg-white/10 text-white/50" },
  { id: "refunded", label: "Refunded", tone: "bg-white/10 text-white/50" },
];
const stage = (f: Fulfilment) => STAGES.find((s) => s.id === f)!;
type Filter = "open" | "all" | "done" | "unpaid";

function addressLines(o: Order) {
  const a = o.address;
  return [a.line1, a.line2, a.landmark && `Near ${a.landmark}`, `${a.city}, ${a.state} ${a.pincode}`].filter(Boolean) as string[];
}

function printSlip(o: Order, storeName: string) {
  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) return;
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  w.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(o.number)}</title>
<style>body{font:14px system-ui;margin:32px;color:#111}h1{font-size:20px;margin:0}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left}.r{text-align:right}.box{border:2px solid #111;padding:12px;margin-top:16px;font-size:16px}</style>
<h1>${esc(storeName)} — Packing slip</h1><p>Order <b>${esc(o.number)}</b> · ${esc(when(o.paidAt ?? o.createdAt))}</p>
<div class="box"><b>Ship to</b><br>${esc(o.name)}<br>${addressLines(o).map(esc).join("<br>")}<br>Phone: ${esc(o.phone)}</div>
<table><tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th></tr>${o.items
    .map((i) => `<tr><td>${esc(i.name)}${i.flavour ? ` — ${esc(i.flavour)}` : ""}${i.contents ? `<br><small>${i.contents.map((c) => `${c.qty} × ${esc(c.name)}`).join(", ")}</small>` : ""}</td><td class="r">${i.qty}</td><td class="r">${inr(i.unitPrice * i.qty)}</td></tr>`)
    .join("")}
<tr><td colspan="2" class="r">Delivery</td><td class="r">${o.shipping ? inr(o.shipping) : "Free"}</td></tr><tr><td colspan="2" class="r"><b>Paid online</b></td><td class="r"><b>${inr(o.total)}</b></td></tr></table>
${o.note ? `<p><b>Customer note:</b> ${esc(o.note)}</p>` : ""}<script>print()</script>`);
  w.document.close();
}

function exportCsv(orders: Order[]) {
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [["Order", "Date", "Status", "Name", "Phone", "Email", "Address", "PIN", "Items", "Total", "Courier", "Tracking"]].concat(
    orders.map((o) => [o.number, o.paidAt ?? o.createdAt, o.status === "paid" ? o.fulfilment : o.status, o.name, o.phone, o.email, addressLines(o).join(", "), o.address.pincode, o.items.map((i) => `${i.qty}x ${i.name}${i.flavour ? ` (${i.flavour})` : ""}`).join("; "), String(o.total), o.courier, o.tracking]),
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([rows.map((r) => r.map(q).join(",")).join("\n")], { type: "text/csv" }));
  a.download = `store-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

export function OrdersTab({ data, done }: { data: ShopData; done: (m: string) => Promise<void> }) {
  const [filter, setFilter] = useState<Filter>("open");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.orders.filter((o) => {
      if (filter === "unpaid" ? o.status === "paid" : o.status !== "paid") return false;
      if (filter === "open" && !(o.fulfilment === "new" || o.fulfilment === "packed" || o.fulfilment === "shipped")) return false;
      if (filter === "done" && !(o.fulfilment === "delivered" || o.fulfilment === "cancelled" || o.fulfilment === "refunded")) return false;
      return !needle || [o.number, o.name, o.phone, o.email, o.address.pincode, o.tracking].some((x) => x.toLowerCase().includes(needle));
    });
  }, [data.orders, filter, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["open", "To deliver"],
            ["done", "Completed"],
            ["all", "All paid"],
            ["unpaid", "Not paid"],
          ] as [Filter, string][]
        ).map(([id, l]) => (
          <button key={id} type="button" onClick={() => setFilter(id)} className={`rounded-full px-4 py-2 text-sm ${filter === id ? "bg-white text-black" : "bg-white/5 text-white/70"}`}>
            {l}
          </button>
        ))}
        <input className="field ml-auto w-full text-sm sm:w-64" placeholder="Search name, phone, order no., PIN" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" onClick={() => exportCsv(list)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/75">
          <Download className="h-4 w-4" /> CSV
        </button>
      </div>
      {filter === "unpaid" && <p className="text-xs text-white/45">Checkouts that were started but never paid. Nothing to ship — useful for following up.</p>}

      {list.length === 0 ? (
        <Empty>{filter === "open" ? "No orders waiting. New paid orders appear here (and in your email once email is connected)." : "No orders here."}</Empty>
      ) : (
        <ul className="space-y-3">
          {list.map((o) => (
            <li key={o.id}>
              <OrderCard o={o} open={openId === o.id} toggle={() => setOpenId(openId === o.id ? null : o.id)} storeName={data.settings.storeName} done={done} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderCard({ o, open, toggle, storeName, done }: { o: Order; open: boolean; toggle: () => void; storeName: string; done: (m: string) => Promise<void> }) {
  const [f, setF] = useState({ fulfilment: o.fulfilment, courier: o.courier, tracking: o.tracking, adminNotes: o.adminNotes });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const st = o.status === "paid" ? stage(o.fulfilment) : { label: o.status === "failed" ? "Payment failed" : "Not paid", tone: "bg-red-500/15 text-red-200" };
  const count = o.items.reduce((s, i) => s + i.qty, 0);

  async function save() {
    setBusy(true);
    setErr("");
    try {
      await shopPost({ action: "order", id: o.id, ...f });
      await done(`Order ${o.number} updated`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const waText = encodeURIComponent(
    o.fulfilment === "shipped" || f.tracking
      ? `Hi ${o.name.split(" ")[0]}, your ${storeName} order ${o.number} has shipped${f.courier ? ` via ${f.courier}` : ""}${f.tracking ? `. Tracking: ${f.tracking}` : ""}.`
      : `Hi ${o.name.split(" ")[0]}, thanks for your ${storeName} order ${o.number}. We're packing it now.`,
  );

  return (
    <Card className={o.status === "paid" && o.fulfilment === "new" ? "border-amber-400/40" : ""}>
      <button type="button" onClick={toggle} className="flex w-full flex-wrap items-start gap-x-4 gap-y-1 text-left" aria-expanded={open}>
        <span className="font-mono text-sm font-bold text-amber-200">{o.number}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${st.tone}`}>{st.label}</span>
        <span className="ml-auto font-display text-lg">{inr(o.total)}</span>
        <span className="w-full text-sm text-white/75">
          {o.name} · {o.address.city} {o.address.pincode} · {count} item{count === 1 ? "" : "s"}
        </span>
        <span className="w-full text-xs text-white/40">{when(o.paidAt ?? o.createdAt)}</span>
      </button>

      {open && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Items</h3>
              <ul className="space-y-2 text-sm">
                {o.items.map((i, k) => (
                  <li key={k} className="flex justify-between gap-3">
                    <span>
                      <b>{i.qty} ×</b> {i.name}
                      {i.flavour && <span className="text-amber-200"> — {i.flavour}</span>}
                      {i.contents && <span className="block text-xs text-white/50">{i.contents.map((c) => `${c.qty} × ${c.name}`).join(", ")}</span>}
                    </span>
                    <span className="shrink-0 text-white/70">{inr(i.unitPrice * i.qty)}</span>
                  </li>
                ))}
                <li className="flex justify-between border-t border-white/10 pt-2 text-white/60">
                  <span>MRP {inr(o.listTotal)} · saved {inr(o.discountTotal)} · delivery {o.shipping ? inr(o.shipping) : "free"}</span>
                </li>
              </ul>
              {o.note && <p className="mt-3 rounded-lg bg-white/5 p-3 text-sm">Customer note: {o.note}</p>}
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Deliver to</h3>
              <address className="text-sm not-italic leading-6">
                <b>{o.name}</b>
                <br />
                {addressLines(o).map((l) => (
                  <span key={l}>
                    {l}
                    <br />
                  </span>
                ))}
                {o.email}
              </address>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={`tel:+91${o.phone}`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm">
                  <Phone className="h-4 w-4" /> {o.phone}
                </a>
                <a href={`https://wa.me/91${o.phone}?text=${waText}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-200">
                  <MessageCircle className="h-4 w-4" /> WhatsApp update
                </a>
                <button type="button" onClick={() => printSlip(o, storeName)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm">
                  <Printer className="h-4 w-4" /> Packing slip
                </button>
              </div>
              {o.razorpayPaymentId && <p className="mt-3 text-xs text-white/40">Razorpay payment {o.razorpayPaymentId}</p>}
            </div>
          </div>

          {o.status === "paid" && (
            <>
              <div className="mt-5 flex flex-wrap gap-2">
                {STAGES.map((s) => (
                  <button key={s.id} type="button" onClick={() => setF({ ...f, fulfilment: s.id })} className={`rounded-full px-3 py-1.5 text-xs font-bold ${f.fulfilment === s.id ? s.tone + " ring-2 ring-white/40" : "bg-white/5 text-white/55"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Label label="Courier">
                  <input className="field text-sm" value={f.courier} placeholder="Delhivery, Blue Dart, India Post…" onChange={(e) => setF({ ...f, courier: e.target.value })} />
                </Label>
                <Label label="Tracking number">
                  <input className="field text-sm" value={f.tracking} onChange={(e) => setF({ ...f, tracking: e.target.value })} />
                </Label>
                <Label label="Private notes (customer can't see)" wide>
                  <textarea className="field text-sm" rows={2} value={f.adminNotes} onChange={(e) => setF({ ...f, adminNotes: e.target.value })} />
                </Label>
              </div>
              <p className="mt-2 text-xs text-white/40">The customer sees the status, courier and tracking number under My orders.</p>
              {err && <p className="mt-2 text-sm text-red-300">{err}</p>}
              <SaveBar busy={busy} onSave={save} saveLabel="Save order" />
            </>
          )}
        </div>
      )}
    </Card>
  );
}
