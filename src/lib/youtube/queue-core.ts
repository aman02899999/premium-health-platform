// The Short queue: Shorts written outside the hand-checked bank (a viewer's comment question, a
// trend fact-check). The owner chose (17 Nov 2026) that drafts passing every automatic check post
// by themselves; a draft that fails a check, or that the AI skipped, waits in Admin for a person.
// YOUTUBE_QUEUE_AUTO=off sends every draft to Admin for approval instead. Pure, so it is tested
// without YouTube, the AI or the database.
import type { Short, Source, Verdict } from "./shorts-bank";
import { isTrustedSource } from "./trends";

export type QueueKind = "answer" | "trend";
export type QueueStatus = "draft" | "approved" | "used" | "rejected";

/** What the AI (or the owner, by hand) writes for a comment answer. */
export type AnswerDraft = {
  hook: string;
  question: string;
  answer: string;
  why: string;
  tips: [string, string];
  ask: string;
  topic: string;
  tags: string[];
  medical: boolean;
  /** Trend fact-checks only: the verdict and the trusted source behind it. */
  verdict?: Verdict;
  source?: Source;
};

// ---------- picking the comment ----------

export type Comment = { id: string; videoId: string; text: string; likes: number; replies: number; publishedAt: string; authorChannelId: string };

const QUESTION_WORDS = /\b(kya|kaise|kaisa|kitna|kitni|kitne|kab|kyu|kyun|kyon|kaun|konsa|kaunsa|kahan|should|how|what|when|which|why|can|is it|does|do i|will)\b/i;
const LINK_OR_CONTACT = /(https?:\/\/|www\.|\.com\b|@[\w.]+\.\w|\b\d{10}\b|\+91|whatsapp\s*(me|karo)|dm\s*me|subscribe\s*my|my\s*channel)/i;
// Insults and abuse in English and Hinglish: such a comment is never put on screen.
const ABUSE = /\b(fuck|shit|bitch|bastard|chutiya|chutiye|madarchod|behenchod|bhenchod|bc|mc|gandu|harami|kutta|kamina|saala|randi)\b/i;
// Questions a coach must not answer on a Short: they need a doctor who has seen the person.
const NEEDS_DOCTOR = /\b(dose|dosage|mg|tablet|tablets|medicine|dawai|dawa|steroid|steroids|injection|insulin|cancer|pregnan\w*|surgery|operation|report dikha|my report|meri report|test result)\b/i;

/** A real question someone else would also want answered, safe to show on screen. */
export function isUsableQuestion(c: Comment, ownChannelId: string): boolean {
  const t = c.text.replace(/\s+/g, " ").trim();
  if (c.authorChannelId && c.authorChannelId === ownChannelId) return false;
  if (t.length < 15 || t.length > 280) return false;
  if (!(t.includes("?") || QUESTION_WORDS.test(t))) return false;
  return !LINK_OR_CONTACT.test(t) && !ABUSE.test(t) && !NEEDS_DOCTOR.test(t);
}

/** The most-wanted unused question: likes and replies count most, newer comments get a small lift. */
export function pickQuestion(comments: Comment[], ownChannelId: string, used: Set<string>, now: Date): Comment | null {
  const day = 86_400_000;
  const score = (c: Comment) => c.likes * 3 + c.replies * 2 + Math.max(0, 14 - (now.getTime() - Date.parse(c.publishedAt)) / day) * 0.2;
  return comments.filter((c) => !used.has(c.id) && isUsableQuestion(c, ownChannelId)).sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id))[0] ?? null;
}

// ---------- checking a draft ----------

// The same promises the bank never makes: cures, guarantees, doses, quick fixes.
const BANNED = /\b(cure[sd]?|ilaaj|guarantee[d]?|guaranteed|pakka result|100%|\d+\s*(mg|mcg|iu|ml)\b|dose|dosage|steroid|miracle|chamatkar|jadu|overnight|ek hafte mein \d+ ?kg|\d+ ?kg in \d+ days?)/i;

const str = (v: unknown, min: number, max: number) => (typeof v === "string" && v.trim().length >= min && v.trim().length <= max ? v.replace(/\s+/g, " ").trim() : null);

