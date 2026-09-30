"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, Dumbbell, HeartPulse, Leaf, Salad, ShieldCheck, Stethoscope, Timer, Users } from "lucide-react";
import { healthHref, healthIsExternal, PORTAL_KEY } from "@/lib/portal";

type Choice = "gym" | "health";

function remember(choice: Choice) {
  try {
    localStorage.setItem(PORTAL_KEY, choice);
  } catch {
    /* storage unavailable */
  }
}

// Pointer tilt for one card; touch and reduced-motion users get the idle float only.
function useTilt<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--ry", `${x * 22}deg`);
        el.style.setProperty("--rx", `${-y * 18}deg`);
        el.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
        el.style.setProperty("--my", `${(y + 0.5) * 100}%`);
      });
    };
    const leave = () => {
      cancelAnimationFrame(frame);
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);
  return ref;
}

/**
 * Two floating 3D doors: Royal Fitness Club (this site) and the Premium Health
 * Platform. `onGym` lets the homepage overlay simply close instead of navigating.
 */
export function PortalScene({ onGym, gymName }: { onGym?: () => void; gymName: string }) {
  const gymRef = useTilt<HTMLAnchorElement>();
  const healthRef = useTilt<HTMLAnchorElement>();

  return (
    <div className="portal-stage relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      {/* depth backdrop: glow, perspective floor and two orbit rings */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_25%_40%,rgba(4,70,109,.6),transparent_55%),radial-gradient(ellipse_at_80%_60%,rgba(16,185,129,.22),transparent_50%),radial-gradient(ellipse_at_50%_100%,rgba(232,57,75,.18),transparent_55%)]" />
      <div className="grid-floor pointer-events-none absolute inset-x-0 bottom-0 h-1/2 origin-bottom opacity-70 [transform:perspective(600px)_rotateX(62deg)]" />
      <div className="portal-orbit portal-orbit-a pointer-events-none" aria-hidden />
      <div className="portal-orbit portal-orbit-b pointer-events-none" aria-hidden />

      <header className="portal-rise relative z-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky">One account · two worlds</p>
        <h1 className="font-display mt-3 text-4xl leading-none text-white sm:text-6xl">
          Where do you want <span className="text-brand-gradient">to go?</span>
        </h1>
      </header>

      <div className="portal-cards relative z-10 mt-10 grid w-full max-w-5xl gap-6 sm:mt-14 md:grid-cols-2 md:gap-10">
        <Link
          ref={gymRef}
          href="/"
          onClick={(e) => {
            remember("gym");
            if (onGym) {
              e.preventDefault();
              onGym();
            }
          }}
          className="portal-card portal-card-gym group"
          style={{ ["--delay" as string]: "0ms" }}
          aria-label={`${gymName} — gym website`}
        >
          <span className="portal-card-inner">
            <span className="portal-layer portal-z-40 flex items-center gap-3">
              <span className="rounded-xl bg-white px-2 py-1.5 shadow-lg">
                <Image src="/brand/logo-mark.png" alt="" width={352} height={160} className="h-9 w-auto" priority />
              </span>
              <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white/80">Gym · Sector 93 Noida</span>
            </span>
            <span className="portal-layer portal-z-80 font-display mt-8 block text-4xl leading-[0.95] text-white sm:text-5xl">
              Royal<br />Fitness Club
            </span>
            <span className="portal-layer portal-z-40 mt-4 block max-w-xs text-sm text-white/75">Memberships, trainers, timings, photos, free trial — and your workout &amp; diet tools.</span>
            <span className="portal-layer portal-z-20 mt-6 flex flex-wrap gap-2 text-[11px] font-semibold text-white/80">
              <span className="portal-chip"><Dumbbell className="h-3.5 w-3.5" /> Programs</span>
              <span className="portal-chip"><Users className="h-3.5 w-3.5" /> Couple plans</span>
              <span className="portal-chip"><Timer className="h-3.5 w-3.5" /> 5:30 AM–10 PM</span>
            </span>
            <span className="portal-layer portal-z-60 mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white shadow-[0_10px_30px_-10px_rgba(232,57,75,.9)]">
              Enter the gym <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
            <Dumbbell className="portal-emblem" aria-hidden />
          </span>
          <span className="portal-glare" aria-hidden />
        </Link>

        <a
          ref={healthRef}
          href={healthHref}
          onClick={() => remember("health")}
          className="portal-card portal-card-health group"
          style={{ ["--delay" as string]: "140ms" }}
          aria-label="Premium Health Platform"
          {...(healthIsExternal ? { rel: "noopener" } : {})}
        >
          <span className="portal-card-inner">
            <span className="portal-layer portal-z-40 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-amber-400 text-stone-900 shadow-lg">
                <HeartPulse className="h-6 w-6" />
              </span>
              <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white/80">Health knowledge</span>
            </span>
            <span className="portal-layer portal-z-80 font-display mt-8 block text-4xl leading-[0.95] text-white sm:text-5xl">
              Premium Health<br />Platform
            </span>
            <span className="portal-layer portal-z-40 mt-4 block max-w-xs text-sm text-white/75">Diseases, foods, Indian diet plans, Ayurveda, calculators and evidence-based guides.</span>
            <span className="portal-layer portal-z-20 mt-6 flex flex-wrap gap-2 text-[11px] font-semibold text-white/80">
              <span className="portal-chip"><Stethoscope className="h-3.5 w-3.5" /> Conditions</span>
              <span className="portal-chip"><Salad className="h-3.5 w-3.5" /> Nutrition</span>
              <span className="portal-chip"><Leaf className="h-3.5 w-3.5" /> Ayurveda</span>
            </span>
            <span className="portal-layer portal-z-60 mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-sm font-bold text-stone-900 shadow-[0_10px_30px_-10px_rgba(52,211,153,.9)]">
              Explore health <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
            <HeartPulse className="portal-emblem" aria-hidden />
          </span>
          <span className="portal-glare" aria-hidden />
        </a>
      </div>

      <p className="portal-rise relative z-10 mt-10 flex items-center gap-2 text-center text-xs text-white/55" style={{ animationDelay: "400ms" }}>
        <ShieldCheck className="h-4 w-4 text-sky" /> Sign in once with Google — the same account works on both.
      </p>
    </div>
  );
}
