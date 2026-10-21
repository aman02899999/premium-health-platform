// AI Agent: the pure half (settings, what it may answer, what it knows, the rules it follows and
// how its answer is checked). The Claude call and the database are agent.ts.
//
// The agent only ever answers from the facts below: the same content, plans-as-sold-today and
// diet plans the website shows, plus notes the desk writes in the admin. Anything else, or
// anything a person should handle (complaints, refunds, medical questions, a booking), it hands
// to a coach instead of guessing.
import type { OfferPlan } from "@/lib/offers";
import type { SiteContent } from "@/lib/content/types";
import { llmsTxt } from "@/lib/content/ai-facts";
import { DIET_PLANS } from "@/lib/growth/config";

export type AgentMode = "off" | "draft" | "auto";
export const MODES: { id: AgentMode; label: string; hint: string }[] = [
  { id: "off", label: "Off", hint: "No AI anywhere" },
  { id: "draft", label: "Drafts only", hint: "The ✨ AI draft button in Live chat writes a reply for the desk to check and send" },
  { id: "auto", label: "Auto-reply", hint: "Also answers customers' WhatsApp questions the keyword bot can't, and hands the rest to a coach" },
];

// Per million tokens, USD (Anthropic list prices), for the cost shown in the admin.
export const MODELS = [
  { id: "claude-opus-5-5", label: "Claude Opus 5.5", hint: "Most capable (default)", input: 4, cached: 0.2, output: 20 },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", hint: "About half the cost", input: 2, cached: 0.2, output: 10 },
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5", hint: "Fastest, about 1/40th of the cost", input: 0.1, cached: 0.01, output: 0.5 },
] as const;
export type AgentModel = (typeof MODELS)[number]["id"];
const isModel = (m: unknown): m is AgentModel => MODELS.some((x) => x.id === m);

export type AgentSettings = { mode: AgentMode; model: AgentModel; dailyCap: number; knowledge: string };
export const DEFAULT_SETTINGS: AgentSettings = { mode: "off", model: "claude-opus-5-5", dailyCap: 100, knowledge: "" };
export const MAX_KNOWLEDGE = 4000;
export const MAX_CAP = 1000;

/** Settings from the database or the admin form, with anything invalid replaced by the default. */
export function cleanSettings(raw: unknown): AgentSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const cap = Math.round(Number(r.dailyCap));
  return {
    mode: MODES.some((m) => m.id === r.mode) ? (r.mode as AgentMode) : DEFAULT_SETTINGS.mode,
    model: isModel(r.model) ? r.model : DEFAULT_SETTINGS.model,
    dailyCap: Number.isFinite(cap) && cap >= 0 ? Math.min(cap, MAX_CAP) : DEFAULT_SETTINGS.dailyCap,
    knowledge: typeof r.knowledge === "string" ? r.knowledge.replace(/\r\n/g, "\n").trim().slice(0, MAX_KNOWLEDGE) : "",
  };
}

// "ok", "thanks", "👍": nothing to answer, and the bot shouldn't have the last word on every message.
const ACK = /^(ok+|okay|okk+|k|kk|thanks?|thank\s*you|thanku|thnx|thx|ty|done|great|nice|cool|good|fine|sure|yes|no|ji|haan?|han|accha|achha|thik\s*hai|theek\s*hai|hmm+|👍|🙏|👌|😊|❤️|\s)+[!.\s🙏👍]*$/iu;

/** A typed message worth an AI answer: has words, and isn't just an acknowledgement. */
export function worthAnswering(text: string): boolean {
  const t = text.trim();
  if (t.length < 3 || !/\p{L}/u.test(t)) return false;
  return !ACK.test(t);
}

/** Everything the agent may say, as one document (built from what the site shows today). */
export function buildKnowledge(c: SiteContent, plans: OfferPlan[], siteUrl: string, extra: string): string {
  const diet = DIET_PLANS.map((d) => `- ${d.name}: ₹${d.priceRupees.toLocaleString("en-IN")} (${d.summary})`).join("\n");
  const faqs = c.faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n");
  const trainers = c.trainers.map((t) => `- ${t.name}, ${t.role}${t.specialties.length ? ` (${t.specialties.join(", ")})` : ""}`).join("\n");
  return [
    llmsTxt(c, plans, siteUrl).trim(),
    ``,
    `## Personal diet charts (online, delivered on WhatsApp; order at ${siteUrl}/diet-chart)`,
    diet,
    ``,
    trainers ? `## Trainers\n${trainers}\n` : "",
    c.planNote ? `## Note on plans\n${c.planNote}\n` : "",
    faqs ? `## More questions and answers from the website\n\n${faqs}\n` : "",
    extra.trim() ? `## Notes from the gym's desk (current, trust these)\n${extra.trim()}` : "",
  ]
    .filter((s) => s !== "")
    .join("\n");
}

