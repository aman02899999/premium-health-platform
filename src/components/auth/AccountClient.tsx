"use client";

/* eslint-disable @next/next/no-img-element -- Google avatar URLs are external */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Dumbbell, Loader2, Salad, Trash2, Trophy } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/browser";
import { SignInOptions, SignOutButton } from "./AuthButtons";

const ITEMS = [
  { key: "rfc-plan", label: "Saved workout plan", href: "/workout-planner", icon: Dumbbell },
  { key: "rfc-food-log", label: "Food log", href: "/nutrition", icon: Salad },
  { key: "rfc-progress", label: "Progress check-ins", href: "/progress", icon: Trophy },
] as const;

type Row = { key: string; value: unknown; updated_at: string };

function describe(key: string, value: unknown) {
  if (!Array.isArray(value)) return "Saved";
  if (key === "rfc-plan") return `${value.length}-day plan`;
  if (key === "rfc-food-log") return `${value.length} food${value.length === 1 ? "" : "s"} logged`;
  return `${value.length} check-in${value.length === 1 ? "" : "s"}`;
}

export function AccountClient() {
  const supabase = getBrowserClient();
  const params = useSearchParams();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from("user_data").select("key, value, updated_at");
    setRows((data as Row[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) load();
    });
  }, [supabase, load]);

  if (!supabase) {
    return <p className="glass rounded-3xl p-6 text-center text-white/70">Member accounts aren&apos;t switched on for this site yet.</p>;
  }
  if (user === undefined) {
    return <Loader2 className="mx-auto h-8 w-8 animate-spin text-sky" />;
  }
  if (!user) {
    return (
      <div className="glass brand-border mx-auto max-w-md space-y-5 rounded-3xl p-8 text-center">
        {params.get("error") && <p className="rounded-xl bg-ember/15 p-3 text-sm text-red-200">Sign-in didn&apos;t complete. Please try again.</p>}
        <p className="text-white/75">Free for everyone — no password to remember. We only use your name and email to identify your account.</p>
        <SignInOptions next={params.get("next") ?? "/account"} />
        <p className="text-xs text-white/45">
          By continuing you agree to our <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.
        </p>
      </div>
    );
  }

  const meta = user.user_metadata as Record<string, string>;
  const name = meta.full_name || meta.name || "Member";
  const avatar = meta.avatar_url || meta.picture;
  const byKey = new Map(rows.map((r) => [r.key, r]));

  return (
    <div className="space-y-6">
      <div className="glass brand-border flex flex-col items-center gap-5 rounded-3xl p-6 sm:flex-row">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy text-3xl font-bold text-white ring-2 ring-sky/60">
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : name[0]}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="font-display text-2xl text-white">{name}</p>
          <p className="text-white/60">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-xl text-white">Synced to your account</h2>
        <p className="mt-1 text-sm text-white/55">These save automatically while you&apos;re signed in.</p>
        <ul className="mt-5 space-y-3">
          {ITEMS.map((it) => {
            const row = byKey.get(it.key);
            return (
              <li key={it.key}>
                <Link href={it.href} className="flex items-center gap-4 rounded-2xl bg-black/20 p-4 hover:ring-1 hover:ring-sky/50">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy">
                    <it.icon className="h-5 w-5 text-sky" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold text-white">{it.label}</span>
                    <span className="text-sm text-white/55">
                      {row ? `${describe(it.key, row.value)} · updated ${new Date(row.updated_at).toLocaleDateString("en-IN")}` : "Nothing saved yet — open the tool to start"}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        {rows.length > 0 && (
          <button
            type="button"
            onClick={async () => {
              if (!confirm("Delete all your synced data from our servers? This can't be undone.")) return;
              await supabase.from("user_data").delete().eq("user_id", user.id);
              for (const it of ITEMS) localStorage.removeItem(it.key);
              localStorage.removeItem("rfc-food-target");
              load();
            }}
            className="mt-5 inline-flex items-center gap-2 text-sm text-red-300/80 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" /> Delete my synced data
          </button>
        )}
      </div>
    </div>
  );
}
