# Royal Knowledge Challenge Implementation Plan

> Executed natively in one session (owner is non-technical; 1 Dec launch).

**Goal:** `/challenge` monthly knowledge quiz with levels, server-side scoring, certificates, badges, leaderboard and capped prizes claimed at the gym.

**Architecture:** Pure rules in `src/lib/challenge/*` (levels, scoring, prizes, badges), a server-only question bank and a `pg` store, JSON API routes under `/api/challenge/*` and `/api/admin/challenge`, gym-themed pages under `(gym)/(site)/challenge`.

**Tech stack:** Next.js 16 App Router, `pg` pool from `@/health/db`, Supabase auth via `currentCustomer()`, vitest.

**Spec:** `docs/superpowers/specs/2026-11-28-knowledge-challenge-design.md`

## Global constraints
- No correct answers in any client bundle or API response before the attempt ends (bank is `server-only`).
- Prize worth from standard prices only: ₹5,000 / ₹2,000 / ₹1,999.
- Wording "Certificate of Achievement, Royal Fitness Club"; never "certified".
- No AdSense on `/challenge`. No model names. Health questions education-only, no doses.
- Never delete rows: prizes are voided, questions retired.

## Review focus
1. Answer posted after the time limit → counts wrong (server clock, not client).
2. Answer posted twice for the same index, or for a future index → rejected, score unchanged.
3. Second attempt same level same month (incl. race) → refused by unique key.
4. Advance attempted without a passed Intermediate → 403.
5. Fewer than 20 approved questions in a level → level shows "coming soon", start refused.

## Tasks
1. **Rules (`levels.ts`, `scoring.ts`, `prizes.ts`, `badges.ts`) + tests:** thresholds, `scorePct`, `tierFor(level, correct)`, `allocatePrizes(candidates, caps)` greedy by prize value with fall-through and NCR swap, `badgesFor(attempts)`.
2. **Question bank (`bank.ts`) + tests:** 60 per level, 4 options, one answer, explanation, source; validator test (ids unique, no "cure", no dose units).
3. **Migration `20261128120000_knowledge_challenge.sql`:** `challenge_profiles`, `challenge_question_reviews`, `challenge_attempts` (unique user/level/month), `challenge_answers`, `challenge_prizes`; RLS on, no policies.
4. **Store (`store.ts`) + attempt engine (`engine.ts`, pure, tested):** start (random draw + option shuffle), current question (no answer), answer (timer, index check), finish/expire.
5. **Player API + pages:** profile, start, answer, me, leaderboard, certificate verify + image.
6. **Admin:** question approve/retire, month view with flags, "Finalise month", redeem by claim code; hub link.
7. **Verify:** typecheck, lint, tests, build, 390 px browser check; draft PR.