/** Cleans a draft from the AI or the Admin form. Returns the reasons when it can't go on a Short. */
export function checkAnswerDraft(raw: unknown, kind: QueueKind = "answer"): { ok: true; draft: AnswerDraft } | { ok: false; errors: string[] } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: string[] = [];
  const need = (k: string, min: number, max: number) => {
    const v = str(r[k], min, max);
    if (v === null) errors.push(`${k}: ${min}–${max} characters`);
    return v ?? "";
  };
  const hook = need("hook", 8, 70);
  const question = need("question", 10, 160);
  const answer = need("answer", 10, 160);
  const why = need("why", 10, 180);
  const ask = need("ask", 8, 110);
  const topic = need("topic", 2, 40);
  const tipsRaw = Array.isArray(r.tips) ? r.tips : [];
  const tips = tipsRaw.map((t) => str(t, 10, 120)).filter((t): t is string => t !== null);
  if (tips.length < 2) errors.push("tips: two tips of 10–120 characters");
  const tags = (Array.isArray(r.tags) ? r.tags : []).map((t) => str(t, 2, 30)).filter((t): t is string => t !== null).slice(0, 5);
  if (tags.length < 2) errors.push("tags: at least two");
  const all = [hook, question, answer, why, ask, ...tips].join(" ");
  const banned = BANNED.exec(all);
  if (banned) errors.push(`says "${banned[0]}": no cures, guarantees, doses or quick-fix promises`);
  let verdict: Verdict | undefined;
  let source: Source | undefined;
  if (kind === "trend") {
    verdict = r.verdict === "SACH" || r.verdict === "JHOOTH" || r.verdict === "DEPENDS" ? r.verdict : undefined;
    if (!verdict) errors.push("verdict: SACH, JHOOTH or DEPENDS");
    const s = (r.source && typeof r.source === "object" ? r.source : {}) as Record<string, unknown>;
    const name = str(s.name, 3, 80);
    const url = typeof s.url === "string" ? s.url.trim() : "";
    if (!name || !isTrustedSource(url)) errors.push("source: a WHO, ICMR-NIN, NHS, CDC, NIH or similar page");
    else source = { name, url };
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, draft: { hook, question, answer, why, tips: [tips[0], tips[1]], ask, topic, tags, medical: r.medical === true, ...(verdict ? { verdict } : {}), ...(source ? { source } : {}) } };
}

/** The queue item as a Short the renderer already knows. Ids start with "q-" so they never clash with the bank. */
export function answerShort(itemId: string, d: AnswerDraft): Short {
  if (d.verdict && d.source) {
    // A trend fact-check plays as a "viral claim" Short: the claim, the verdict, the real reason.
    return { id: `q-${itemId.slice(0, 8)}`, format: "viral", topic: d.topic, hook: d.hook, tags: d.tags, medical: d.medical, claim: d.question, verdict: d.verdict, truth: d.answer, why: d.why, extra: { tips: d.tips, ask: d.ask }, cite: d.source };
  }
  return {
    id: `q-${itemId.slice(0, 8)}`,
    format: "answer",
    topic: d.topic,
    hook: d.hook,
    tags: d.tags,
    medical: d.medical,
    question: d.question,
    answer: d.answer,
    why: d.why,
    extra: { tips: d.tips, ask: d.ask },
  };
}

/** Music and photo index for a queue item: far past the bank and the Reels, so no tune repeats. */
export const QUEUE_INDEX_BASE = 6000;

/** Drafts that pass the checks post without a tap, unless YOUTUBE_QUEUE_AUTO=off. */
export const queueAutoApprove = (env: Record<string, string | undefined> = process.env) => env.YOUTUBE_QUEUE_AUTO !== "off";

/** The queue goes out in the midday slot, at most one a day, so the bank still sets the rhythm. */
export const QUEUE_SLOT = 2;

/** The reply under the viewer's comment once their answer Short is live. */
export function answerReply(url: string): string {
  return `Aapke sawaal ka jawab humne ek Short mein diya hai 👉 ${url}\nShukriya poochne ke liye! Aur sawaal ho toh comment karo 🙏`;
}

/** Sunday in India: the weekly comment-answer draft is written then. */
export const isAnswerDay = (now: Date) => new Date(now.getTime() + 5.5 * 3_600_000).getUTCDay() === 0;
