"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, Upload } from "lucide-react";

type BookStatus = { volume: number; slug: string; title: string; uploaded: boolean };
type BookOrder = {
  id: string;
  createdAt: string;
  status: "created" | "paid" | "failed";
  title: string;
  amountPaise: number;
  name: string;
  email: string;
  phone: string;
  accessToken: string;
  razorpayPaymentId: string | null;
};
type Data = { razorpay: boolean; signing: boolean; storageError?: string; books: BookStatus[]; orders: BookOrder[]; ordersError?: string };

/** Upload the book PDFs to the private bucket and see library sales. */
export function LibraryAdmin() {
  const [data, setData] = useState<Data | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number; errors: string[] } | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/library")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);
  useEffect(load, [load]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    const errors: string[] = [];
    setProgress({ done: 0, total: list.length, errors });
    for (let i = 0; i < list.length; i++) {
      const body = new FormData();
      body.append("file", list[i]);
      const res = await fetch("/api/admin/library", { method: "POST", body });
      if (!res.ok) errors.push(`${list[i].name}: ${(await res.json().catch(() => ({}))).error || res.status}`);
      setProgress({ done: i + 1, total: list.length, errors: [...errors] });
    }
    load();
  }

  if (!data) return <Loader2 className="h-6 w-6 animate-spin text-brand" />;
  const uploaded = data.books.filter((b) => b.uploaded).length;
  const paid = data.orders.filter((o) => o.status === "paid");
  const total = paid.reduce((s, o) => s + o.amountPaise, 0) / 100;
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-coal p-5 ring-1 ring-white/10 sm:p-6">
        <h2 className="font-display text-xl text-white">Book PDFs</h2>
        <p className="mt-1 text-sm text-white/50">
          Select all the PDFs at once (e.g. 01-foundations-of-strength.pdf … 60-strong-at-sixty.pdf). They go to a private bucket — buyers only ever get 60-second download links.
        </p>
        {!data.razorpay && <p className="mt-4 rounded-xl bg-yellow-500/15 p-3 text-sm text-yellow-100">Online payment is off until the Razorpay keys are added in Vercel. The library shows a WhatsApp button meanwhile.</p>}
        {!data.signing && <p className="mt-4 rounded-xl bg-yellow-500/15 p-3 text-sm text-yellow-100">Downloads need SUPABASE_SERVICE_ROLE_KEY on this deployment (the Supabase integration sets it for Production).</p>}
        {data.storageError && <p className="mt-4 rounded-xl bg-red-500/15 p-3 text-sm text-red-200">Storage: {data.storageError}</p>}
        <label className="btn-brand mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 font-bold">
          <Upload className="h-4 w-4" /> Upload PDFs
          <input type="file" accept="application/pdf" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
        </label>
        <span className="ml-3 text-sm text-white/60">{uploaded} / {data.books.length} uploaded</span>
        {progress && (
          <div className="mt-4 text-sm text-white/70">
            {progress.done < progress.total ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : null}
            Uploaded {progress.done} of {progress.total}
            {progress.errors.map((e) => (
              <p key={e} className="text-red-300">{e}</p>
            ))}
          </div>
        )}
        <ul className="mt-5 grid gap-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {data.books.map((b) => (
            <li key={b.slug} className="flex items-center gap-2 text-white/70">
              {b.uploaded ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <Circle className="h-4 w-4 shrink-0 text-white/25" />}
              <span className="truncate">{b.volume}. {b.title}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-coal p-5 ring-1 ring-white/10 sm:p-6">
        <h2 className="font-display text-xl text-white">Library sales</h2>
        <p className="mt-1 text-sm text-white/50">{paid.length} paid orders · ₹{total.toLocaleString("en-IN")} total. Use the WhatsApp link to resend a buyer their download page.</p>
        {data.ordersError && <p className="mt-4 rounded-xl bg-red-500/15 p-3 text-sm text-red-200">{data.ordersError}</p>}
        {paid.length === 0 ? (
          <p className="mt-4 text-white/55">No sales yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-white/45">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Buyer</th>
                  <th className="p-2">Item</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Resend</th>
                </tr>
              </thead>
              <tbody>
                {paid.map((o) => (
                  <tr key={o.id} className="border-t border-white/10 align-top">
                    <td className="whitespace-nowrap p-2 text-white/60">{new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="p-2">
                      <span className="font-semibold text-white">{o.name}</span>
                      <span className="block text-xs text-white/55">{o.email}</span>
                    </td>
                    <td className="p-2 text-white/75">{o.title}</td>
                    <td className="whitespace-nowrap p-2 font-semibold text-white">₹{(o.amountPaise / 100).toLocaleString("en-IN")}</td>
                    <td className="p-2">
                      <a
                        className="text-brand underline"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://wa.me/91${o.phone}?text=${encodeURIComponent(`Hi ${o.name}, here is your Premium Library download page: ${origin}/library/access/${o.accessToken}`)}`}
                      >
                        WhatsApp link
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
