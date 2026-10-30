import "server-only";
import { pool } from "@/health/db";
import { loadCatalog } from "./store";
import { priceBill, unitsByProduct, type BillItem, type BillLineInput, type Payment } from "./counter";

// Royal Supplements: bills for counter sales. Saving a bill and taking its items out of stock happen
// in one transaction, so a bill never exists without its stock change (or the other way round).

export type CounterSale = {
  id: string;
  number: string;
  createdAt: string;
  items: BillItem[];
  mrpTotal: number;
  subtotal: number;
  billDiscount: number;
  total: number;
  payment: Payment;
  customerName: string;
  customerPhone: string;
  note: string;
  status: "paid" | "cancelled";
  cancelledAt: string | null;
  cancelReason: string;
};

type Row = {
  id: string; number: string; created_at: Date; items: BillItem[]; mrp_total: number; subtotal: number; bill_discount: number; total: number; payment: Payment;
  customer_name: string; customer_phone: string; note: string; status: "paid" | "cancelled"; cancelled_at: Date | null; cancel_reason: string;
};
const saleFrom = (r: Row): CounterSale => ({
  id: r.id, number: r.number, createdAt: r.created_at.toISOString(), items: r.items, mrpTotal: r.mrp_total, subtotal: r.subtotal, billDiscount: r.bill_discount, total: r.total,
  payment: r.payment, customerName: r.customer_name, customerPhone: r.customer_phone, note: r.note, status: r.status, cancelledAt: r.cancelled_at?.toISOString() ?? null, cancelReason: r.cancel_reason,
});

export type NewSale = { lines: BillLineInput[]; billDiscount: number; payment: Payment; customerName: string; customerPhone: string; note: string; madeBy: string };

/**
 * Prices the bill from the catalogue, checks every product has the units in stock, saves the bill
 * and takes the units out of stock. Returns a message (and changes nothing) when it can't.
 */
export async function createCounterSale(s: NewSale): Promise<CounterSale | string> {
  const cat = await loadCatalog(false);
  const bill = priceBill(s.lines, cat.productById, s.billDiscount);
  if (typeof bill === "string") return bill;
  const client = await pool.connect();
  try {
    await client.query("begin");
    const need = unitsByProduct(bill.items);
    // Lock and check every product first, so a refused bill doesn't use up a bill number.
    for (const [id, qty] of need) {
      const { rows } = await client.query<{ name: string; stock: number }>(`select name, stock from public.shop_products where id = $1 for update`, [id]);
      if (!rows[0]) {
        await client.query("rollback");
        return "One of the items is no longer in the store.";
      }
      if (rows[0].stock < qty) {
        await client.query("rollback");
        return `Only ${rows[0].stock} of ${rows[0].name} in stock. Fix the stock first (Scan a product → New stock arrived) if the shelf has more.`;
      }
    }
    const { rows: no } = await client.query<{ n: string }>(`select nextval('public.shop_counter_sale_no')::text as n`);
    const number = `RB-${no[0].n.padStart(6, "0")}`;
    await client.query(`select set_config('shop.stock_reason', 'sold', true), set_config('shop.stock_note', $1, true)`, [`Bill ${number}`]);
    for (const [id, qty] of need) await client.query(`update public.shop_products set stock = stock - $2, updated_at = now() where id = $1`, [id, qty]);
    const { rows } = await client.query<Row>(
      `insert into public.shop_counter_sales (number, items, mrp_total, subtotal, bill_discount, total, payment, customer_name, customer_phone, note, made_by)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning *`,
      [number, JSON.stringify(bill.items), bill.mrpTotal, bill.subtotal, bill.billDiscount, bill.total, s.payment, s.customerName.trim().slice(0, 80), s.customerPhone, s.note.trim().slice(0, 300), s.madeBy.slice(0, 120)],
    );
    await client.query("commit");
    return saleFrom(rows[0]);
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** Cancels a bill (a return or a mistake): its items go back into stock. The bill itself is kept. */
export async function cancelCounterSale(id: string, reason: string): Promise<CounterSale | string> {
  if (!reason.trim()) return "Write why the bill is cancelled.";
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query<Row>(`select * from public.shop_counter_sales where id = $1 for update`, [id]);
    const sale = rows[0];
    if (!sale) {
      await client.query("rollback");
      return "Bill not found.";
    }
    if (sale.status === "cancelled") {
      await client.query("rollback");
      return `Bill ${sale.number} is already cancelled.`;
    }
    await client.query(`select set_config('shop.stock_reason', 'returned', true), set_config('shop.stock_note', $1, true)`, [`Bill ${sale.number} cancelled: ${reason.trim()}`.slice(0, 300)]);
    // A product deleted since the sale has nothing to put back into.
    for (const [pid, qty] of unitsByProduct(sale.items)) await client.query(`update public.shop_products set stock = stock + $2, updated_at = now() where id = $1`, [pid, qty]);
    const { rows: up } = await client.query<Row>(`update public.shop_counter_sales set status = 'cancelled', cancelled_at = now(), cancel_reason = $2 where id = $1 returning *`, [id, reason.trim().slice(0, 300)]);
    await client.query("commit");
    return saleFrom(up[0]);
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function listCounterSales(limit = 50): Promise<CounterSale[]> {
  const { rows } = await pool.query<Row>(`select * from public.shop_counter_sales order by created_at desc limit $1`, [Math.max(1, Math.min(500, limit))]);
  return rows.map(saleFrom);
}
