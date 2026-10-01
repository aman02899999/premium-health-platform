import Image from "next/image";
import { coverSrc } from "@/lib/library/catalog";
import type { Bundle } from "@/lib/library/bundles";
import { AddToCart } from "./AddToCart";

/** A combo / section bundle with a fanned cover stack and its genuine saving. */
export function BundleCard({ bundle }: { bundle: Bundle }) {
  const save = Math.round((1 - bundle.price / bundle.listPrice) * 100);
  const fan = bundle.volumes.slice(0, 4);
  return (
    <article className="glass flex h-full flex-col overflow-hidden rounded-3xl p-5">
      <div className="relative mx-auto h-40 w-full max-w-[240px]" aria-hidden>
        {fan.map((v, i) => (
          <div
            key={v}
            className="absolute top-2 w-[92px] overflow-hidden rounded-md shadow-xl ring-1 ring-white/10"
            style={{ left: `calc(${i / Math.max(fan.length - 1, 1)} * (100% - 92px))`, transform: `rotate(${(i - (fan.length - 1) / 2) * 6}deg)`, zIndex: i }}
          >
            <Image src={coverSrc(v)} alt="" width={92} height={138} />
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-brand">{bundle.volumes.length} books · save {save}%</p>
      <h3 className="font-display mt-1 text-xl leading-snug text-white">{bundle.name}</h3>
      <p className="mt-1 text-sm italic text-white/65">{bundle.tagline}</p>
      <p className="mt-3 flex-1 text-sm text-white/60">{bundle.forWho}</p>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-display text-2xl text-white">₹{bundle.price.toLocaleString("en-IN")}</span>
        <span className="text-sm text-white/40 line-through">₹{bundle.listPrice.toLocaleString("en-IN")}</span>
        <span className="text-xs text-white/45">if bought singly</span>
      </div>
      <div className="mt-4">
        <AddToCart id={bundle.id} buyLabel="Buy bundle" stacked />
      </div>
    </article>
  );
}
