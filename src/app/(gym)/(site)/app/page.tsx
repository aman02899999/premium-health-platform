import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Apple, ArrowRight, BookOpen, Download, Dumbbell, FileHeart, Salad, ShieldCheck, Smartphone, Timer, Trophy, UserRound } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { breadcrumbJsonLd, faqJsonLd, pageMeta } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { ANDROID_PACKAGE, apkPublished } from "@/lib/app-download";
import { BOOKS } from "@/lib/library/catalog";
import { COMPLETE_LIBRARY_PRICE } from "@/lib/library/pricing";
import { DIET_PLANS } from "@/lib/growth/config";
import { FaqList } from "@/components/home/Blocks";
import { JsonLd } from "@/components/ui/JsonLd";
import { InstallApp } from "@/components/app/InstallApp";
import { ShareApp } from "@/components/app/ShareApp";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Free Fitness App for Indian Diets: Workout Plan, Food Log & Progress",
    description: `The free ${c.business.name} app: build a workout plan, log Indian meals with protein and calories, track weight and waist, and use gym timers. Android and iPhone. Sign up with Google or email.`,
    path: "/app",
  });
}

const FEATURES = [
  { icon: Dumbbell, title: "Workout planner", text: "Pick your goal and days. Get a full weekly plan, then save, print or share it.", href: "/workout-planner" },
  { icon: Salad, title: "Indian food log", text: "Roti, dal, paneer, chicken and more, with protein and calories per serving.", href: "/nutrition" },
  { icon: Trophy, title: "Progress tracker", text: "Weight and waist charts that show the trend, not just today's number.", href: "/progress" },
  { icon: Timer, title: "Gym timers", text: "Tabata, HIIT, rest and pranayama timers with beeps, made for the gym floor.", href: "/timers" },
  { icon: UserRound, title: "Your coach's plans", text: "Bought a diet plan? It appears in the app, with updates as you progress.", href: "/account/plans" },
  { icon: FileHeart, title: "Blood report reader", text: "For members we switch it on for: a lab report explained in plain words.", href: "/account/blood-report" },
] as const;

const SCREENS = [
  { src: "/app/screen-food.webp", alt: "Food log screen showing today's calories and protein" },
  { src: "/app/screen-progress.webp", alt: "Progress screen with weight and waist charts" },
  { src: "/app/screen-workout.webp", alt: "Workout plan screen with sets, reps and rest" },
] as const;

