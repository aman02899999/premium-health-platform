import { NextResponse, after } from "next/server";
import { isDbConfigured } from "@/health/db";
import { currentCustomer } from "@/lib/shop/server";
import { isSameOrigin } from "@/lib/same-origin";
import { siteFeed } from "@/lib/social/site-feed";
import { badgesFor } from "@/lib/challenge/badges";
import { toSalesFunnel } from "@/lib/challenge/automation";
import { LEVELS, QUESTIONS_PER_ATTEMPT, RETRY_DAYS, canStart, isLevel, scorePct, tierFor } from "@/lib/challenge/levels";
import { attemptsOf, current, decideReferral, getProfile, history, lastStarts, leaderboard, liveQuestions, prizesOf, referralStats, reveal, saveProfile, shareTask, startAttempt, submit, type Finished } from "@/lib/challenge/store";

// Royal Knowledge Challenge player API. Every answer is checked here, never in the browser.
// GET                                   the signed-in player's levels, profile and unfinished attempt
// POST { action: "profile", firstName, lastInitial, phone, area, leaderboard, contactConsent, ref }
// POST { action: "share" }              this month's watch-and-share task (5 people open the link → 1 retry)
// POST { action: "start", level }
// POST { action: "reveal", index }      show the 4 options of the current question
// POST { action: "answer", index, choice, tabSwitches }
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "private, no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

const START_ERRORS = {
  locked: [403, "Pehle neeche wala level pass karein."],
  wait: [409, "Ye level aap abhi khel chuke hain. 30 din baad phir khelein, ya ek dost ko refer karke turant retry paayein."],
  "other-open": [409, "Pehle apna chalu quiz poora karein."],
  "coming-soon": [409, "Ye level jaldi shuru hoga."],
  "too-many": [429, "Is network se aaj bahut attempts ho gaye. Kal try karein."],
} as const;

async function player() {
  if (!isDbConfigured) return { error: json({ error: "The challenge is temporarily unavailable." }, 503) };
  const c = await currentCustomer();
  if (!c) return { error: json({ error: "Please sign in to play." }, 401) };
  return { c };
}

async function result(userId: string, f: Finished) {
  const [board, hist] = await Promise.all([leaderboard(f.level, f.month, userId, 0), history(userId)]);
  return { correct: f.correct, total: QUESTIONS_PER_ATTEMPT, pct: scorePct(f.correct), tier: tierFor(f.correct), certificateCode: f.certificateCode, rank: board.yourRank, players: board.players, badges: badgesFor(hist), level: f.level, month: f.month };
}

export async function GET() {
  const g = await player();
  if (g.error) return g.error;
  const userId = g.c.id;
  const now = Date.now();
  const [profile, hist, attempts, live, active, starts, referral, prizes, share] = await Promise.all([getProfile(userId), history(userId), attemptsOf(userId), liveQuestions(), current(userId, now), lastStarts(userId), referralStats(userId), prizesOf(userId), shareTask(userId, null, "")]);
  const levels = LEVELS.map((l) => {
    const last = attempts.find((a) => a.level === l.id && a.finished);
    const startedAt = starts[l.id] ?? null;
    const nextFreeAt = startedAt !== null && startedAt + RETRY_DAYS * 86_400_000 > now ? startedAt + RETRY_DAYS * 86_400_000 : null;
    return {
      id: l.id,
      unlocked: canStart(l.id, hist),
      open: live.filter((q) => q.level === l.id).length >= QUESTIONS_PER_ATTEMPT,
      nextFreeAt,
      last: last ? { correct: last.correct, pct: last.correct === null ? null : scorePct(last.correct), certificateCode: last.certificateCode } : null,
    };
  });
  const mine = prizes.map((z) => ({ claimCode: z.status === "won" ? z.claimCode : null, month: z.month, prize: z.prize, status: z.status, level: z.level }));
  const done = attempts.filter((a) => a.finished).map((a) => ({ level: a.level, month: a.month, pct: a.correct === null ? null : scorePct(a.correct), tier: a.correct === null ? null : tierFor(a.correct), certificateCode: a.certificateCode }));
  return json({ name: g.c.name, profile, levels, active, badges: badgesFor(hist), referral, prizes: mine, attempts: done, share });
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const g = await player();
  if (g.error) return g.error;
  const userId = g.c.id;
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return json({ error: "Bad request" }, 400);

  if (b.action === "profile") {
    const firstName = clean(b.firstName, 40).replace(/[^\p{L} .'-]/gu, "");
    const lastInitial = clean(b.lastInitial, 1).replace(/[^\p{L}]/gu, "");
    const phone = clean(b.phone, 20).replace(/\D/g, "").slice(-10);
    if (firstName.length < 2) return json({ error: "Apna first name likhein." }, 400);
    if (!/^[6-9]\d{9}$/.test(phone)) return json({ error: "Sahi 10-digit mobile number likhein." }, 400);
    if (b.area !== "ncr" && b.area !== "outside") return json({ error: "Batayein aap Noida/NCR mein rehte hain ya bahar." }, 400);
    const ref = clean(b.ref, 10).toUpperCase();
    const err = await saveProfile(userId, g.c.email, { firstName, lastInitial, phone, area: b.area, leaderboard: b.leaderboard === true, contactConsent: b.contactConsent === true }, ref || undefined);
    if (err === "phone-taken") return json({ error: "Ye mobile number pehle se kisi aur account par hai. Ek number se ek hi account ban sakta hai." }, 409);
    return json({ ok: true });
  }

  if (b.action === "share") {
    // Watch-and-share: the newest Royal Fitness Club YouTube video, one task a month.
    if (!(await getProfile(userId))) return json({ error: "Pehle apni details bharein." }, 400);
    const video = (await siteFeed().catch(() => ({ long: [] as { youtubeId: string }[] }))).long[0]?.youtubeId ?? null;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const task = await shareTask(userId, video, ip);
    if (!task) return json({ error: "Video abhi available nahi hai. Thodi der baad try karein." }, 503);
    return json({ share: task });
  }

  if (b.action === "start") {
    if (!isLevel(b.level)) return json({ error: "Bad request" }, 400);
    if (!(await getProfile(userId))) return json({ error: "Pehle apni details bharein." }, 400);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const r = await startAttempt(userId, b.level, ip);
    if (!r.ok) return json({ error: START_ERRORS[r.error][1], code: r.error, nextFreeAt: r.nextFreeAt ?? null }, START_ERRORS[r.error][0]);
    return json({ attempt: r.view, via: r.via });
  }

  const index = Number(b.index);
  if (!Number.isInteger(index) || index < 0 || index >= QUESTIONS_PER_ATTEMPT) return json({ error: "Bad request" }, 400);
  let step;
  if (b.action === "reveal") step = await reveal(userId, index);
  else if (b.action === "answer") step = await submit(userId, index, Number(b.choice), Number(b.tabSwitches) || 0);
  else return json({ error: "Unknown action" }, 400);

  if (!step.view && !step.finished) return json({ error: "No quiz in progress.", code: "none" }, 404);
  if (step.finished) {
    const f = step.finished;
    after(() => toSalesFunnel(userId, f).catch((e: Error) => console.error("[challenge] funnel:", e.message)));
    after(() => decideReferral(userId).catch((e: Error) => console.error("[challenge] referral:", e.message)));
    return json({ attempt: step.view, result: await result(userId, f) });
  }
  // A late tap (time ran out) isn't an error for the player: the next question is already served.
  return json({ attempt: step.view, timedOut: step.error === "stale" && b.action === "answer" });
}
