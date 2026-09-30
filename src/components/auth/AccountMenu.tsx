"use client";

/* eslint-disable @next/next/no-img-element -- Google avatar URLs are external */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { getBrowserClient, signInWithGoogle } from "@/lib/supabase/browser";

/** Header sign-in button / avatar menu. Renders nothing when Supabase isn't configured. */
export function AccountMenu() {
  const supabase = getBrowserClient();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !user) return;
    supabase.rpc("is_admin").then(({ data }) => setAdmin(data === true));
  }, [supabase, user]);

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  if (!supabase) return null;

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => signInWithGoogle(pathname === "/" ? "/account" : pathname)}
        className="hidden h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-semibold text-white/85 hover:border-sky hover:text-white md:flex"
      >
        <UserRound className="h-4 w-4" /> Sign in
      </button>
    );
  }

  const meta = user.user_metadata as Record<string, string>;
  const name = meta.full_name || meta.name || user.email || "Member";
  const avatar = meta.avatar_url || meta.picture;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-navy font-bold text-white ring-2 ring-sky/60"
      >
        {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : name[0]?.toUpperCase()}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-line bg-coal shadow-2xl">
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            <p className="truncate text-xs text-white/50">{user.email}</p>
          </div>
          <Link role="menuitem" href="/account" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/85 hover:bg-white/5">
            <UserRound className="h-4 w-4 text-sky" /> My account
          </Link>
          {admin && (
            <Link role="menuitem" href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/85 hover:bg-white/5">
              <LayoutDashboard className="h-4 w-4 text-sky" /> Admin panel
            </Link>
          )}
          <button
            role="menuitem"
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.reload();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-white/85 hover:bg-white/5"
          >
            <LogOut className="h-4 w-4 text-sky" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
