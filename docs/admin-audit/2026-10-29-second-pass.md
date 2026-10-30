# Admin panel audit, second pass (29 Oct 2026)

Scope: everything in `/admin`, `/health/admin` and all 34 `/api/admin` routes on `main` (cd60f6d), with
focus on (1) admin code changed since the first two passes (#149–#158: theme switch, library books,
members app; the blood report admin from #144; roles from #146) and (2) angles the first passes didn't
cover: consent records made by hand, deletes outside members and enquiries, file overwrites, CSV
exports, and error text. Evidence is the code and the tests on a local Postgres. The live admin needs
Google sign-in, so screens were not clicked.

The first passes (`2026-10-28.md`, `2026-10-28-deep.md`; PRs #138, #139, #145–#148) still hold; I
re-checked their fixes and they're still in place.

## The uncomfortable part first

1. **The Chats switch writes a false consent record.** In Chats, turning "Promotions" back on for a
   customer writes `marketing_contacts.source = 'whatsapp: start promotions'` with today's time,
   exactly as if the customer had typed START PROMOTIONS. The Opt-ins page then shows a consent
   that never happened, and with #159 it would also unlock offers for a register member. Any desk
   agent can do it.
2. **Deleting in the shop and in Diet Pro still erases.** #148 fixed members and enquiries, but
   products, categories, combos, blog posts and Diet Pro clients (with their health profile) are
   still hard-deleted.

## Findings

| # | Severity | Finding | Evidence | Fix |
|---|---|---|---|---|
| A1 | High | The Chats "Promotions" switch records the desk's change as the customer's own START PROMOTIONS consent | `setOptOut()` → `setPromotionsOptOut(…, false)` writes source `whatsapp: start promotions`; available to desk agents | PR #159: recorded as `admin: <email>`; doesn't count as a register member's agreement |
| A2 | Medium | Chats can send a marketing template (win-back, call follow-up) to a register member who hasn't agreed to offers | `sendManualTemplate()` sends directly, not through the outbox guard; checked opt-outs only | PR #159: those templates aren't offered for them |
| A3 | Medium | Shop delete (product, category, combo, post) and Diet Pro client delete are hard deletes | `delete from public.shop_*`; `diet_clients … .delete()` | PR: archive to `archived_records` first (same as #148) |
| A4 | Low | Uploading a library book PDF replaces the old file with no copy kept | `upload(…, { upsert: true })` | PR: copy the old file to `archive/` before replacing |
| A5 | Low | The Meta ads customer list CSV can carry a spreadsheet formula from a name typed on the website | `metaAudienceCsv()` quotes commas only; the Contacts export already neutralises `= + - @` | PR: same neutralising as Contacts |
| A6 | Low | Two Diet Pro plan routes still show raw storage error text | `growth/diet-plan` POST and Growth `diet-send` return `err.message` (storage HTTP text) | PR: log it, show a plain message (the known messages stay) |
| A7 | Owner decision | The Meta ads list includes people who tapped Stop promotions, unsubscribed, or are register reminders-only | `?export=` uses `recipients()` with no opt-out filter. "Current members" is also used as an exclusion list, where leaving people out would show them ads | Not changed. Decide: drop them from promotional exports only (needs a "for exclusion" export) |
| A8 | Low | When someone says START PROMOTIONS again, their earlier opt-out row is deleted, so the history of when they opted out is lost | `delete from whatsapp_optouts` | Note only. `marketing_contacts` keeps the latest consent time |

### Checked and fine

- Theme switch (#153): `look` is validated by `lookOf()`; colours go into React style props, which are escaped.
- Library upload: catalogue slug only, `%PDF-` bytes, 4 MB cap, private bucket. Review moderation checks the UUID.
- Media upload: real image bytes sniffed; SVG/HTML refused.
- Payment links from Chats: amount ₹1–₹5,00,000, purpose required, `created_by` recorded.
- Reel preview, USDA lookup, WhatsApp template creation: admin only, not open to desk agents; no user input reaches a URL host.
- Health admin pages call `requireAdmin` (manager+ since #146); `/admin` pages are behind the proxy role gate.
- Contacts CSV export neutralises formulas and needs manager+ (#146).

## Fix order

1. A1, A2: added to PR #159 (consent area, same change).
2. A3, A4: data safety PR (one migration widens `archived_records.kind`).
3. A5, A6: small fixes PR.
4. A7: waits for the owner.