/** The agent's standing instructions. Stable text, so it caches. */
export function systemPrompt(gym: string, coachPhone: string): string {
  return `You answer WhatsApp messages for ${gym}, a gym in Noida, India, on behalf of the desk. The customer is usually a prospective member or a member asking a quick question.

Answer only from the facts in the knowledge document. Prices, timings, offers, plan names and links must be exactly as written there. If the answer isn't in the facts, do not guess: say a coach will reply shortly, and set handoff to true.

Set handoff to true, with a short reason, when:
- the facts don't answer the question
- they want to book, reschedule or cancel something, or ask about their own membership, payment, refund or order
- it's a complaint, or they're upset
- they ask about a medical condition, injury, pregnancy, medicine or supplement dosage (give no medical advice; you may say herbs and supplements support, and never replace, a doctor's advice)
- they ask for a person, a call or a discount that isn't in the facts
- the message is abusive, off-topic, or you're unsure

Style:
- Reply in the customer's language and script: English, Hindi or Hinglish, as they wrote.
- Short, like a helpful person at the desk: 1 to 4 short lines, at most about 80 words. WhatsApp formatting only (*bold*), no headings, no markdown links (paste the plain URL).
- Answer the actual question first. If it helps, end with one next step from the facts (a link, or "Reply TRIAL for a free session").
- Never invent names, results, guarantees, reviews or numbers. Never promise a discount, a callback time or a refund.
- Never say you are an AI unless asked. If asked, say you're the gym's automated assistant and a coach also reads the chat.
- When handing off, reply with a short, warm line that a coach will reply soon, and that they can also call or WhatsApp ${coachPhone}.`;
}

/** The shape the agent must answer in (structured output). */
export const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string", description: "The WhatsApp message to send the customer." },
    handoff: { type: "boolean", description: "True when a person at the gym should take over this chat." },
    reason: { type: "string", description: "Why it was handed off, in a few words for the desk. Empty when not handed off." },
  },
  required: ["reply", "handoff", "reason"],
  additionalProperties: false,
} as const;

export type AgentAnswer = { reply: string; handoff: boolean; reason: string };

export const MAX_REPLY = 1200;

/** The agent's JSON, checked; null when it isn't usable. */
export function parseAnswer(text: string): AgentAnswer | null {
  let j: unknown;
  try {
    j = JSON.parse(text);
  } catch {
    return null;
  }
  const o = j as Partial<AgentAnswer>;
  if (!o || typeof o.reply !== "string" || typeof o.handoff !== "boolean") return null;
  const reply = o.reply.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!reply || reply.length > MAX_REPLY) return null;
  return { reply, handoff: o.handoff, reason: typeof o.reason === "string" ? o.reason.trim().slice(0, 200) : "" };
}

/**
 * Every automatic message carries the number a person answers (calls and the WhatsApp Business
 * app); a handed-off reply always does.
 */
export function withLiveLine(reply: string, phone: string, handoff: boolean): string {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (!handoff || !digits || reply.replace(/\D/g, "").includes(digits)) return reply;
  return `${reply}\n\n📞 Call / WhatsApp a coach: ${phone}`;
}

export type ChatTurn = { fromThem: boolean; body: string; by?: string };

/**
 * The recent conversation as one message for the agent: what was said before (oldest first),
 * then the message to answer. Our side is labelled so the agent doesn't repeat itself.
 */
export function conversationPrompt(history: ChatTurn[], question: string, name: string): string {
  const lines = history
    .filter((m) => m.body.trim())
    .slice(-12)
    .map((m) => `${m.fromThem ? "Customer" : m.by === "auto-reply" || m.by === "ai-agent" ? "Gym (automatic)" : "Gym"}: ${m.body.trim().slice(0, 600)}`);
  return [
    name ? `Customer's WhatsApp name: ${name.slice(0, 80)}` : "",
    lines.length ? `Earlier in this chat (oldest first):\n${lines.join("\n")}` : "This is the start of the chat.",
    ``,
    `Message to answer:\n${question.trim().slice(0, 1000)}`,
  ]
    .filter((s) => s !== "")
    .join("\n");
}

export type Usage = { input: number; cached: number; output: number };

/** Approximate cost of one answer, in USD. */
export function costUsd(model: string, u: Usage): number {
  const m = MODELS.find((x) => x.id === model) ?? MODELS[0];
  return (u.input * m.input + u.cached * m.cached + u.output * m.output) / 1_000_000;
}
