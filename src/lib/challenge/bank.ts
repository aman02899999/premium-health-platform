// The question bank as the rest of the challenge sees it. Server-only: right answers live here.
import "server-only";
import { createHash } from "crypto";
import { ADVANCE, BEGINNER, INTERMEDIATE, type Row } from "./bank-data";
import type { LevelId } from "./levels";

export type Question = { id: string; level: LevelId; topic: string; prompt: string; options: string[]; answer: number; why: string; source: string; custom: boolean };

const toQ = (level: LevelId) => (r: Row): Question => ({ id: r[0], level, topic: r[1], prompt: r[2], options: [...r[3]], answer: r[4], why: r[5], source: r[6], custom: false });

export const BUILT_IN: Question[] = [...BEGINNER.map(toQ("beginner")), ...INTERMEDIATE.map(toQ("intermediate")), ...ADVANCE.map(toQ("advance"))];

/** Ties an approval to the exact wording: change the question and it needs approving again. */
export function questionHash(q: Pick<Question, "prompt" | "options" | "answer">): string {
  return createHash("sha256").update(JSON.stringify([q.prompt, q.options, q.answer])).digest("hex");
}

/** Words a health quiz must never use (YMYL rules). */
export const BANNED = /\b(cure[sd]?|guarantee[sd]?|\d+\s?(mg|mcg|iu|tablets?|capsules?))\b/i;

/** Problems with a question an admin typed in, or null when it's fine. */
export function checkQuestion(q: { prompt: string; options: string[]; answer: number; why: string }): string | null {
  if (q.prompt.trim().length < 10 || q.prompt.length > 300) return "Write the question in 10–300 characters.";
  if (q.options.length !== 4 || q.options.some((o) => !o.trim() || o.length > 120)) return "Give exactly 4 options, each up to 120 characters.";
  if (new Set(q.options.map((o) => o.trim().toLowerCase())).size !== 4) return "The 4 options must all be different.";
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) return "Pick which option is right.";
  if (q.why.length > 300) return "Keep the explanation under 300 characters.";
  const text = [q.prompt, ...q.options, q.why].join(" ");
  // "No supplement can cure…" style teaching sentences are fine in the built-in bank, but an
  // admin-typed question gets the strict check.
  if (BANNED.test(text)) return "Health questions can't mention cures, guarantees or medicine doses.";
  return null;
}
