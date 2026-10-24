# What the admin can and can't edit (Phase 3, 24 Oct 2026)

Checked on a local copy with a throwaway database and the local admin password (no Supabase, no
messaging or payment keys). Every admin screen opened, and every tab and non-destructive button was
clicked: 17 screens, 0 JavaScript errors. An edit to the home hero headline in **Website → Home &
Hero → Save changes** showed on `/` straight away and was reverted the same way.

The only server errors came from things that need Supabase (Library file list, Diet Pro cloud
clients/foods). They are expected locally and do not happen on the live site.

## Editable from `/admin` today

Business info (name, address, phone, WhatsApp, email, hours), home hero and announcement, programs,
membership plans (standard prices), trainers, gallery, testimonials, member results, FAQs, gym blog
posts held in `site_content`, SEO and theme colours, shop products (`/admin/shop`), reviews, contacts,
campaigns and templates.

## Shown on the site but only changeable in code

| What | Where it lives | Why it matters |
|---|---|---|
| Festive offer: prices, bonus days, dates, banner, Female's Special plan | `src/lib/offers.ts` | Money. The owner can't change an offer price or end date without a developer |
| Diet chart plan prices | `src/lib/growth/config.ts` | Money |
| Library book prices (₹129 / ₹149 / ₹199 tiers) and the catalogue | `src/lib/library/catalog.ts` | Money |
| Health portal (`/health`, 300+ pages): diseases, herbs, medicines, guides, tools copy | `src/health/data/*` | Content. Needs a content system of its own; large job |
| Long-form bilingual posts | `content/blog/{en,hi}/*.md` | Content. Edited as files by design (validated in prebuild) |
| Page copy on the home page (marquee words, section text), `/why-royal-fitness` | page components | Copy only; facts (prices, phone, hours) already come from `site_content` |
| Portal card "5:30 AM–10 PM" chip | `src/components/portal/PortalScene.tsx` | Leaves out the midday break and Sunday closure; should read the admin hours |

## Recommendation

Move the three money items (offer, diet plan prices, library prices) into an admin "Offers &
prices" screen first. The server already quotes prices from one place for each path, so the change
is: read those values from `site_content` with the current code values as defaults, validate them on
save, and re-run `scripts/e2e/payments.mjs` (53 checks) to prove Razorpay still charges what the page
shows. Health portal editing is a separate, larger project.
