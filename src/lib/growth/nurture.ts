// Marketing emails for website leads, by what they asked about. Pure: the scheduler decides
// who is due; this decides what each email says. Every email has one clear next step and
// is sent only to people who ticked the marketing box (see marketing.ts).
import { DIET_PLANS } from "./config";
import { daysBetween, todayIST } from "./dates";
import type { Draft } from "./messages";

export type Interest = "diet" | "pt" | "membership";
export type NurtureLead = { id: string; name: string; email: string; interest: Interest; createdAt: string };
export type NurtureBiz = { name: string; phone: string; whatsapp: string; siteUrl: string; coach: string; membershipFrom?: number };

type Step = { day: number; subject: string; body: string; cta: { label: string; url: string } };

const first = (name: string) => name.trim().split(/\s+/)[0] || name;
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const wa = (biz: NurtureBiz, text: string) => `https://wa.me/${biz.whatsapp}?text=${encodeURIComponent(text)}`;

export function steps(interest: Interest, lead: NurtureLead, biz: NurtureBiz): Step[] {
  const n = first(lead.name);
  const three = DIET_PLANS.find((p) => p.id === "3m")!;
  const starter = DIET_PLANS.find((p) => p.id === "starter")!;
  const dietUrl = (plan: string) => `${biz.siteUrl}/diet-chart?plan=${plan}#order`;
  if (interest === "diet")
    return [
      {
        day: 0,
        subject: `${n}, here's how your personal diet plan works`,
        body: `Hi ${n},\n\nThanks for reaching out to ${biz.name} about a diet plan. Here's exactly what you get when ${biz.coach} builds your plan:\n\n• Body analysis from your measurements — BMI, body fat %, waist risk\n• Your daily calories and protein, worked out for your goal\n• A 7-day Indian diet chart in katori and roti measures — veg, egg or non-veg, your regional food\n• Calories and macros for every meal\n• A workout plan matched to your diet, with pre- and post-workout meals\n• Herbs and supplement guidance for any health condition\n• Grocery list, 12-week roadmap and habit tracker\n\nMost people choose the ${three.name}: your plan is updated every 2 weeks as your body changes, for ${inr(three.priceRupees)}.\n\nFill a 5-minute form, pay securely, and your plan reaches you on WhatsApp and email.`,
        cta: { label: `Start my plan — ${inr(three.priceRupees)}`, url: dietUrl("3m") },
      },
      {
        day: 2,
        subject: "Why most diet charts stop working after 3 weeks",
        body: `Hi ${n},\n\nA fixed diet chart works for a few weeks. Then your weight changes, your energy needs change, and the same chart stops working — that's when most people give up.\n\nThat's why the ${three.name} includes a check-in every 2 weeks: you send your weight and waist, and ${biz.coach} adjusts your calories, meals and workouts. Six updates over three months, so the plan keeps working.\n\nWe use the Indian Food Composition Tables (ICMR-NIN) for every food, so the numbers match what you actually eat.`,
        cta: { label: "See the plans", url: dietUrl("3m") },
      },
      {
        day: 5,
        subject: "Veg, egg or non-veg — your plan fits your kitchen",
        body: `Hi ${n},\n\nYou don't need special foods. Your plan is built from what your family already cooks — dal, roti, rice, sabzi, curd, paneer, eggs, chicken or fish — in amounts you can measure with a katori and a spoon.\n\nHave thyroid, PCOS, diabetes, high BP or acidity? Tell us in the form: the plan leaves out what doesn't suit you and adds herb and supplement guidance with safe doses. (It supports your treatment; it never replaces your doctor.)\n\nWant to try it first? The ${starter.name} is ${inr(starter.priceRupees)}.`,
        cta: { label: "Choose my plan", url: dietUrl("starter") },
      },
      {
        day: 9,
        subject: `${n}, shall we start your plan this week?`,
        body: `Hi ${n},\n\nJust checking in — your personal plan is one short form away. If you have a question first, reply to this email or message us on WhatsApp at ${biz.phone}.\n\nThis is the last email in this series.`,
        cta: { label: "Start my plan", url: dietUrl("3m") },
      },
    ];
  if (interest === "pt")
    return [
      {
        day: 0,
        subject: `${n}, personal training at ${biz.name}`,
        body: `Hi ${n},\n\nThanks for asking about personal training. With a personal trainer at ${biz.name} you get a programme built for your goal, form correction on every rep, and someone who makes sure you actually turn up.\n\nThe best first step is a free trial session: we check your goal, any injuries and your current fitness, then suggest the right plan. Reply with a day and time that suits you.`,
        cta: { label: "Book my free trial", url: wa(biz, `Hi, I'm ${n}. I'd like a free personal training trial.`) },
      },
      {
        day: 3,
        subject: "What happens in your first session",
        body: `Hi ${n},\n\nYour first session is simple: a short chat about your goal and health, a few movement checks, and a light workout so you feel how we train. No pressure to sign up on the day.\n\nPersonal training works best with a matching diet — ask your trainer about our personal diet plans too.`,
        cta: { label: "Pick a time on WhatsApp", url: wa(biz, `Hi, I'm ${n}. When can I come for a personal training trial?`) },
      },
      {
        day: 7,
        subject: `${n}, your free trial is still open`,
        body: `Hi ${n},\n\nYour free personal training trial is still waiting. Message us with a time, or call ${biz.phone}.\n\nThis is the last email in this series.`,
        cta: { label: "Book my free trial", url: wa(biz, `Hi, I'm ${n}. I'd like to book my free trial.`) },
      },
    ];
  return [
    {
      day: 0,
      subject: `${n}, your free trial at ${biz.name}`,
      body: `Hi ${n},\n\nThanks for contacting ${biz.name}. Your first session is free — come in, meet the trainers and try the equipment before you decide.\n\n${biz.membershipFrom ? `Membership starts at ${inr(biz.membershipFrom)} a month, and longer plans cost less per month. ` : ""}You can join online in two minutes.`,
      cta: { label: "See membership plans", url: `${biz.siteUrl}/membership` },
    },
    {
      day: 3,
      subject: "Train with a plan, not guesswork",
      body: `Hi ${n},\n\nMembers get trainer guidance on the floor, and you can add a personal diet plan made by ${biz.coach} for your body and goal. Most people see the biggest change when training and food work together.`,
      cta: { label: "Join online", url: `${biz.siteUrl}/membership` },
    },
    {
      day: 7,
      subject: `${n}, your free trial is still waiting`,
      body: `Hi ${n},\n\nJust a reminder that your free trial session at ${biz.name} is still open. Reply with a day that suits you or call ${biz.phone}.\n\nThis is the last email in this series.`,
      cta: { label: "Book my free trial", url: wa(biz, `Hi, I'm ${n}. I'd like to book my free trial.`) },
    },
  ];
}

/** Encodes the call-to-action in the stored body; the sender turns it into a button. */
export const CTA_RE = /\n\[\[CTA:([^|\]]+)\|([^\]]+)\]\]$/;

/** The email due today for a lead, if any (a missed day is caught up within 2 days). */
export function nurtureDrafts(today: string, leads: NurtureLead[], biz: NurtureBiz): Draft[] {
  const out: Draft[] = [];
  for (const l of leads) {
    const age = daysBetween(todayIST(new Date(l.createdAt)), today);
    for (const [i, s] of steps(l.interest, l, biz).entries()) {
      if (age < s.day || age > s.day + 2) continue;
      out.push({
        channel: "email",
        to: l.email.toLowerCase(),
        toName: l.name,
        kind: `nurture-${l.interest}-${i}`,
        subject: s.subject,
        body: `${s.body}\n[[CTA:${s.cta.label}|${s.cta.url}]]`,
        template: "",
        params: [],
        dedupeKey: `nurture-${l.interest}-${i}:${l.id}`,
      });
    }
  }
  return out;
}
