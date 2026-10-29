"use client";

import Link from "next/link";
import { Dumbbell, Salad, Timer, TrendingUp, UserRound, type LucideIcon } from "lucide-react";

/** The member tools: on these pages phones get an app-style tab bar instead of the contact bar. */
export const MEMBER_TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/account", label: "Me", icon: UserRound },
  { href: "/workout-planner", label: "Workout", icon: Dumbbell },
  { href: "/nutrition", label: "Food", icon: Salad },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/timers", label: "Timers", icon: Timer },
];

export const isMemberPath = (pathname: string) => pathname === "/app" || MEMBER_TABS.some((t) => pathname === t.href || pathname.startsWith(`${t.href}/`));

export function MemberTabs({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Member tools" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden">
      <ul className="grid h-[4.5rem] grid-cols-5 px-1">
        {MEMBER_TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                prefetch={false}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`member-tab flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold ${active ? "text-white" : "text-white/55"}`}
              >
                <span className={`member-tab-icon flex h-8 w-14 items-center justify-center rounded-full ${active ? "bg-brand-strong/90 text-white" : ""}`}>
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
