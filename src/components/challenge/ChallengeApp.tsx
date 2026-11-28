"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Award, Check, Copy, Gift, Loader2, Lock, Medal, Share2, Timer, Trophy, Users } from "lucide-react";
import { SignInOptions } from "@/components/auth/AuthButtons";
import { REF_KEY } from "./RefCapture";

type LevelId = "beginner" | "intermediate" | "advance";
type Tier = "gold" | "silver" | "bronze" | null;
type Question = { questionId: string; prompt: string; options: string[] | null };
type Attempt = { attemptId: string; level: LevelId; index: number; total: number; question: Question | null; deadline: number | null; serverNow: number; finished: boolean };
type Level = { id: LevelId; unlocked: boolean; open: boolean; nextFreeAt: number | null; last: { pct: number | null; certificateCode: string | null } | null };
type Badge = { id: string; label: string; tier?: Tier };
type Prize = { claimCode: string | null; month: string; prize: string; status: string; level: LevelId };
type Done = { level: LevelId; month: string; pct: number | null; tier: Tier; certificateCode: string | null };
type Referral = { code: string; pending: number; qualified: number; retriesLeft: number; earnedThisMonth: number } | null;
type Profile = { firstName: string; lastInitial: string; phone: string; area: "ncr" | "outside"; leaderboard: boolean; contactConsent: boolean } | null;
type Share = { code: string; videoId: string; visits: number; rewarded: boolean } | null;
type Me = { name: string; profile: Profile; levels: Level[]; active: Attempt | null; badges: Badge[]; referral: Referral; prizes: Prize[]; attempts: Done[]; share: Share };
type Result = { correct: number; total: number; pct: number; tier: Tier; certificateCode: string | null; rank: number | null; players: number; badges: Badge[]; level: LevelId };

const NAMES: Record<LevelId, string> = { beginner: "Beginner", intermediate: "Intermediate", advance: "Advance" };
const PRIZE_NAMES: Record<string, string> = { "gym-3m": "3 months free gym", "gym-1m": "1 month free gym", "gym-15d": "15 days free gym + diet consultation", "diet-1m": "1-month online diet plan", "pass-7d": "7-day gym pass", "pass-3d": "3-day gym pass + diet consultation" };
const TIER_STYLE: Record<string, string> = { gold: "bg-amber-400/15 text-amber-200 ring-amber-300/40", silver: "bg-slate-300/15 text-slate-100 ring-slate-200/40", bronze: "bg-orange-700/20 text-orange-200 ring-orange-400/40" };
const READ_SECONDS = 8;
const card = "rounded-2xl bg-white/[.04] p-5 ring-1 ring-white/10";
const input = "w-full rounded-xl bg-white/[.06] px-4 py-3 text-base text-white ring-1 ring-white/15 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-brand/70";
const day = (ms: number) => new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

async function api<T>(body?: unknown): Promise<{ status: number; data: T & { error?: string } }> {
  const r = await fetch("/api/challenge", body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : { cache: "no-store" });
  return { status: r.status, data: await r.json().catch(() => ({}) as T & { error?: string }) };
}

function readRef(): string {
  try {
    return localStorage.getItem(REF_KEY) ?? "";
  } catch {
    return "";
  }
}

// ───────── Profile form ─────────