export default async function AppPage() {
  const c = await getContent();
  const android = await apkPublished();
  const trial = DIET_PLANS.find((p) => p.trial);
  const cheapestBook = Math.min(...BOOKS.map((b) => b.price));
  const faqs = [
    { id: "free", q: "Is the Royal Fitness app free?", a: "Yes. The workout planner, food log, progress tracker and timers are free. Sign up with Google or an email link, no password needed. You only pay if you choose a gym membership, a personal diet plan or a library book." },
    { id: "member", q: "Do I need to be a gym member to use it?", a: `No. Anyone can use the free tools. Members and diet plan clients also see their personal plans from ${c.business.name}'s coaches in the app.` },
    { id: "iphone", q: "Is there an iPhone app?", a: "On iPhone, open this page in Safari, tap Share, then Add to Home Screen. The Royal Fitness icon then opens full screen like any app, with the same account." },
    { id: "android", q: "How do I install it on Android?", a: android ? "Tap Download on this page and open the file. Android may ask you once to allow installs from your browser. You can also install it straight from Chrome with the install button." : "Install it straight from Chrome with the install button on this page. The downloadable Android app is coming soon and works the same way." },
    { id: "data", q: "Who can see my food log and weigh-ins?", a: "Only you. They are saved to your own account and synced across your devices. You can delete them any time from My account." },
    { id: "old", q: "I used the older Royal Fitness app. What now?", a: "This app replaces it. Your old login does not carry over, so sign in here with your Google account or email." },
  ];
  const appLd = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "Royal Fitness",
    operatingSystem: "Android, iOS",
    applicationCategory: "HealthApplication",
    url: `${SITE_URL}/app`,
    ...(android ? { downloadUrl: `${SITE_URL}/app/download`, identifier: ANDROID_PACKAGE } : {}),
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    publisher: { "@id": `${SITE_URL}/#gym` },
    screenshot: SCREENS.map((s) => `${SITE_URL}${s.src}`),
  };

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "App", path: "/app" }]), appLd, faqJsonLd(faqs)]} />

      <section className="relative overflow-hidden pb-10 pt-32 sm:pt-40">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-brand/10 blur-[120px]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="text-center lg:text-left">
            <h1 className="font-display text-4xl leading-tight text-white sm:text-6xl">
              Your gym in your pocket. <span className="text-brand">Free.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/75 lg:mx-0">
              Workout plans, an Indian food log and progress charts from {c.business.name}. One account on your phone and the website.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link prefetch={false} href="/account?next=/account" className="btn-brand inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 font-bold sm:w-auto">
                Create my free account <ArrowRight className="h-4 w-4" />
              </Link>
              {android ? (
                <a href="/app/download" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-3.5 font-bold text-white hover:border-sky sm:w-auto">
                  <Download className="h-4 w-4" /> Download for Android
                </a>
              ) : (
                <a href="#install" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-3.5 font-bold text-white hover:border-sky sm:w-auto">
                  <Smartphone className="h-4 w-4" /> Install on my phone
                </a>
              )}
            </div>
            <p className="mt-4 text-sm text-white/55">No password. Works on Android, iPhone and computers.</p>
          </div>

          <div className="app-screens flex justify-center gap-3 sm:gap-4">
            {SCREENS.map((s, i) => (
              <Image
                key={s.src}
                src={s.src}
                alt={s.alt}
                width={390}
                height={844}
                priority={i === 0}
                sizes="(min-width: 1024px) 180px, 30vw"
                className={`app-screen w-[30%] max-w-[190px] rounded-[1.6rem] border border-white/15 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)] ${i === 1 ? "-translate-y-4" : "translate-y-3"}`}
                style={{ animationDelay: `${i * 90}ms` }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <h2 className="font-display mb-6 text-center text-3xl text-white">Everything in the app</h2>
        <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.href}>
              <Link href={f.href} className="group flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy/60 text-sky">
                  <f.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold text-white group-hover:text-brand">{f.title}</span>
                  <span className="block text-sm text-white/65">{f.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="install" className="mx-auto grid max-w-6xl scroll-mt-28 gap-5 px-4 pb-14 sm:px-6 md:grid-cols-3">
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
        </div>
        <div className="glass brand-border flex flex-col gap-4 rounded-3xl p-6">
          <Download className="h-8 w-8 text-sky" />
          <h2 className="font-display text-2xl text-white">Install from the browser</h2>
          <p className="text-sm text-white/70">On Android phones and computers you can install straight from Chrome. Nothing extra to download.</p>
          <InstallApp />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <h2 className="font-display text-center text-3xl text-white">When you want more than the free tools</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-white/65">The app is free for good. These are the paid extras, and they all show up inside it.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {trial && (
            <Link href="/diet-chart?plan=trial#order" className="glass brand-border group flex flex-col gap-3 rounded-3xl p-6 hover:ring-1 hover:ring-brand/60">
              <Salad className="h-7 w-7 text-brand" />
              <span className="font-display text-xl text-white">Personal diet chart</span>
              <span className="text-sm text-white/65">A coach builds your plan around your body, goal and food. Try the {trial.name} for ₹{trial.priceRupees}.</span>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-brand">Start for ₹{trial.priceRupees} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          )}
          <Link href="/membership" className="glass brand-border group flex flex-col gap-3 rounded-3xl p-6 hover:ring-1 hover:ring-brand/60">
            <Dumbbell className="h-7 w-7 text-brand" />
            <span className="font-display text-xl text-white">Train at the gym</span>
            <span className="text-sm text-white/65">Join {c.business.name} in {c.business.address.locality}, Noida, with coaches on the floor. Book a free trial first.</span>
            <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-brand">See membership plans <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </Link>
          <Link href="/library" className="glass brand-border group flex flex-col gap-3 rounded-3xl p-6 hover:ring-1 hover:ring-brand/60">
            <BookOpen className="h-7 w-7 text-brand" />
            <span className="font-display text-xl text-white">Premium library</span>
            <span className="text-sm text-white/65">{BOOKS.length} guides on strength, Indian nutrition, yoga and health. Books from ₹{cheapestBook}, or all of them for ₹{COMPLETE_LIBRARY_PRICE}.</span>
            <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-brand">Browse the library <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <h2 className="font-display mb-6 text-center text-3xl text-white">Questions about the app</h2>
        <FaqList faqs={faqs} />
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <div className="glass brand-border flex flex-col items-center gap-4 rounded-3xl p-8 text-center">
          <h2 className="font-display text-3xl text-white">Train with a friend</h2>
          <p className="max-w-lg text-white/70">People stick with it longer when a friend is on the same plan. Send them the app.</p>
          <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
            <Link prefetch={false} href="/account?next=/account" className="btn-brand w-full rounded-full px-6 py-3 text-sm font-bold sm:w-auto">
              Create my free account
            </Link>
            <ShareApp url={`${SITE_URL}/app`} text={`I'm using the free ${c.business.name} app for workouts and an Indian food log. Try it:`} className="w-full sm:w-auto" />
          </div>
          <p className="flex items-center gap-2 text-xs text-white/50">
            <ShieldCheck className="h-4 w-4 text-emerald-300" /> Your data stays in your own account. Questions? Call {c.business.phone}.
          </p>
        </div>
      </section>
    </>
  );
}
