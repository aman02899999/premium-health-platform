// The timed attempt, as a pure state machine. The store loads the row, calls one of these with
// the server's clock, and saves what comes back, inside one transaction with the row locked.
//
// Flow per question (owner, 28 Nov): the question text shows first; the player taps "Show
// options" (or they appear by themselves after READ_SECONDS); four options appear; one tap
// locks the answer and the next question appears. The 30-second clock starts when the question
// text is first shown, so reading time counts too. Nothing here ever returns the right answer.
import { GRACE_SECONDS, QUESTIONS_PER_ATTEMPT, SECONDS_PER_QUESTION, type LevelId } from "./levels";

export const READ_SECONDS = 8;
const LIMIT_MS = (SECONDS_PER_QUESTION + GRACE_SECONDS) * 1000;

export type AnswerRecord = { questionId: string; chosen: number | null; correct: boolean; ms: number };

export type AttemptState = {
  id: string;
  level: LevelId;
  questionIds: string[];
  /** orders[i][displayPosition] = original option index. */
  orders: number[][];
  index: number;
  shownAt: number | null;
  optionsAt: number | null;
  answers: AnswerRecord[];
  startedAt: number;
  finishedAt: number | null;
  tabSwitches: number;
};

export type PublicQuestion = { questionId: string; prompt: string; options: string[] | null };
export type Bank = { prompt(id: string): string; options(id: string): string[]; answer(id: string): number };

/** Fisher–Yates with an injectable random source (tests pass a seeded one). */
export function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function newAttempt(id: string, level: LevelId, approvedIds: string[], now: number, rand: () => number = Math.random): AttemptState {
  if (approvedIds.length < QUESTIONS_PER_ATTEMPT) throw new Error("not-enough-questions");
  const questionIds = shuffle(approvedIds, rand).slice(0, QUESTIONS_PER_ATTEMPT);
  return { id, level, questionIds, orders: questionIds.map(() => shuffle([0, 1, 2, 3], rand)), index: 0, shownAt: null, optionsAt: null, answers: [], startedAt: now, finishedAt: null, tabSwitches: 0 };
}

export const correctCount = (s: AttemptState) => s.answers.filter((a) => a.correct).length;
export const totalMs = (s: AttemptState) => s.answers.reduce((n, a) => n + a.ms, 0);
export const deadline = (s: AttemptState) => (s.shownAt === null ? null : s.shownAt + SECONDS_PER_QUESTION * 1000);

function finishIfDone(s: AttemptState, now: number): AttemptState {
  return s.index >= s.questionIds.length && s.finishedAt === null ? { ...s, finishedAt: now } : s;
}

/** A question whose time ran out (the player left, or never answered) counts as wrong. */
export function applyTimeout(s: AttemptState, now: number): AttemptState {
  if (s.finishedAt !== null || s.shownAt === null || now <= s.shownAt + LIMIT_MS) return s;
  const miss: AnswerRecord = { questionId: s.questionIds[s.index], chosen: null, correct: false, ms: SECONDS_PER_QUESTION * 1000 };
  return finishIfDone({ ...s, answers: [...s.answers, miss], index: s.index + 1, shownAt: null, optionsAt: null }, now);
}

/** Abandoned for a day: everything left counts wrong and the attempt ends. */
export function expire(s: AttemptState, now: number): AttemptState {
  if (s.finishedAt !== null || now - s.startedAt < 24 * 3_600_000) return s;
  const rest = s.questionIds.slice(s.index).map((questionId) => ({ questionId, chosen: null, correct: false, ms: SECONDS_PER_QUESTION * 1000 }));
  return { ...s, answers: [...s.answers, ...rest], index: s.questionIds.length, shownAt: null, optionsAt: null, finishedAt: now };
}

function publicQuestion(s: AttemptState, bank: Bank, withOptions: boolean): PublicQuestion {
  const id = s.questionIds[s.index];
  const opts = bank.options(id);
  return { questionId: id, prompt: bank.prompt(id), options: withOptions ? s.orders[s.index].map((o) => opts[o]) : null };
}

/** The current question's text, starting its clock on first view. Options only once revealed. */
export function view(s0: AttemptState, now: number, bank: Bank): { state: AttemptState; question: PublicQuestion | null } {
  let s = applyTimeout(expire(s0, now), now);
  if (s.finishedAt !== null) return { state: s, question: null };
  if (s.shownAt === null) s = { ...s, shownAt: now, optionsAt: null };
  return { state: s, question: publicQuestion(s, bank, s.optionsAt !== null) };
}

export type EngineError = "finished" | "stale" | "not-revealed" | "bad-choice";

/** Shows the four options for the current question (in this attempt's shuffled order). */
export function reveal(s0: AttemptState, index: number, now: number, bank: Bank): { state: AttemptState; question: PublicQuestion | null; error?: EngineError } {
  const v = view(s0, now, bank);
  if (!v.question) return { ...v, error: "finished" };
  if (index !== v.state.index) return { ...v, error: "stale" };
  const s = v.state.optionsAt === null ? { ...v.state, optionsAt: now } : v.state;
  return { state: s, question: publicQuestion(s, bank, true) };
}

/** Locks one answer for the current question. One tap only: a repeat or out-of-order post is refused. */
export function answer(s0: AttemptState, index: number, choice: number, now: number, bank: Bank, tabSwitches = 0): { state: AttemptState; error?: EngineError } {
  let s = applyTimeout(expire(s0, now), now);
  if (s.finishedAt !== null) return { state: s, error: "finished" };
  if (index !== s.index || s.shownAt === null) return { state: s, error: "stale" };
  if (s.optionsAt === null) return { state: s, error: "not-revealed" };
  if (!Number.isInteger(choice) || choice < 0 || choice > 3) return { state: s, error: "bad-choice" };
  const id = s.questionIds[s.index];
  const original = s.orders[s.index][choice];
  const rec: AnswerRecord = { questionId: id, chosen: original, correct: original === bank.answer(id), ms: Math.min(now - s.shownAt, SECONDS_PER_QUESTION * 1000) };
  const switches = Math.max(0, Math.min(50, Math.floor(tabSwitches) || 0));
  s = { ...s, answers: [...s.answers, rec], index: s.index + 1, shownAt: null, optionsAt: null, tabSwitches: s.tabSwitches + switches };
  return { state: finishIfDone(s, now) };
}
