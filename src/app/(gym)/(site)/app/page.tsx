import type { Metadata } from "next";
import Link from "next/link";
import { Apple, BookOpen, Download, Dumbbell, FileHeart, Salad, ShieldCheck, Smartphone, Timer, Trophy, UserRound } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { apkPublished } from "@/lib/app-download";
import { BOOKS } from "@/lib/library/catalog";
import { PageHero } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";
import { InstallApp } from "@/components/app/InstallApp";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Download the Royal Fitness App — Android & iPhone",
    description: `Get the ${c.business.name} app on your phone: workout planner, food log, progress check-ins, your diet and workout plans and the ${BOOKS.length}-book library. Free sign-up with Google or email.`,
    path: "/app",
  });
}

const FEATURES = [
  { icon: Dumbbell, title: "Workout planner", text: "Build a weekly plan and keep it on every device.", href: "/workout-planner" },
  { icon: Salad, title: "Food log", text: "Log Indian meals and see your protein and calories.", href: "/nutrition" },
  { icon: Trophy, title: "Progress check-ins", text: "Weight, waist and photos over time.", href: "/progress" },
  { icon: UserRound, title: "Your plans", text: "Diet and workout plans from your coach.", href: "/account/plans" },
  { icon: FileHeart, title: "Blood report reader", text: "For members we switch it on for: a lab report explained in plain words.", href: "/account/blood-report" },
  { icon: BookOpen, title: `${BOOKS.length}-book library`, text: "Fitness, nutrition and health guides you own.", href: "/library" },
  { icon: Timer, title: "Gym timers", text: "Rest, Tabata and EMOM timers for the floor.", href: "/timers" },
] as const;

export default async function AppPage() {
  const c = await getContent();
  const android = await apkPublished();
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "App", path: "/app" }])]} />
      <PageHero
        eyebrow="Members app"
        title="Royal Fitness"
        highlight="on your phone"
        intro="One account for the app and the website. Sign up free with Google or your email, and your plans, logs and books are on every device."
      />

      <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-10 sm:px-6 md:grid-cols-3">
        <div className="glass brand-border flex flex-col gap-4 rounded-3xl p-6">
          <Smartphone className="h-8 w-8 text-sky" />
          <h2 className="font-display text-2xl text-white">Android</h2>
          {android ? (
            <>
              <a href="/app/download" className="btn-brand inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold">
                <Download className="h-4 w-4" /> Download the app
              </a>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-white/70">
                <li>Tap Download, then open the file.</li>
                <li>If Android asks, allow installs from your browser for this one app.</li>
                <li>Open Royal Fitness and sign in.</li>
              </ol>
            </>
          ) : (
            <p className="text-sm text-white/70">The Android download is being prepared. Until then, use &ldquo;Install from the browser&rdquo; on this page. It works the same way.</p>
          )}
        </div>

        <div className="glass brand-border flex flex-col gap-4 rounded-3xl p-6">
          <Apple className="h-8 w-8 text-sky" />
          <h2 className="font-display text-2xl text-white">iPhone</h2>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-white/70">
            <li>Open this page in Safari.</li>
            <li>Tap the Share button (the square with an arrow).</li>
            <li>Tap &ldquo;Add to Home Screen&rdquo;, then Add.</li>
          </ol>
          <p className="text-xs text-white/50">The Royal Fitness icon then opens full screen, like any app.</p>
        </div>

        <div className="glass brand-border flex flex-col gap-4 rounded-3xl p-6">
          <Download className="h-8 w-8 text-sky" />
          <h2 className="font-display text-2xl text-white">Install from the browser</h2>
          <p className="text-sm text-white/70">On Android phones and computers you can install straight from Chrome. Nothing extra to download.</p>
          <InstallApp />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <div className="glass brand-border flex flex-col items-center gap-4 rounded-3xl p-8 text-center">
          <h2 className="font-display text-3xl text-white">New here? Register free</h2>
          <p className="max-w-xl text-white/70">No password to remember. Sign in with Google or get a one-tap email link. The same account works in the app and on the website.</p>
          <Link prefetch={false} href="/account?next=/account" className="btn-brand rounded-full px-6 py-3 text-sm font-bold">
            Create my account
          </Link>
          <p className="text-xs text-white/50">
            Want to join the gym too? See <Link href="/membership" className="underline hover:text-brand">membership plans</Link> or book a <Link href="/contact#trial" className="underline hover:text-brand">free trial</Link>.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <h2 className="font-display mb-5 text-center text-3xl text-white">What&apos;s inside</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li key={f.href}>
              <Link href={f.href} className="glass flex h-full gap-3 rounded-2xl p-5 hover:border-brand/50">
                <f.icon className="h-6 w-6 shrink-0 text-sky" />
                <span>
                  <span className="block font-semibold text-white">{f.title}</span>
                  <span className="block text-sm text-white/65">{f.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <div className="flex gap-3 rounded-2xl border border-white/10 p-5 text-sm text-white/65">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" />
          <p>
            Using the older Royal Fitness app? This app replaces it, and your old login doesn&apos;t carry over. Sign in here with the same Google account or email. Questions? Call {c.business.phone}.
          </p>
        </div>
      </section>
    </>
  );
}
