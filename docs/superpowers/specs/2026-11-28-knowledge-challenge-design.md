# Royal Knowledge Challenge: design

Owner-approved plan (28 Nov 2026): https://claude.ai/artifact/8BPuksZ4YUm2x4PwwSSWpr

## Intent
A monthly fitness knowledge quiz at `/challenge` that brings local people into the gym to collect a
prize, where a coach can convert them. Online visitors outside Noida/NCR get an online diet plan
instead of gym time. It must not depend on checkout (payments are being fixed elsewhere).

## Decided by the owner
- Levels Beginner → Intermediate → Advance, unlocked in order (pass the one below first).
- Pass = 70%. Prize ladder (one prize per person per month, the best they earned):
  - Advance: 90%+ 3 months gym (worth ₹5,000), 80–89% 1 month gym (₹2,000), 70–79% 1-month online diet plan (₹1,999).
  - Intermediate: 90%+ 1 month gym (₹2,000), 80–89% 15 days gym + free diet consultation, 70–79% 1-month online diet plan (₹1,999).
  - Beginner: 90%+ 7-day gym pass, 80–89% 3-day gym pass + free diet consultation, 70–79% badge + certificate.
- Monthly cap (smaller cap): 1 × 3-month, 3 × 1-month, 5 × 15-day, 15 diet plans. Ranked by score, then fastest total time.
- Login with the existing Google / email-code sign-in; phone and photo ID checked at the gym when a prize is collected.
- No step counter and no step prizes.
- Questions are reviewed by an admin only; only approved questions are ever served.
- Launch 1 Dec 2026. Daily tasks + gym check-in streak come in a second PR; promo videos after launch.

## My calls (builder)
- 20 questions per attempt, 30 s each (+3 s network grace), no going back; clean % thresholds (18/16/14).
- One attempt per level per calendar month (India time), enforced by a unique key.
- Answers are scored on the server; correct answers never reach the browser, and per-question
  right/wrong is not revealed (only the final score), so answer keys are slow to build.
- An abandoned attempt keeps its clock running; when it expires the unanswered questions count wrong.
- Beginner pass caps (not decided by the owner): 10 × 7-day passes, 20 × 3-day passes. Printed in the rules.
- Prizes are allocated when an admin presses "Finalise month" (after reviewing flags), not instantly,
  so ranking by score is fair. Winners see their claim code on `/challenge/me`.
- Outside NCR: gym prizes are swapped for the diet plan and compete for the diet-plan cap.
- Tab switches and many accounts on one network are flagged for the admin, never auto-banned.
- Certificate: "Certificate of Achievement, Royal Fitness Club", public verify page by code
  (first name + surname initial only).
- Leaderboard: per level per month, only people who opted in, first name + initial, signed-in viewers only.

## Non-goals
Phone OTP, step counting, cash prizes, instant prize award, AdSense on these pages.

## Later additions (owner, 28 Nov)

- **Read-first quiz:** the question shows first; "I'm ready, show the options" (or 8 s) reveals 4 shuffled options; one tap; 30 s per question counted from when the question appears.
- **Automation:** finished players who tick "you may contact me" become a website lead (source `challenge`) once a month; the daily cron finalises last month on the 1st, emails winners their claim code and sends the coach the list.
- **Attempts:** one attempt per level, and a free one again 30 days after the last start. Extra attempts come from a credits ledger (`challenge_credits`):
  - **Referral:** the friend signs up with the link or code, as a new profile with their own mobile number, finishes Beginner, and played from a different network. Each friend counts once; up to 3 credits a month (owner chose 3).
  - **Watch and share:** the player watches the newest YouTube video and shares their `/challenge/v/<code>` link. When 5 different networks (not the player's own) open it and stay 6 s, they get 1 credit. Once a month. The watch itself can't be verified; only the 5 opens are.