function ProfileForm({ name, initial, onSaved }: { name: string; initial: Profile; onSaved: () => void }) {
  const [f, setF] = useState({ firstName: initial?.firstName ?? name.split(" ")[0] ?? "", lastInitial: initial?.lastInitial ?? "", phone: initial?.phone ?? "", area: initial?.area ?? ("" as "" | "ncr" | "outside"), leaderboard: initial?.leaderboard ?? true, contactConsent: initial?.contactConsent ?? false, ref: initial ? "" : readRef() });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  return (
    <form
      className={`${card} space-y-4`}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const r = await api({ action: "profile", ...f });
        setBusy(false);
        if (r.status !== 200) return setError(r.data.error || "Kuch galat ho gaya. Phir try karein.");
        try {
          localStorage.removeItem(REF_KEY);
        } catch {}
        onSaved();
      }}
    >
      <h2 className="font-display text-xl text-white">{initial ? "Edit your details" : "Your details"}</h2>
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <label className="block text-sm text-white/80">
          First name
          <input className={`${input} mt-1`} value={f.firstName} onChange={(e) => set("firstName", e.target.value)} autoComplete="given-name" required maxLength={40} />
        </label>
        <label className="block text-sm text-white/80">
          Surname initial
          <input className={`${input} mt-1`} value={f.lastInitial} onChange={(e) => set("lastInitial", e.target.value.slice(0, 1))} maxLength={1} placeholder="K" />
        </label>
      </div>
      <label className="block text-sm text-white/80">
        Mobile number
        <input className={`${input} mt-1`} value={f.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" autoComplete="tel" placeholder="98765 43210" required />
        <span className="mt-1 block text-xs text-white/50">We check it when you collect a prize. One number, one account.</span>
      </label>
      <fieldset>
        <legend className="text-sm text-white/80">Where do you live?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {([["ncr", "Noida / Delhi NCR"], ["outside", "Outside NCR"]] as const).map(([v, label]) => (
            <label key={v} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-xl px-4 ring-1 ${f.area === v ? "bg-brand/15 ring-brand/60 text-white" : "bg-white/[.04] ring-white/15 text-white/80"}`}>
              <input type="radio" name="area" value={v} checked={f.area === v} onChange={() => set("area", v)} className="accent-[var(--color-brand)]" required />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex gap-3 text-sm text-white/80">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--color-brand)]" checked={f.leaderboard} onChange={(e) => set("leaderboard", e.target.checked)} />
        Show me on the leaderboard as first name and surname initial.
      </label>
      <label className="flex gap-3 text-sm text-white/80">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--color-brand)]" checked={f.contactConsent} onChange={(e) => set("contactConsent", e.target.checked)} />
        Royal Fitness Club can contact me on WhatsApp, call or email about membership and diet plans. I can reply STOP any time.
      </label>
      {!initial && (
        <label className="block text-sm text-white/80">
          Friend&apos;s referral code (optional)
          <input className={`${input} mt-1 uppercase`} value={f.ref} onChange={(e) => set("ref", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))} placeholder="RAHUL4K7Q" />
        </label>
      )}
      {error && <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>}
      <button disabled={busy} className="btn-brand inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold disabled:opacity-60">
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save and continue
      </button>
    </form>
  );
}

// ───────── The quiz ─────────

function Quiz({ start, onDone }: { start: Attempt; onDone: (r: Result | null) => void }) {
  const [a, setA] = useState(start);
  const [offset, setOffset] = useState(() => start.serverNow - Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const switches = useRef(0);
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  const apply = useCallback(
    (data: { attempt?: Attempt; result?: Result; timedOut?: boolean; error?: string; code?: string }) => {
      if (data.result) return onDone(data.result);
      if (!data.attempt) return onDone(null);
      setOffset(data.attempt.serverNow - Date.now());
      if (data.attempt.index !== a.index) {
        setPicked(null);
        shownAt.current = Date.now();
      }
      setNote(data.timedOut ? "Time up on that one. Next question!" : "");
      setA(data.attempt);
    },
    [a.index, onDone],
  );

  // Tab or app switches are counted and sent with the next answer.
  useEffect(() => {
    const off = () => {
      if (document.visibilityState === "hidden") switches.current += 1;
    };
    document.addEventListener("visibilitychange", off);
    return () => document.removeEventListener("visibilitychange", off);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const serverNow = now + offset;
  const left = a.deadline === null ? 30 : Math.max(0, Math.ceil((a.deadline - serverNow) / 1000));
  const q = a.question;

  const reveal = useCallback(async () => {
    if (busy || !q || q.options) return;
    setBusy(true);
    const r = await api<{ attempt?: Attempt; result?: Result }>({ action: "reveal", index: a.index });
    setBusy(false);
    apply(r.data);
  }, [a.index, apply, busy, q]);

  // Options appear by themselves after a short read.
  useEffect(() => {
    if (!q || q.options) return;
    const t = setTimeout(reveal, Math.max(0, READ_SECONDS * 1000 - (Date.now() - shownAt.current)));
    return () => clearTimeout(t);
  }, [q, reveal]);

  // Time up: wait out the server's grace, then fetch the next question.
  useEffect(() => {
    if (left > 0 || busy) return;
    const t = setTimeout(async () => {
      setBusy(true);
      const r = await api<{ attempt?: Attempt; result?: Result }>({ action: "reveal", index: a.index });
      setBusy(false);
      apply({ ...r.data, timedOut: true });
    }, 3500);
    return () => clearTimeout(t);
  }, [left, busy, a.index, apply]);

  async function choose(i: number) {
    if (busy || picked !== null || left <= 0) return;
    setPicked(i);
    setBusy(true);
    const tabSwitches = switches.current;
    switches.current = 0;
    const r = await api<{ attempt?: Attempt; result?: Result; timedOut?: boolean }>({ action: "answer", index: a.index, choice: i, tabSwitches });
    setBusy(false);
    if (r.status >= 500) {
      setPicked(null);
      return setNote("Network problem. Tap your answer again.");
    }
    apply(r.data);
  }

  if (!q) return <div className={card}><Loader2 className="mx-auto h-6 w-6 animate-spin text-white/60" aria-label="Loading" /></div>;
  const pct = ((a.index) / a.total) * 100;
  return (
    <div className="mx-auto max-w-2xl select-none" onCopy={(e) => e.preventDefault()} onContextMenu={(e) => e.preventDefault()}>
      <div className="flex items-center justify-between text-sm text-white/70">
        <span>{NAMES[a.level]} · Question {a.index + 1} of {a.total}</span>
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold tabular-nums ring-1 ${left <= 5 ? "bg-red-500/20 text-red-100 ring-red-400/50" : "bg-white/[.06] text-white ring-white/15"}`} aria-live="polite">
          <Timer className="h-4 w-4" aria-hidden /> {left}s
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden>
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className={`${card} mt-5`}>
        <h2 className="text-lg font-semibold leading-snug text-white sm:text-xl">{q.prompt}</h2>
        {!q.options ? (
          <button onClick={reveal} disabled={busy} className="btn-brand mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} I&apos;m ready, show the options
          </button>
        ) : (
          <div className="mt-5 grid gap-3">
            {q.options.map((o, i) => (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={picked !== null || busy || left <= 0}
                className={`flex min-h-14 w-full items-center gap-3 rounded-xl px-4 text-left text-base ring-1 transition ${picked === i ? "bg-brand/25 text-white ring-brand" : "bg-white/[.05] text-white/90 ring-white/15 hover:bg-white/[.09]"} disabled:cursor-not-allowed`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold">{"ABCD"[i]}</span>
                {o}
              </button>
            ))}
          </div>
        )}
      </div>
      {note && <p className="mt-3 text-center text-sm text-amber-200" role="status">{note}</p>}
      <p className="mt-4 text-center text-xs text-white/45">One tap per question. Switching apps or tabs is noted and can stop you winning a prize.</p>
    </div>
  );
}

// ───────── Result ─────────

function ShareRow({ text, url }: { text: string; url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 font-semibold text-black">
        <Share2 className="h-4 w-4" aria-hidden /> Share on WhatsApp
      </a>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {}
        }}
        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-4 font-semibold text-white ring-1 ring-white/20"
      >
        {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

function ResultView({ r, me, onBack }: { r: Result; me: Me | null; onBack: () => void }) {
  const origin = typeof location === "undefined" ? "" : location.origin;
  const refUrl = me?.referral ? `${origin}/challenge?ref=${me.referral.code}` : `${origin}/challenge`;
  const passedIt = r.tier !== null;
  const local = me?.profile?.area !== "outside";
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className={`${card} text-center`}>
        <Trophy className={`mx-auto h-12 w-12 ${passedIt ? "text-amber-300" : "text-white/40"}`} aria-hidden />
        <p className="mt-3 text-sm uppercase tracking-wider text-sky">{NAMES[r.level]} result</p>
        <p className="mt-1 font-display text-6xl text-white">{r.pct}%</p>
        <p className="mt-1 text-white/70">{r.correct} of {r.total} right{r.rank ? ` · Rank #${r.rank} of ${r.players} this month` : ""}</p>
        {r.tier && <span className={`mt-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${TIER_STYLE[r.tier]}`}><Medal className="h-4 w-4" aria-hidden /> {NAMES[r.level]} {r.tier[0].toUpperCase() + r.tier.slice(1)}</span>}
        <p className="mt-4 text-white/85">
          {r.tier === "gold" ? "Shandaar! You're in the running for this month's top prize." : r.tier === "silver" ? "Bahut badhiya! A great score, and you're in the prize draw." : r.tier === "bronze" ? "Pass! You've earned your badge and certificate." : "Almost there. 70% passes. Read up and try again."}
        </p>
        {passedIt && <p className="mt-2 text-xs text-white/55">Prizes are worked out after the month ends. Winners get an email with a claim code.</p>}
        {r.certificateCode && (
          <Link prefetch={false} href={`/challenge/certificate/${r.certificateCode}`} className="btn-brand mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 font-semibold">
            <Award className="h-5 w-5" aria-hidden /> Get your certificate
          </Link>
        )}
      </div>

      <div className={card}>
        <h3 className="flex items-center gap-2 font-semibold text-white"><Users className="h-5 w-5 text-brand" aria-hidden /> Challenge your friends</h3>
        <p className="mt-1 text-sm text-white/70">When a friend joins with your link and finishes Beginner, you get a retry.</p>
        <div className="mt-3"><ShareRow text={`Maine Royal Knowledge Challenge mein ${r.pct}% score kiya! Kya tum beat kar sakte ho?`} url={refUrl} /></div>
      </div>

      <div className={`${card} bg-brand/10 ring-brand/30`}>
        <h3 className="font-semibold text-white">{local ? "Ready to train with us?" : "Want a diet plan made for you?"}</h3>
        <p className="mt-1 text-sm text-white/75">{local ? "Come in for a free trial session at Royal Fitness Club, Sector 93 Noida." : "Our coaches make Indian diet plans you can follow from anywhere."}</p>
        <Link prefetch={false} href={local ? "/membership" : "/diet-plans"} className="mt-3 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 font-semibold text-ink">
          {local ? "See membership plans" : "See diet plans"}
        </Link>
      </div>
      <button onClick={onBack} className="w-full text-center text-sm font-semibold text-sky hover:text-white">Back to the challenge</button>
    </div>
  );
}

// ───────── Leaderboard ─────────

function Ranks() {
  const [level, setLevel] = useState<LevelId>("beginner");
  type Board = { level: LevelId; rows: { rank: number; name: string; correct: number; you: boolean }[]; yourRank: number | null; players: number };
  const [board, setBoard] = useState<Board | null>(null);
  useEffect(() => {
    fetch(`/api/challenge/leaderboard?level=${level}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setBoard({ level, rows: j.rows ?? [], yourRank: j.yourRank ?? null, players: j.players ?? 0 }), () => setBoard({ level, rows: [], yourRank: null, players: 0 }));
  }, [level]);
  const data = board?.level === level ? board : null;
  return (
    <div className={card}>
      <div className="flex gap-2 overflow-x-auto">
        {(Object.keys(NAMES) as LevelId[]).map((l) => (
          <button key={l} onClick={() => setLevel(l)} className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold ring-1 ${level === l ? "bg-brand text-white ring-brand" : "text-white/80 ring-white/20"}`}>{NAMES[l]}</button>
        ))}
      </div>
      {!data ? (
        <Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin text-white/60" aria-label="Loading" />
      ) : data.rows.length === 0 ? (
        <p className="mt-6 text-center text-sm text-white/60">No scores yet this month. Be the first!</p>
      ) : (
        <ol className="mt-4 divide-y divide-white/10">
          {data.rows.map((r, i) => (
            <li key={i} className={`flex items-center gap-3 py-3 ${r.you ? "text-white" : "text-white/80"}`}>
              <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${r.rank === 1 ? "bg-amber-400/20 text-amber-200" : r.rank <= 3 ? "bg-white/10" : "bg-white/[.04]"}`}>{r.rank}</span>
              <span className="flex-1 font-medium">{r.name}{r.you && <span className="ml-2 text-xs text-sky">(you)</span>}</span>
              <span className="tabular-nums">{Math.round((r.correct / 20) * 100)}%</span>
            </li>
          ))}
        </ol>
      )}
      {data && data.yourRank && <p className="mt-3 text-center text-sm text-white/70">Your rank: #{data.yourRank} of {data.players}</p>}
    </div>
  );
}

// ───────── Home ─────────

function Profile({ me, onEdit }: { me: Me; onEdit: () => void }) {
  const origin = typeof location === "undefined" ? "" : location.origin;
  return (
    <div className="space-y-4">
      <div className={card}>
        <h3 className="font-semibold text-white">Badges</h3>
        {me.badges.length === 0 ? <p className="mt-2 text-sm text-white/60">Pass a level to earn your first badge.</p> : (
          <div className="mt-3 flex flex-wrap gap-2">
            {me.badges.map((b) => <span key={b.id} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${b.tier ? TIER_STYLE[b.tier] : "bg-sky/15 text-sky ring-sky/40"}`}><Medal className="h-4 w-4" aria-hidden />{b.label}</span>)}
          </div>
        )}
      </div>
      {me.prizes.length > 0 && (
        <div className={`${card} ring-amber-300/40`}>
          <h3 className="flex items-center gap-2 font-semibold text-white"><Gift className="h-5 w-5 text-amber-300" aria-hidden /> Your prizes</h3>
          <ul className="mt-3 space-y-3">
            {me.prizes.map((z) => (
              <li key={z.month + z.prize} className="rounded-xl bg-white/[.04] p-3 text-sm">
                <p className="font-semibold text-white">{PRIZE_NAMES[z.prize]}</p>
                {z.status === "won" && z.claimCode ? <p className="mt-1 text-white/80">Claim code: <span className="font-mono text-base font-bold text-amber-200">{z.claimCode}</span><br /><span className="text-xs text-white/55">Collect within 30 days with this code and a photo ID.</span></p> : <p className="mt-1 text-white/60">{z.status === "redeemed" ? "Collected" : "Cancelled"}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {me.referral && (
        <div className={card}>
          <h3 className="flex items-center gap-2 font-semibold text-white"><Users className="h-5 w-5 text-brand" aria-hidden /> Refer friends, get retries</h3>
          <p className="mt-1 text-sm text-white/70">Your code: <span className="font-mono font-bold text-white">{me.referral.code}</span> · Retries ready: <strong className="text-white">{me.referral.retriesLeft}</strong> · Friends who joined: {me.referral.qualified + me.referral.pending}</p>
          <p className="mt-1 text-xs text-white/50">A friend counts once they make a new account with their own mobile number and finish Beginner, on their own phone or Wi-Fi. Up to 3 retries a month.</p>
          <div className="mt-3"><ShareRow text="Royal Knowledge Challenge khelo aur free gym jeeto! Mera code use karo:" url={`${origin}/challenge?ref=${me.referral.code}`} /></div>
        </div>
      )}
      {me.attempts.length > 0 && (
        <div className={card}>
          <h3 className="font-semibold text-white">Your attempts</h3>
          <ul className="mt-2 divide-y divide-white/10 text-sm">
            {me.attempts.map((x, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2 text-white/80">
                <span>{NAMES[x.level]} · {x.month}</span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums font-semibold text-white">{x.pct}%</span>
                  {x.certificateCode && <Link prefetch={false} href={`/challenge/certificate/${x.certificateCode}`} className="text-sky hover:text-white">Certificate</Link>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button onClick={onEdit} className="text-sm font-semibold text-sky hover:text-white">Edit my details</button>
    </div>
  );
}

function EarnRetries({ me, onChange }: { me: Me; onChange: () => void }) {
  const [share, setShare] = useState<Share>(me.share);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const origin = typeof location === "undefined" ? "" : location.origin;
  return (
    <div className={`${card} space-y-5`}>
      <div>
        <h3 className="flex items-center gap-2 font-display text-lg text-white"><Gift className="h-5 w-5 text-amber-300" aria-hidden /> Get more attempts</h3>
        <p className="mt-1 text-sm text-white/65">Retries ready: <strong className="text-white">{me.referral?.retriesLeft ?? 0}</strong></p>
      </div>
      {me.referral && (
        <div>
          <p className="font-semibold text-white">1. Refer a friend: +1 attempt per friend</p>
          <p className="mt-1 text-sm text-white/65">Your friend signs up with your link (or code <span className="font-mono text-white">{me.referral.code}</span>) using their own mobile number and finishes the Beginner quiz. Up to 3 a month.</p>
          <div className="mt-2"><ShareRow text="Royal Knowledge Challenge khelo aur free gym jeeto! Mera link:" url={`${origin}/challenge?ref=${me.referral.code}`} /></div>
        </div>
      )}
      <div>
        <p className="font-semibold text-white">2. Watch and share our video: +1 attempt a month</p>
        <p className="mt-1 text-sm text-white/65">Watch the video, then share your link. When 5 different people open it on their own phones, you get an attempt.</p>
        {!share ? (
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              const r = await api<{ share?: Share }>({ action: "share" });
              setBusy(false);
              if (r.status !== 200 || !r.data.share) return setError(r.data.error || "Couldn't start. Try again.");
              setShare(r.data.share);
            }}
            className="btn-brand mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 font-semibold disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Start: watch the video
          </button>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
              <iframe src={`https://www.youtube-nocookie.com/embed/${share.videoId}?rel=0&modestbranding=1`} title="Royal Fitness Club video" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="absolute inset-0 h-full w-full border-0" />
            </div>
            {share.rewarded ? (
              <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-200">Done! 5 people opened your link and your attempt is ready. Next task opens next month.</p>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-white/75">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-amber-300" style={{ width: `${(share.visits / 5) * 100}%` }} /></div>
                  <span className="tabular-nums">{share.visits}/5 opened</span>
                </div>
                <ShareRow text="Ye Royal Fitness Club video zaroor dekho, kaam ki baatein hain:" url={`${origin}/challenge/v/${share.code}`} />
                <button onClick={onChange} className="text-xs font-semibold text-sky hover:text-white">Refresh count</button>
              </>
            )}
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      </div>
    </div>
  );
}

function Levels({ me, onStart, busy, error }: { me: Me; onStart: (l: LevelId) => void; busy: LevelId | null; error: string }) {
  const retries = me.referral?.retriesLeft ?? 0;
  return (
    <div className="space-y-3">
      {error && <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>}
      {me.levels.map((l) => {
        const waiting = l.nextFreeAt !== null;
        return (
          <div key={l.id} className={`${card} flex flex-col gap-3 sm:flex-row sm:items-center`}>
            <div className="flex-1">
              <h3 className="font-display text-xl text-white">{NAMES[l.id]}</h3>
              <p className="text-sm text-white/65">
                {!l.unlocked ? `Pass ${l.id === "intermediate" ? "Beginner" : "Intermediate"} to unlock.` : !l.open ? "Coming soon." : waiting ? `Free again on ${day(l.nextFreeAt!)}.${retries ? ` You have ${retries} retr${retries === 1 ? "y" : "ies"}.` : " Earn an attempt below to play sooner."}` : "20 questions · 30 seconds each"}
                {l.last?.pct != null && ` Last score: ${l.last.pct}%.`}
              </p>
            </div>
            {!l.unlocked ? (
              <span className="inline-flex items-center gap-1 text-sm text-white/50"><Lock className="h-4 w-4" aria-hidden /> Locked</span>
            ) : l.open && (!waiting || retries > 0) ? (
              <button onClick={() => onStart(l.id)} disabled={busy !== null} className="btn-brand inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 font-semibold disabled:opacity-60">
                {busy === l.id && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} {waiting ? "Use a retry" : "Start"}
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function ChallengeApp() {
  const [me, setMe] = useState<Me | null>(null);
  const [status, setStatus] = useState<"loading" | "signin" | "error" | "ready">("loading");
  const [tab, setTab] = useState<"play" | "me" | "ranks">(() => {
    if (typeof window === "undefined") return "play";
    const t = new URLSearchParams(window.location.search).get("tab");
    return t === "me" || t === "ranks" ? t : "play";
  });
  const [editing, setEditing] = useState(false);
  const [playing, setPlaying] = useState<Attempt | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState<LevelId | null>(null);
  const [error, setError] = useState("");

  const handle = useCallback((r: { status: number; data: Me & { error?: string } }) => {
    if (r.status === 401) return setStatus("signin");
    if (r.status !== 200) return setStatus("error");
    setMe(r.data);
    if (r.data.active && !r.data.active.finished) setPlaying(r.data.active);
    setStatus("ready");
  }, []);
  const load = useCallback(() => api<Me>().then(handle), [handle]);

  useEffect(() => {
    api<Me>().then(handle);
  }, [handle]);

  async function start(level: LevelId) {
    setBusy(level);
    setError("");
    const r = await api<{ attempt?: Attempt }>({ action: "start", level });
    setBusy(null);
    if (r.status !== 200 || !r.data.attempt) return setError(r.data.error || "Couldn't start. Please try again.");
    setResult(null);
    setPlaying(r.data.attempt);
  }

  if (status === "loading") return <Loader2 className="mx-auto mt-10 h-8 w-8 animate-spin text-white/60" aria-label="Loading" />;
  if (status === "error") return <p className="text-center text-white/70">The challenge isn&apos;t available right now. Please try again in a little while.</p>;
  if (status === "signin")
    return (
      <div className={`${card} mx-auto max-w-md`}>
        <h2 className="font-display text-xl text-white">Sign in to play</h2>
        <p className="mt-1 text-sm text-white/70">Your score, badges, certificate and prizes are saved to your account.</p>
        <div className="mt-4"><SignInOptions next="/challenge/play" /></div>
      </div>
    );
  if (!me) return null;
  if (!me.profile || editing)
    return (
      <div className="mx-auto max-w-lg">
        <ProfileForm name={me.name} initial={me.profile} onSaved={() => { setEditing(false); load(); }} />
      </div>
    );
  if (playing) return <Quiz start={playing} onDone={(r) => { setPlaying(null); setResult(r); load(); }} />;
  if (result) return <ResultView r={result} me={me} onBack={() => setResult(null)} />;

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-white/80">Namaste, <strong className="text-white">{me.profile.firstName}</strong>!</p>
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-white/[.04] p-1 ring-1 ring-white/10" role="tablist">
        {([["play", "Play"], ["me", "My profile"], ["ranks", "Ranks"]] as const).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`min-h-11 rounded-xl text-sm font-semibold ${tab === k ? "bg-brand text-white" : "text-white/75"}`}>{label}</button>
        ))}
      </div>
      <div className="mt-5">
        {tab === "play" && (
          <div className="space-y-5">
            <Levels me={me} onStart={start} busy={busy} error={error} />
            <EarnRetries key={me.share?.visits ?? -1} me={me} onChange={() => void load()} />
          </div>
        )}
        {tab === "me" && <Profile me={me} onEdit={() => setEditing(true)} />}
        {tab === "ranks" && <Ranks />}
      </div>
      <p className="mt-8 text-center text-xs text-white/45"><Link prefetch={false} href="/challenge#rules" className="underline">Rules and prizes</Link></p>
    </div>
  );
}
