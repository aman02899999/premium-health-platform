// Ready-to-paste automation for the WhatsApp Business app on the live number (calls and manual
// chat). The app can't be driven by the website, so its own tools do the automatic part: a
// greeting for new chats, an away message out of hours, and "/" quick replies for the questions
// the desk answers all day. Pure: every price and date comes from the plans the checkout charges,
// so the texts change when the offer changes. The admin re-copies them from the Social tab.
import type { OfferPlan } from "@/lib/offers";
import type { Business } from "@/lib/content/types";
import { formatTime, formatWhatsApp } from "@/lib/site";

export type KitText = { id: string; title: string; where: string; text: string };

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const date = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

export function businessAppKit(b: Pick<Business, "name" | "phone" | "whatsapp" | "address" | "hours" | "googleMapsUrl">, plans: OfferPlan[], siteUrl: string): KitText[] {
  const paid = plans.filter((p) => p.price > 0);
  const offer = paid.find((p) => p.offer)?.offer;
  const hours = b.hours.map((h) => `${h.label} ${formatTime(h.open)}–${formatTime(h.close)} (${h.days})`).join(", ");
  const fees = paid.map((p) => `• ${p.name}: ${inr(p.price)} (${p.offer?.gets ?? p.duration})`).join("\n");
  const offerLine = offer ? `🎉 ${offer.title} till ${date(offer.endsOn)}` : "";
  const join = `${siteUrl}/membership`;
  const bot = `wa.me/${b.whatsapp.replace(/\D/g, "")}`;
  const a = b.address;
  const lines = (...xs: (string | false)[]) => xs.filter((x) => x !== false).join("\n");

  return [
    {
      id: "greeting",
      title: "Greeting message",
      where: "Business tools → Greeting message → On → Send to: Everyone",
      text: lines(
        `Hi! 👋 Welcome to ${b.name}, Sector 93 Noida.`,
        offerLine && `\n${offerLine}:`,
        offer ? paid.filter((p) => p.offer).map((p) => `• ${p.name}: ${p.offer!.gets} for ${inr(p.price)}`).join("\n") : false,
        `\n✅ First session FREE`,
        `Join online: ${join}`,
        `\nA coach will reply here shortly. For instant fees, timings and diet plans, tap ${bot}`,
      ),
    },
    {
      id: "away",
      title: "Away message",
      where: "Business tools → Away message → On → Schedule: Outside of business hours",
      text: lines(
        `Thanks for messaging ${b.name}! We're closed right now.`,
        `🕐 ${hours}`,
        `\nWe'll reply as soon as we open. Meanwhile:`,
        `• Fees & offers: ${join}`,
        `• Instant answers 24×7: ${bot}`,
      ),
    },
    {
      id: "offer",
      title: "/offer",
      where: "Business tools → Quick replies → Add → Shortcut: offer",
      text: lines(
        offer ? `${offerLine} 🎉` : `Our membership plans 💪`,
        fees,
        `\nFirst session is FREE. Join online: ${join}`,
        `Or pay at the desk. Shall I book your free trial? Tell me a day and time.`,
      ),
    },
    {
      id: "fees",
      title: "/fees",
      where: "Quick replies → Shortcut: fees",
      text: lines(`Membership fees at ${b.name}:`, fees, offer ? `\n${offerLine}.` : false, `Details: ${join}`),
    },
    {
      id: "timing",
      title: "/timing",
      where: "Quick replies → Shortcut: timing",
      text: lines(`🕐 ${hours}`, `📍 ${a.street}, ${a.locality}, ${a.city} ${a.postalCode}`, b.googleMapsUrl ? `Map: ${b.googleMapsUrl}` : false),
    },
    {
      id: "trial",
      title: "/trial",
      where: "Quick replies → Shortcut: trial",
      text: lines(
        `Your first session is FREE 💪 A trainer checks your goal and fitness level and shows you the right workout.`,
        `🕐 ${hours}`,
        `Which day and time suit you?`,
      ),
    },
    {
      id: "diet",
      title: "/diet",
      where: "Quick replies → Shortcut: diet",
      text: lines(
        `Personal diet + workout plan by Coach Aman Sharma, made for your body, food and goal 🥗`,
        `Start with the 7-day trial plan for ₹49: ${siteUrl}/diet-chart?plan=trial#order`,
        `All plans: ${siteUrl}/diet-chart`,
      ),
    },
    {
      id: "renew",
      title: "/renew",
      where: "Quick replies → Shortcut: renew",
      text: lines(
        `Thanks for training with us! 🙏 Renew in one tap: ${join}`,
        offer ? `${offerLine}: ${paid.filter((p) => p.offer).map((p) => `${p.name} ${p.offer!.gets} for ${inr(p.price)}`).join(", ")}.` : false,
        `Or pay at the desk on your next visit.`,
      ),
    },
    {
      id: "number",
      title: "Your two numbers",
      where: "For staff: which number does what",
      text: lines(
        `${b.phone}: calls and personal chat (this WhatsApp Business app). Greeting, away message and quick replies above.`,
        `${formatWhatsApp(b.whatsapp)}: the website's WhatsApp button and all automatic messages (offers, receipts, renewals, instant replies). Every automatic message tells people to call or WhatsApp ${b.phone} for a person.`,
      ),
    },
  ];
}
