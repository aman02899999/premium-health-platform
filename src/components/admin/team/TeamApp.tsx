"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { initials, type Member, type Role } from "@/lib/admin/team-core";

type Data = { team: Member[]; roles: { id: Role; label: string; hint: string }[]; me: string };

const card = "rounded-2xl bg-white/[.04] p-4 ring-1 ring-white/10 sm:p-5";
const input = "w-full rounded-lg bg-white/[.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 placeholder:text-white/35 focus:outline-none focus:ring-brand/60";

async function call<T>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : undefined);
  if (r.status === 401) {
    location.href = "/admin/login";
    throw new Error("Signed out");
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Something went wrong");
  return j as T;
}

export function TeamApp() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [form, setForm] = useState<{ email: string; name: string; role: Role }>({ email: "", name: "", role: "agent" });

  const load = useCallback(async () => {
    try {
      setData(await call<Data>("/api/admin/team"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  /** Runs a team change; resolves true when it worked. */
  const act = (body: Record<string, unknown>, done: string): Promise<boolean> =>
    call("/api/admin/team", body).then(
      () => {
        setNote(done);
        load();
        return true;
      },
      (e: Error) => {
        setNote(e.message);
        return false;
      },
    );

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3">
          <a href="/admin" aria-label="Back to Command Center" className="rounded-lg p-1.5 text-white/70 hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <Users className="h-5 w-5 text-sky-300" />
          <span className="font-display text-lg">Team & agents</span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
        {!data && !error && <p className="text-sm text-white/50">Loading…</p>}
        {data && (
          <>
            <form
              className={`${card} grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end`}
              onSubmit={(e) => {
                e.preventDefault();
                act({ action: "add", ...form }, `Added ${form.email}. They sign in at /admin with that Google account.`).then((ok) => ok && setForm({ ...form, email: "", name: "" }));
              }}
            >
              <h2 className="flex items-center gap-2 font-display text-lg sm:col-span-4">
                <UserPlus className="h-5 w-5 text-sky-300" /> Add a team member
              </h2>
              <label className="text-sm">
                <span className="mb-1 block text-white/60">Google email</span>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="desk@gmail.com" className={input} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-white/60">Name</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ritu (front desk)" maxLength={80} className={input} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-white/60">Role</span>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className={input}>
                  {data.roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn-brand rounded-lg px-5 py-2 text-sm font-bold">Add</button>
              <p className="text-xs text-white/50 sm:col-span-4">{data.roles.find((r) => r.id === form.role)?.hint}</p>
              {note && <p className="rounded-lg bg-white/[.05] px-3 py-2 text-sm sm:col-span-4">{note}</p>}
            </form>

            <section className={card}>
              <h2 className="font-display text-lg">Team</h2>
              <ul className="mt-3 divide-y divide-white/5">
                {data.team.map((m) => {
                  const self = m.email === data.me.toLowerCase();
                  return (
                    <li key={m.email} className="flex flex-wrap items-center gap-3 py-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky-500/20 text-xs font-bold text-sky-100">{initials(m.name, m.email)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {m.name || m.email.split("@")[0]} {self && <span className="text-xs text-white/45">(you)</span>}
                        </span>
                        <span className="block truncate text-xs text-white/50">{m.email}</span>
                      </span>
                      <select
                        value={m.role}
                        disabled={self}
                        aria-label={`Role for ${m.email}`}
                        onChange={(e) => act({ action: "role", email: m.email, role: e.target.value }, `${m.email} is now ${data.roles.find((r) => r.id === e.target.value)?.label}.`)}
                        className={`${input.replace("w-full", "w-36")} shrink-0 disabled:opacity-60`}
                      >
                        {data.roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <button
                        disabled={self}
                        onClick={() => confirm(`Remove ${m.email}? They lose admin access, and their assigned chats go back to unassigned.`) && act({ action: "remove", email: m.email }, `Removed ${m.email}.`)}
                        aria-label={`Remove ${m.email}`}
                        className="rounded-lg p-2 text-white/50 hover:bg-red-500/20 hover:text-red-200 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className={`${card} text-sm`}>
              <h2 className="flex items-center gap-2 font-display text-lg">
                <ShieldCheck className="h-5 w-5 text-emerald-300" /> What each role can open
              </h2>
              <ul className="mt-2 space-y-1.5 text-white/70">
                {data.roles.map((r) => (
                  <li key={r.id}>
                    <b className="text-white">{r.label}:</b> {r.hint}.
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-white/45">Checked on every admin page and API call, not just hidden from the menu. There is always at least one owner, and nobody can remove or demote themselves.</p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
