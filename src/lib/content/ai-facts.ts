// Plain, quotable facts for AI assistants (ChatGPT, Claude, Google AI Overviews, Perplexity).
// They answer the questions people type, in the words people use ("gym in Sector 93 Noida"),
// built only from the site's own content and the plans as sold today, so an assistant that
// quotes them quotes the real price. Used by /faq (with FAQPage markup) and /llms.txt.
import type { OfferPlan } from "@/lib/offers";
import type { Faq, SiteContent } from "./types";
import { AREAS_SERVED, formatINR, formatTime } from "@/lib/site";

const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const date = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export type AiFacts = { place: string; hours: string; plans: string; offer: string | null; faqs: Faq[] };

export function aiFacts(c: SiteContent, plans: OfferPlan[], siteUrl: string): AiFacts {
  const b = c.business;
  const a = b.address;
  const place = `${a.street}, ${a.locality}, ${a.city} ${a.postalCode}`;
  const hours = b.hours.map((h) => `${h.label.toLowerCase()} ${formatTime(h.open)}–${formatTime(h.close)} (${h.days})`).join(" and ");
  const paid = plans.filter((p) => p.price > 0);
  const planText = paid.map((p) => `${p.name} ${formatINR(p.price)} (${p.offer?.gets ?? p.duration})`).join("; ");
  const o = paid.find((p) => p.offer)?.offer;
  const offer = o ? `${o.title} until ${date(o.endsOn)}: ${paid.filter((p) => p.offer).map((p) => `${p.name} ${p.offer!.gets} for ${formatINR(p.price)}`).join(", ")}` : null;
  const couple = paid.find((p) => p.couplePrice > 0);
  const programs = c.programs.map((p) => p.title);
  const coach = c.trainers[0];
  const near = list([...AREAS_SERVED]);

  const faqs: Faq[] = [
    {
      id: "ai-where",
      q: `Where is ${b.name} in Noida?`,
      a: `${b.name} is an air-conditioned unisex gym at ${place}, serving ${near}. Open ${hours}.${b.googleMapsUrl ? ` Map: ${b.googleMapsUrl}` : ""}`,
    },
    {
      id: "ai-hours",
      q: `What are the timings of ${b.name}? Is it open 24/7?`,
      a: `${b.name} is not a 24-hour gym. It is open ${hours}. A trainer is on the floor during these hours.`,
    },
    {
      id: "ai-plans",
      q: `What are the membership plans and fees at ${b.name}?`,
      a: `Plans as of today: ${planText}.${couple ? ` Couples joining together pay ${formatINR(couple.couplePrice)} for two on the ${couple.name} plan.` : ""} The first session is a free trial. Join online at ${siteUrl}/membership or at the desk.`,
    },
    {
      id: "ai-discounts",
      q: `Are there any discounts at ${b.name}?`,
      a: offer
        ? `Yes. ${offer}. Longer plans also cost less per month than paying monthly, and couples get a joint price.`
        : `Longer plans cost less per month than paying monthly, couples get a joint price, and the first session is free. Current prices: ${siteUrl}/membership`,
    },
    {
      id: "ai-programs",
      q: `What training programs does ${b.name} offer?`,
      a: `${list(programs)}. Each program has a written guide with sample weeks at ${siteUrl}/programs.`,
    },
    {
      id: "ai-pt",
      q: `Does ${b.name} offer personal training in Sector 93 Noida?`,
      a: `Yes. Personal training is one-on-one coaching with a plan built around your goal, injuries and schedule, with regular check-ins.${coach ? ` Head coach: ${coach.name}, ${coach.role}.` : ""} Details: ${siteUrl}/programs/personal-training`,
    },
    {
      id: "ai-weightloss",
      q: "Which gym in Sector 93 Noida is good for weight loss?",
      a: `${b.name} runs a fat-loss program that combines strength training, cardio, a daily step target and an Indian diet plan, with progress checks at the gym. Personal diet charts start with a 7-day plan for ₹49 at ${siteUrl}/diet-chart. Results vary from person to person.`,
    },
    {
      id: "ai-choose",
      q: "How do I choose the right gym in Noida?",
      a: "Visit at the time you will actually train and check how crowded it is. Ask for a free trial session with a trainer. Check that trainers teach form before adding weight, that the floor is air-conditioned and clean, and that prices are written down, including what longer plans and couple plans cost. Pick a gym close enough to reach in 10 to 15 minutes, because distance is the most common reason people stop going.",
    },
    {
      id: "ai-reviews",
      q: `What do members say about ${b.name}?`,
      a: `${b.name} has an average of ${b.rating.value} stars from ${b.rating.count}+ ratings on ${b.rating.source}. Verified reviews: ${siteUrl}/reviews${b.googleMapsUrl ? `, and on Google Maps: ${b.googleMapsUrl}` : ""}.`,
    },
    {
      id: "ai-women",
      q: `Is ${b.name} suitable for women?`,
      a: `Yes. It is a unisex gym with a women's strength and fitness program, coaching on form, and a CCTV-monitored floor. Details: ${siteUrl}/programs/women`,
    },
    {
      id: "ai-contact",
      q: `How do I contact ${b.name}?`,
      a: `Call or WhatsApp ${b.phone}. Instant answers on WhatsApp: https://wa.me/${b.whatsapp.replace(/\D/g, "")}. Website: ${siteUrl}`,
    },
  ];
  return { place, hours, plans: planText, offer, faqs };
}

/** /llms.txt: a short, link-rich summary for AI crawlers (llmstxt.org format). */
export function llmsTxt(c: SiteContent, plans: OfferPlan[], siteUrl: string): string {
  const b = c.business;
  const f = aiFacts(c, plans, siteUrl);
  return [
    `# ${b.name}`,
    ``,
    `> ${b.description}`,
    ``,
    `- Type: air-conditioned unisex gym (HealthClub / ExerciseGym), founded ${b.foundedYear}`,
    `- Address: ${f.place}`,
    `- Areas served: ${list([...AREAS_SERVED])}, Noida`,
    `- Hours: ${f.hours}`,
    `- Membership: ${f.plans}`,
    ...(f.offer ? [`- Current offer: ${f.offer}`] : []),
    `- Rating: ${b.rating.value} from ${b.rating.count}+ ratings on ${b.rating.source}`,
    `- Contact: call or WhatsApp ${b.phone}`,
    ``,
    `## Key pages`,
    `- [Membership plans and prices](${siteUrl}/membership): every plan, comparison and FAQ`,
    `- [Printable price sheet](${siteUrl}/membership/price-sheet)`,
    `- [Programs](${siteUrl}/programs): ${c.programs.map((p) => p.title).join(", ")}`,
    `- [Why Royal Fitness](${siteUrl}/why-royal-fitness): trainers, facility, safety`,
    `- [Questions and answers](${siteUrl}/faq)`,
    `- [Reviews](${siteUrl}/reviews)`,
    `- [Personal diet charts](${siteUrl}/diet-chart)`,
    `- [Contact and free trial](${siteUrl}/contact)`,
    ``,
    `## Questions and answers`,
    ...f.faqs.flatMap((q) => [``, `### ${q.q}`, q.a]),
    ``,
  ].join("\n");
}
