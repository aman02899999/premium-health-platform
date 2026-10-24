# Product marketing context: Royal Fitness Club

Document version: 1.0 (2026-10-24)

Every marketing skill in `.claude/skills/` reads this file first. It is a summary. When it
disagrees with the code, the code wins: prices in `src/lib/offers.ts` and the admin's plans,
copy in `src/lib/content/defaults.ts` and the `site_content` row, rules in `CLAUDE.md`.

## House rules (these override any skill's advice)

1. **No fake proof or urgency.** No invented reviews, testimonials, results, member counts,
   "only 3 spots left" or countdowns that reset. Real deadlines only (the festive offer ends
   31 Dec 2026). Testimonials and case studies come only from the admin, with consent.
2. **The rating is 4.7 from 303+ ratings on Justdial.** Always say "on Justdial". Never call
   them member reviews.
3. **Health claims (YMYL):** education only. Nothing cures anything or is "guaranteed". Herbs
   and Ayurveda *support*. No medicine doses. No before/after weight-loss promises.
4. **Two numbers.** 92668 40289 is the WhatsApp Cloud API number (bots, templates, broadcasts).
   88518 30081 is for calls and human chats; automated messages point people there.
5. **Consent.** Marketing WhatsApp, SMS and email go only to contacts who opted in, with an
   opt-out, inside the daily caps. Never test on real customers.
6. **No paid tools by default.** Skills mention paid APIs (image/video generators, ad
   platforms, ESPs). Ask the owner before signing up for or calling any of them.
7. **Voice.** Plain, warm, Hinglish where the site already uses it. Run all customer-facing
   copy through the `humanizer` skill.

## Product

- **Royal Fitness Club**: a fully air-conditioned neighbourhood gym in Gejha Village,
  Sector 93, Noida, open since 2019. Strength and cardio floor, personal training, fat-loss
  and muscle-gain programs, diet and nutrition guidance, women's fitness, morning and evening
  batches.
- **Royal Supplements Store**: supplements sold on the site.
- **Bharat Health Guide** (`/health`, Hindi at `/hi`): a free health portal with 300+ guides,
  tools and calculators, plus a premium tier. It earns from AdSense and brings in search
  traffic. Ads load only on `/health`, `/blog` and `/hi`.
- Also on the site: diet plans, a library of books, online join and payment (Razorpay).

## Founder

Aman Sharma, founder and head coach. Trains on the floor himself; the site gallery is his
physique photos.

## Location and hours

Main Road, near Gali No. 3, Gejha Village, Sector 93, Noida, Uttar Pradesh 201304.
Mon–Sat 5:30–11:00 AM and 4:00–10:00 PM. Sunday closed.

## Audience (inferred, not yet researched)

- People living or working within a few kilometres of Sector 93: Gejha, nearby sectors and
  societies. Mostly Hindi/Hinglish speakers, price-aware, comparing nearby gyms.
- Women looking for a comfortable gym (the Female's Special plan exists for them).
- Health portal readers across India searching health questions in English and Hindi.

Use `customer-research` before treating any of this as fact.

## Offer running now

Festive Offer, 8 Oct – 31 Dec 2026 (switches off by itself, see `src/lib/offers.ts`):
Monthly ₹1,500 + 5 days, Quarterly ₹4,000 + 10 days, Half-yearly ₹7,000 + 20 days,
Female's Special ₹7,000 (6 months + diet plan), Annual ₹14,000 = 14 months. Free diet
consultation on the plans. Couple prices stay standard.

## Channels

Website (https://www.royalfitnesclub.in), Instagram @royalfitness93_ (bio link `/ig`),
Facebook Page, WhatsApp Cloud API broadcasts and bots, email via Resend, Justdial and Google
Business Profile listings. Meta Pixel + Conversions API on the site.

## Known gaps (Oct 2026)

- No visit counts: Vercel Web Analytics is off.
- WhatsApp marketing sends were failing on Meta billing (error 131042).
- Email bounce rate was 26%; the list needs cleaning before more email campaigns.

## Changelog

- 1.0 (2026-10-24): first draft from `CLAUDE.md`, `src/lib/offers.ts` and
  `src/lib/content/defaults.ts`. Owner to review the audience section.
