import Link from "next/link";
import { Dumbbell, HeartPulse, MessageCircle, Salad, ShoppingBag } from "lucide-react";

// Shown on /shop and /store while the store is switched off in Admin → Supplements store → Settings.
// `standalone` is for /shop, which has no gym header above it.
export function StoreComingSoon({ whatsapp, standalone = false }: { whatsapp: string; standalone?: boolean }) {
  return (
    <section className={`relative overflow-hidden px-4 pb-20 sm:px-6 ${standalone ? "pt-16 sm:pt-24" : "pt-36 sm:pt-44"}`}>
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] max-w-[200vw] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="relative mx-auto max-w-2xl text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-600 text-black shadow-lg">
          <ShoppingBag className="h-7 w-7" aria-hidden />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-amber-300">Royal Supplements Store</p>
        <h1 className="font-display mt-3 text-4xl leading-tight text-white sm:text-5xl">
          Coming soon <span className="block text-amber-300">Jald aa raha hai</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-white/70">
          We&apos;re still setting up our supplement store, so you can&apos;t order online yet. Need advice on protein or creatine before then? Ask our coach on WhatsApp — it&apos;s free.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-brand inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-bold">
            <MessageCircle className="h-5 w-5" aria-hidden /> Ask a coach on WhatsApp
          </a>
          <Link href="/" className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 font-semibold text-white hover:border-amber-300 hover:text-amber-200">
            Back to Royal Fitness Club
          </Link>
        </div>
        <ul className="mt-12 grid gap-3 text-left sm:grid-cols-3">
          {[
            { href: "/membership", label: "Gym membership", icon: Dumbbell },
            { href: "/diet-plans", label: "Indian diet plans", icon: Salad },
            { href: "/health", label: "Free health guides", icon: HeartPulse },
          ].map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href} className="glass brand-border flex items-center gap-3 rounded-2xl p-4 text-sm font-semibold text-white hover:text-amber-200">
                <Icon className="h-5 w-5 shrink-0 text-amber-300" aria-hidden /> {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
