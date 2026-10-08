import { Check, Phone } from "lucide-react";
import { formatINR, telHref, whatsappHref } from "@/lib/site";
import type { Business } from "@/lib/content/types";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";

/** Personal training with the head coach. Booked over WhatsApp or a call (not sold online). */
export const PT_PLANS = [
  {
    id: "pt-monthly",
    name: "PT Monthly",
    price: 12000,
    unit: "/ month",
    perks: ["Mon–Sat 1:1 training with head coach Aman Sharma", "Customised workout and diet plan"],
  },
  {
    id: "pt-transformation",
    name: "PT Transformation",
    price: 15000,
    unit: "/ month × 3 months",
    perks: ["Everything in PT Monthly", "Personal target set to your goal", "Weekly full-body stretching session"],
  },
] as const;

export function PersonalTraining({ business }: { business: Business }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {PT_PLANS.map((p) => (
        <article key={p.id} className="glass brand-border flex flex-col rounded-3xl p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-soft">Personal training</p>
          <h3 className="font-display mt-1 text-2xl text-white">{p.name}</h3>
          <p className="mt-4">
            <span className="font-display text-4xl text-brand-gradient">{formatINR(p.price)}</span>
            <span className="ml-1 text-sm text-white/55">{p.unit}</span>
          </p>
          <ul className="mt-5 flex-1 space-y-2 text-sm text-white/80">
            {p.perks.map((perk) => (
              <li key={perk} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                {perk}
              </li>
            ))}
          </ul>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <a href={whatsappHref(business, `Hi ${business.name}, I'd like to know about ${p.name} personal training.`)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-full bg-[#25d366] py-3 text-sm font-bold text-white">
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp
            </a>
            <a href={telHref(business.phone)} className="flex items-center justify-center gap-2 rounded-full border border-white/20 py-3 text-sm font-bold text-white">
              <Phone className="h-4 w-4" /> Call
            </a>
          </div>
        </article>
      ))}
      <p className="text-center text-sm text-white/55 md:col-span-2">Pehla session free. Book your trial on WhatsApp or call {business.phone}.</p>
    </div>
  );
}
