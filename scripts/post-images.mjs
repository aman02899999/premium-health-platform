// SVG hero images and infographics for the long-form health posts (public/health/posts/<slug>/).
// Drawn from the data below, so nothing is copied or hotlinked. Every number shown in a chart
// must also appear, with its source, in the post itself.
//   node scripts/post-images.mjs          write every post's SVGs
//   node scripts/post-images.mjs <slug>   one post
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const FONT = "Inter, 'Noto Sans Devanagari', 'Segoe UI', Arial, sans-serif";

// Simple, recognisable line icons (24-unit grid), drawn in the theme colour.
const ICONS = {
  pen: "M4 20l4-1 10-10-3-3L5 16l-1 4zM14 6l3 3",
  plate: "M12 3a9 9 0 100 18 9 9 0 000-18zm0 4a5 5 0 100 10 5 5 0 000-10z",
  dumbbell: "M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12",
  heart: "M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z",
  drop: "M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z",
  lungs: "M12 4v8M12 12c-2 0-3-2-5-2-2.5 0-3 6-3 8 0 1.5 1 2 2 2 3 0 6-2 6-6M12 12c2 0 3-2 5-2 2.5 0 3 6 3 8 0 1.5-1 2-2 2-3 0-6-2-6-6",
  moon: "M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z",
  mask: "M3 9c3-1 6-2 9-2s6 1 9 2v3c0 4-5 7-9 7s-9-3-9-7V9zM3 10H1M23 10h-2",
  leaf: "M5 19c0-8 6-14 15-14 0 9-6 15-14 15M5 19l8-8",
  bowl: "M3 11h18a9 9 0 01-18 0zM8 7c0-1.5 1-2 1-3M12 7c0-1.5 1-2 1-3M16 7c0-1.5 1-2 1-3",
  label: "M4 4h9l7 7-9 9-7-7V4zM8 8h.01",
  brain: "M9 4a3 3 0 00-3 3 3 3 0 00-2 5 3 3 0 002 5 3 3 0 006 1V5a3 3 0 00-3-1zM15 4a3 3 0 013 3 3 3 0 012 5 3 3 0 01-2 5 3 3 0 01-6 1",
  clock: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2",
  phone: "M5 3h4l2 5-3 2a12 12 0 006 6l2-3 5 2v4a2 2 0 01-2 2A18 18 0 013 5a2 2 0 012-2z",
  check: "M4 12l5 5L20 6",
  alert: "M12 3l10 18H2L12 3zM12 10v5M12 18h.01",
  sun: "M12 7a5 5 0 100 10 5 5 0 000-10zM12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
  home: "M3 11l9-8 9 8v10H3V11zM9 21v-6h6v6",
  walk: "M13 4a2 2 0 100 4 2 2 0 000-4zM10 21l2-6 3 3v3M8 12l3-3 3 2 3 1M11 9l-1 5",
  pill: "M10 21a5 5 0 01-7-7l11-11a5 5 0 017 7L10 21zM8.5 8.5l7 7",
  scale: "M12 3v18M5 7h14M5 7l-3 6a3 3 0 006 0L5 7zM19 7l-3 6a3 3 0 006 0l-3-6",
  family: "M7 7a2 2 0 100-4 2 2 0 000 4zM17 7a2 2 0 100-4 2 2 0 000 4zM4 21v-8a3 3 0 016 0v8M14 21v-8a3 3 0 016 0v8",
  baby: "M12 4a3 3 0 100 6 3 3 0 000-6zM7 21l1-7h8l1 7M9 14l-3-2M15 14l3-2",
  screen: "M3 4h18v12H3zM8 20h8M12 16v4",
  cup: "M4 8h13v5a6 6 0 01-6 6H10a6 6 0 01-6-6V8zM17 9h2a2 2 0 010 4h-2M8 3v2M12 3v2",
};
const icon = (name, x, y, size, color) =>
  `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[name] ?? ICONS.check}"/></g>`;

/** Wraps text into lines of at most n characters. */
function wrap(text, n) {
  const out = [];
  let line = "";
  for (const w of String(text).split(/\s+/)) {
    if ((line + " " + w).trim().length > n) {
      if (line) out.push(line);
      line = w;
    } else line = (line + " " + w).trim();
  }
  if (line) out.push(line);
  return out;
}
const lines = (arr, x, y, size, color, weight = 400, lh = 1.25, anchor = "start") =>
  arr.map((l, i) => `<text x="${x}" y="${y + i * size * lh}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${esc(l)}</text>`).join("");

function hero({ theme, kicker, title, icons }) {
  const [a, b, accent] = theme;
  const t = wrap(title, 26);
  const ic = icons
    .map((name, i) => {
      const cx = 820 + (i % 2) * 190;
      const cy = 150 + Math.floor(i / 2) * 170;
      return `<circle cx="${cx}" cy="${cy}" r="72" fill="#ffffff" fill-opacity="0.12"/><circle cx="${cx}" cy="${cy}" r="58" fill="#ffffff" fill-opacity="0.92"/>${icon(name, cx - 30, cy - 30, 60, a)}`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
<pattern id="p" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="#ffffff" fill-opacity="0.10"/></pattern></defs>
<rect width="1200" height="630" fill="url(#g)"/><rect width="1200" height="630" fill="url(#p)"/>
<circle cx="1120" cy="560" r="260" fill="${accent}" fill-opacity="0.18"/><circle cx="60" cy="40" r="160" fill="#ffffff" fill-opacity="0.06"/>
<rect x="64" y="70" width="${kicker.length * 11 + 40}" height="40" rx="20" fill="${accent}"/>
${lines([kicker.toUpperCase()], 84, 97, 17, "#111827", 800)}
${lines(t, 64, 190, 54, "#ffffff", 900, 1.12)}
<rect x="64" y="${190 + t.length * 60 + 4}" width="120" height="8" rx="4" fill="${accent}"/>
${lines(["Bharat Health Guide · royalfitnesclub.in/health"], 64, 580, 20, "#ffffff", 600)}
${ic}
</svg>`;
}

// Infographics are drawn 640 wide in one column so text stays readable on a phone (~13 px at 360 px).
const W = 640;
const frame = (H, a, accent, title, subtitle, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
<rect width="${W}" height="${H}" rx="24" fill="#ffffff"/><rect width="${W}" height="10" fill="${a}"/><rect x="0" y="10" width="${W}" height="4" fill="${accent}"/>
${lines(wrap(title, 34), 28, 62, 30, "#0f172a", 900, 1.15)}
${lines(wrap(subtitle, 56), 28, 62 + wrap(title, 34).length * 34 + 6, 18, "#475569", 500, 1.3)}
${body}
</svg>`;
const headH = (title, subtitle) => 62 + wrap(title, 34).length * 34 + wrap(subtitle, 56).length * 24 + 24;

/** Cards: a titled list of 3–6 points with icons. */
function cards({ theme, title, subtitle, items }) {
  const [a, , accent] = theme;
  let y = headH(title, subtitle);
  const body = items
    .map((it) => {
      const head = wrap(it.head, 34);
      const text = wrap(it.text, 46);
      const h = 34 + head.length * 26 + text.length * 24;
      const tone = it.tone === "bad" ? "#fee2e2" : it.tone === "good" ? "#dcfce7" : "#f1f5f9";
      const stroke = it.tone === "bad" ? "#dc2626" : it.tone === "good" ? "#16a34a" : a;
      const out = `<rect x="24" y="${y}" width="${W - 48}" height="${h}" rx="18" fill="${tone}" stroke="${stroke}" stroke-opacity="0.35" stroke-width="2"/>
<circle cx="64" cy="${y + 40}" r="24" fill="#ffffff"/>${icon(it.icon, 50, y + 26, 28, stroke)}
${lines(head, 104, y + 38, 22, "#0f172a", 800, 1.18)}
${lines(text, 104, y + 38 + head.length * 26 + 2, 18, "#334155", 500, 1.33)}`;
      y += h + 14;
      return out;
    })
    .join("");
  return frame(y + 14, a, accent, title, subtitle, body);
}

/** Bars: labelled bars for a handful of cited values, label above each bar. */
function bars({ theme, title, subtitle, unit, max, items, note }) {
  const [a, , accent] = theme;
  let y = headH(title, subtitle);
  const barW = W - 56 - 110;
  const body = items
    .map((it) => {
      const label = wrap(it.label, 50);
      const w = Math.max(8, (it.value / max) * barW);
      const out = `${lines(label, 28, y + 20, 19, "#0f172a", 700, 1.2)}
<rect x="28" y="${y + label.length * 23 + 2}" width="${barW}" height="30" rx="15" fill="#f1f5f9"/>
<rect x="28" y="${y + label.length * 23 + 2}" width="${w}" height="30" rx="15" fill="${it.highlight ? accent : a}"/>
${lines([`${it.value}${unit}`], 28 + barW + 12, y + label.length * 23 + 25, 20, "#0f172a", 800)}`;
      y += label.length * 23 + 48;
      return out;
    })
    .join("");
  const n = wrap(note, 70);
  return frame(y + n.length * 21 + 26, a, accent, title, subtitle, body + lines(n, 28, y + 16, 15, "#64748b", 500, 1.35));
}

/** Bands: a coloured scale (for example AQI bands) with what to do in each. */
function bands({ theme, title, subtitle, items, note }) {
  const [a, , accent] = theme;
  let y = headH(title, subtitle);
  const body = items
    .map((it) => {
      const text = wrap(it.text, 38);
      const h = Math.max(78, 22 + text.length * 24);
      const out = `<rect x="24" y="${y}" width="170" height="${h}" rx="16" fill="${it.color}"/>
${lines([it.range], 109, y + h / 2 - 2, 22, it.dark ? "#ffffff" : "#111827", 900, 1, "middle")}
${lines([it.name], 109, y + h / 2 + 22, 15, it.dark ? "#ffffff" : "#111827", 700, 1, "middle")}
${lines(text, 210, y + 30, 18, "#1e293b", 500, 1.33)}`;
      y += h + 12;
      return out;
    })
    .join("");
  const n = wrap(note, 70);
  return frame(y + n.length * 21 + 26, a, accent, title, subtitle, body + lines(n, 28, y + 16, 15, "#64748b", 500, 1.35));
}

const RENDER = { hero, cards, bars, bands };

// Theme: [primary, secondary, accent]
export const SPECS = {
  "work-stress-burnout-india": {
    theme: ["#312e81", "#6d28d9", "#5eead4"],
    hero: { kicker: "Mental wellness · work", title: "Work stress and burnout: the signs and the way out", icons: ["brain", "clock", "phone", "walk"] },
    "inline-1": {
      type: "cards",
      title: "Stress, burnout or depression?",
      subtitle: "They overlap. If symptoms spill into all of life, or you feel hopeless, get help.",
      items: [
        { icon: "clock", head: "Stress: 'too much'", text: "Urgency, tension, racing thoughts. Usually eases when pressure passes or after rest" },
        { icon: "brain", head: "Burnout: 'not enough'", text: "Drained, detached, cynical about work, doing worse despite trying. A weekend doesn't fix it" },
        { icon: "alert", head: "Depression: all of life", text: "Low mood or lost interest most days for 2+ weeks, with sleep, appetite or self-worth changes", tone: "bad" },
        { icon: "phone", head: "Get help now", text: "Thoughts of self-harm: Tele-MANAS 14416 or 112, and tell someone you trust", tone: "bad" },
      ],
    },
    "inline-2": {
      type: "cards",
      title: "Warning signs of burnout",
      subtitle: "Look for patterns over weeks, not one bad day.",
      items: [
        { icon: "moon", head: "Body", text: "Exhaustion sleep doesn't fix, headaches, stomach upsets, poor sleep, more caffeine or alcohol" },
        { icon: "brain", head: "Mind", text: "Sunday-night dread, cynicism, numbness, poor concentration, more mistakes" },
        { icon: "family", head: "Behaviour", text: "Withdrawing from people, procrastinating then working late, dropping exercise and hobbies" },
      ],
    },
  },
  "ultra-processed-food-india-labels": {
    theme: ["#7c2d12", "#c2410c", "#fde047"],
    hero: { kicker: "Nutrition · food labels", title: "Ultra-processed food in India: read the label, swap the habit", icons: ["label", "check", "plate", "cup"] },
    "inline-1": {
      type: "cards",
      title: "The 30-second label check",
      subtitle: "Turn the pack around. The ingredient list and per-100 g table tell the real story.",
      items: [
        { icon: "alert", head: "Ignore the front", text: "Healthy, multigrain, natural, baked not fried: these are marketing words", tone: "bad" },
        { icon: "label", head: "Read the first three ingredients", text: "Sugar, maida or oil among them means the food is built on them" },
        { icon: "drop", head: "Count the names for sugar", text: "Invert syrup, liquid glucose, maltodextrin, dextrose, malt extract… two or more is a warning" },
        { icon: "scale", head: "Check per 100 g", text: "UK yardstick: over 22.5 g sugar, 1.5 g salt or 5 g saturated fat is high" },
      ],
    },
    "inline-2": {
      type: "cards",
      title: "Swap the daily habits first",
      subtitle: "Keep packaged treats for occasions; change what you eat every day.",
      items: [
        { icon: "cup", head: "Sugary drinks", text: "Water, unsweetened buttermilk, nimbu pani with little or no sugar", tone: "good" },
        { icon: "bowl", head: "Cream biscuits with chai", text: "Roasted chana, peanuts, nuts, fruit or a besan chilla", tone: "good" },
        { icon: "leaf", head: "Chips and namkeen", text: "Roasted makhana, sprouts chaat, homemade murmura bhel", tone: "good" },
        { icon: "plate", head: "Instant noodles", text: "Vegetable poha, upma, dalia, khichdi or egg bhurji with roti", tone: "good" },
      ],
    },
  },
  "indian-fermented-foods-gut-health": {
    theme: ["#78350f", "#b45309", "#a3e635"],
    hero: { kicker: "Nutrition · gut health", title: "Indian fermented foods: what the evidence really says", icons: ["bowl", "leaf", "drop", "check"] },
    "inline-1": {
      type: "cards",
      title: "Indian fermented foods at a glance",
      subtitle: "Fermented doesn't always mean live microbes, and live microbes don't always mean probiotic.",
      items: [
        { icon: "bowl", head: "Curd and buttermilk", text: "Live cultures when fresh; also protein, calcium and B12", tone: "good" },
        { icon: "plate", head: "Idli, dosa, dhokla", text: "Fermented, then cooked: few live microbes, but easier to digest", tone: "good" },
        { icon: "drop", head: "Kanji", text: "May contain live microbes; little research; salty, so small glasses" },
        { icon: "alert", head: "Pickles", text: "Often high in salt. A spoonful for flavour, not a health food", tone: "bad" },
      ],
    },
    "inline-2": {
      type: "cards",
      title: "Feed the bacteria you already have",
      subtitle: "Fibre is food for gut bacteria. Variety across the week matters as much as amount.",
      items: [
        { icon: "bowl", head: "A pulse every day", text: "Dal, chana, rajma, lobia or moong in at least one meal" },
        { icon: "leaf", head: "One more vegetable", text: "Add an extra vegetable to lunch and dinner; keep skins where you can" },
        { icon: "plate", head: "Whole grains and millets", text: "Whole-wheat or mixed atta; millets instead of white rice a few times a week" },
        { icon: "sun", head: "Whole fruit, some seeds", text: "Fruit over juice; a little soaked chia, flax or sabja now and then" },
      ],
    },
  },
  "muscle-after-40-sarcopenia-india": {
    theme: ["#14532d", "#15803d", "#facc15"],
    hero: { kicker: "Fitness & healthy ageing", title: "Muscle after 40: test it, feed it, train it", icons: ["dumbbell", "walk", "plate", "clock"] },
    "inline-1": {
      type: "cards",
      title: "Three checks for muscle and function",
      subtitle: "Cut-offs from the Asian Working Group for Sarcopenia (2019). Screening only: talk to your doctor about low results.",
      items: [
        { icon: "check", head: "Grip strength", text: "Low if under 28 kg for men or under 18 kg for women (hand dynamometer)" },
        { icon: "clock", head: "Five chair stands", text: "Low if it takes 12 seconds or more, arms crossed, no hands" },
        { icon: "walk", head: "6-metre walking speed", text: "Low if slower than 1.0 metre per second (over 6 seconds for 6 metres)" },
      ],
    },
    "inline-2": {
      type: "cards",
      title: "Protein at every meal",
      subtitle: "Typical Indian days are light on protein at breakfast and dinner. Fix those two meals first.",
      items: [
        { icon: "sun", head: "Breakfast", text: "Besan or moong chilla, paneer or egg bhurji, curd with nuts, sprouts poha" },
        { icon: "bowl", head: "Lunch", text: "Thick dal plus curd or buttermilk; chana, rajma, paneer, soya or chicken" },
        { icon: "leaf", head: "Evening snack", text: "Roasted chana, milk or buttermilk, sprouts chaat, peanuts, a boiled egg" },
        { icon: "moon", head: "Dinner", text: "Dal plus paneer, tofu, soya, egg, fish or chicken; fewer rotis, more vegetables" },
      ],
    },
  },
  "sleep-guide-indians": {
    theme: ["#1e1b4b", "#3730a3", "#fbbf24"],
    hero: { kicker: "Sleep & mind", title: "Sleep for Indians: screens, chai, shifts and snoring", icons: ["moon", "clock", "screen", "cup"] },
    "inline-1": {
      type: "cards",
      title: "Seven sleep thieves in Indian homes",
      subtitle: "Most people have two or three. Fix the biggest one first.",
      items: [
        { icon: "cup", head: "Late chai or coffee", text: "Caffeine lasts for hours; try a 2 pm cut-off", tone: "bad" },
        { icon: "screen", head: "Phone in bed", text: "Light and scrolling delay sleep; screens away an hour before", tone: "bad" },
        { icon: "plate", head: "Late, heavy dinner", text: "Finish two to three hours before bed, and keep it lighter", tone: "bad" },
        { icon: "clock", head: "Wake time all over the place", text: "One wake-up time, seven days a week", tone: "bad" },
        { icon: "home", head: "Hot, bright, noisy room", text: "Curtains or eye mask, earplugs or steady fan, cooler room", tone: "bad" },
        { icon: "moon", head: "Night shifts, untreated snoring", text: "Protect day sleep; get loud snoring with pauses checked", tone: "bad" },
      ],
    },
    "inline-2": {
      type: "cards",
      title: "Sleep apnoea red flags",
      subtitle: "If several of these apply, tell your doctor. Only a sleep study can confirm it.",
      items: [
        { icon: "alert", head: "Loud snoring most nights", text: "Especially with pauses in breathing that others notice", tone: "bad" },
        { icon: "lungs", head: "Choking or gasping at night", text: "Waking up short of breath, or a dry mouth and headache in the morning", tone: "bad" },
        { icon: "moon", head: "Sleepy in the daytime", text: "Dozing off while reading, watching TV or, worst of all, driving", tone: "bad" },
        { icon: "heart", head: "High blood pressure", text: "Especially if hard to control despite medicines", tone: "bad" },
        { icon: "scale", head: "Large neck or belly", text: "Extra weight around the neck and waist narrows the airway" },
      ],
    },
  },
  "air-pollution-aqi-action-plan": {
    theme: ["#334155", "#475569", "#f59e0b"],
    hero: { kicker: "Environmental health · AQI", title: "Air pollution and your body: an AQI action plan", icons: ["lungs", "mask", "home", "sun"] },
    "inline-1": {
      type: "bands",
      title: "AQI bands and what to do",
      subtitle: "CPCB's National Air Quality Index categories, with a simple plan for each.",
      items: [
        { range: "0–50", name: "Good", color: "#16a34a", dark: true, text: "Normal plans. Outdoor exercise is fine." },
        { range: "51–100", name: "Satisfactory", color: "#84cc16", text: "Fine for most. Sensitive people note any symptoms." },
        { range: "101–200", name: "Moderate", color: "#facc15", text: "People with lung or heart disease, children and older adults shorten outdoor exertion." },
        { range: "201–300", name: "Poor", color: "#f97316", text: "Move workouts indoors. Mask outdoors for everyone." },
        { range: "301–400", name: "Very Poor", color: "#dc2626", dark: true, text: "Limit time outside, run a purifier, keep windows shut at peaks." },
        { range: "401–500", name: "Severe", color: "#7f1d1d", dark: true, text: "Stay indoors where possible. Keep medicines ready, watch symptoms." },
      ],
      note: "Bands: Central Pollution Control Board, National Air Quality Index. Actions are general guidance; follow your doctor's plan if you have a health condition.",
    },
    "inline-2": {
      type: "cards",
      title: "Cleaner air at home",
      subtitle: "Remove indoor smoke first, then filter what comes in. Start with the bedroom.",
      items: [
        { icon: "alert", head: "No agarbatti or coils", text: "Use electric mosquito repellents; keep incense brief and ventilated", tone: "bad" },
        { icon: "home", head: "Exhaust on every time", text: "Frying and tadka release fine particles; close the kitchen door", tone: "good" },
        { icon: "lungs", head: "HEPA in the bedroom", text: "Sized for the room (check CADR), doors and windows shut, filter changed on time", tone: "good" },
        { icon: "clock", head: "Air out at the right time", text: "Often afternoon in winter, briefly, when outdoor AQI dips", tone: "good" },
        { icon: "leaf", head: "Plants won't do it", text: "Pleasant, but they don't meaningfully clean a home's air" },
      ],
    },
  },
  "heart-attack-under-40-india": {
    theme: ["#881337", "#be123c", "#fcd34d"],
    hero: { kicker: "Heart health · under 40", title: "Heart attacks in young Indians: test early, train safely", icons: ["heart", "drop", "dumbbell", "family"] },
    "inline-1": {
      type: "cards",
      title: "Your heart risk: fixed vs changeable",
      subtitle: "You can't change your genes, but a high inherited risk makes the changeable ones matter more.",
      items: [
        { icon: "family", head: "Can't change: family history", text: "Heart disease in a father or brother before 55, or a mother or sister before 65", tone: "bad" },
        { icon: "drop", head: "Can't change: Lp(a)", text: "Mostly set by genes. Often tested once in a lifetime", tone: "bad" },
        { icon: "alert", head: "Change: tobacco", text: "Cigarettes, bidis, hookah, gutka, khaini: quitting is the biggest win", tone: "good" },
        { icon: "heart", head: "Change: LDL, BP, sugar", text: "Know the numbers and treat them with your doctor", tone: "good" },
        { icon: "scale", head: "Change: waist", text: "Belly fat matters more than weight alone for Indians", tone: "good" },
        { icon: "moon", head: "Change: sleep and stress", text: "Seven hours or more; check loud snoring", tone: "good" },
      ],
    },
    "inline-2": {
      type: "cards",
      title: "Train hard, keep your heart safe",
      subtitle: "Stop and get checked for the warning signs. Build the habits on every session.",
      items: [
        { icon: "alert", head: "Stop: chest pressure", text: "Chest pain or tightness on exertion that doesn't settle quickly with rest", tone: "bad" },
        { icon: "alert", head: "Stop: fainting or near-fainting", text: "Or sudden breathlessness, or a racing irregular heartbeat", tone: "bad" },
        { icon: "clock", head: "Warm up 5–10 minutes", text: "No maximal effort from cold. Cool down gradually", tone: "good" },
        { icon: "pill", head: "No steroids or stimulant stacks", text: "Avoid anabolic steroids and caffeine-heavy pre-workouts with energy drinks", tone: "good" },
      ],
    },
  },
  "anemia-mukt-bharat-home-guide": {
    theme: ["#7f1d1d", "#b91c1c", "#fbbf24"],
    hero: { kicker: "Women's & family health", title: "Anaemia in India: why iron tablets fail, and what works", icons: ["drop", "pill", "leaf", "family"] },
    "inline-1": {
      type: "bars",
      title: "Anaemia in India (NFHS-5, 2019–21)",
      subtitle: "Share of each group with anaemia",
      unit: "%",
      max: 100,
      items: [
        { label: "Children 6–59 months", value: 67.1, highlight: true },
        { label: "Adolescent girls 15–19", value: 59.1 },
        { label: "Women 15–49", value: 57 },
        { label: "Men 15–49", value: 25 },
      ],
      note: "Source: National Family Health Survey (NFHS-5) 2019–21, India fact sheet, Ministry of Health and Family Welfare.",
    },
    "inline-2": {
      type: "cards",
      title: "Seven reasons iron tablets fail",
      subtitle: "Check each one with your doctor before deciding iron 'doesn't work' for you.",
      items: [
        { icon: "drop", head: "Not (only) iron", text: "B12, folate, thalassaemia trait or a chronic illness", tone: "bad" },
        { icon: "cup", head: "Taken with chai or milk", text: "Tea, coffee and calcium cut iron absorption", tone: "bad" },
        { icon: "clock", head: "Stopped too early", text: "Hb rises first; iron stores take much longer" },
        { icon: "alert", head: "Blood still leaking", text: "Heavy periods, piles, ulcers, frequent donation", tone: "bad" },
        { icon: "leaf", head: "Worms", text: "Deworming as advised, especially for children" },
        { icon: "pill", head: "Poor absorption or side effects", text: "Gut conditions, acid medicines, skipped doses" },
      ],
    },
  },
  "generic-semaglutide-india-guide": {
    theme: ["#0f4c5c", "#1b7f79", "#f4b942"],
    hero: { kicker: "Weight & metabolism · 2026", title: "Generic semaglutide in India: medicine, food and muscle together", icons: ["pen", "plate", "dumbbell", "heart"] },
    "inline-1": {
      type: "cards",
      title: "Is semaglutide meant for you?",
      subtitle: "A starting point for a conversation with your doctor, not a self-test.",
      items: [
        { icon: "drop", head: "Type 2 diabetes", text: "Sugar not controlled enough on current treatment", tone: "good" },
        { icon: "scale", head: "Obesity", text: "Or overweight plus a weight-related illness, judged with Indian BMI and waist cut-offs", tone: "good" },
        { icon: "baby", head: "Pregnant or planning", text: "Not recommended. Stop well before a planned pregnancy", tone: "bad" },
        { icon: "alert", head: "Thyroid cancer risk", text: "Personal or family history of medullary thyroid cancer or MEN2", tone: "bad" },
        { icon: "pill", head: "Past pancreatitis", text: "Needs specialist advice before any GLP-1 medicine", tone: "bad" },
        { icon: "heart", head: "Just a few kilos", text: "Not a shortcut. Food, strength and sleep come first", tone: "bad" },
      ],
    },
    "inline-2": {
      type: "cards",
      title: "Keep the muscle while the fat goes",
      subtitle: "Four habits that decide whether you lose mostly fat or a lot of muscle too.",
      items: [
        { icon: "plate", head: "Protein first", text: "Dal, curd, paneer, eggs or soya at every meal, eaten before rice or roti" },
        { icon: "dumbbell", head: "Lift 2–3 times a week", text: "Squats, push-ups, rows and carries, adding weight slowly" },
        { icon: "drop", head: "Drink through the day", text: "Small meals and nausea make dehydration easy, especially in summer" },
        { icon: "check", head: "Track strength monthly", text: "Weight, waist and one lift. Falling strength means adjust the plan" },
      ],
    },
  },
  "vitamin-b12-vegetarian-india": {
    theme: ["#1e3a8a", "#2563eb", "#facc15"],
    hero: { kicker: "Nutrition · vegetarian India", title: "Vitamin B12 for Indian vegetarians: signs, tests and sources", icons: ["cup", "bowl", "drop", "brain"] },
    "inline-1": {
      type: "cards",
      title: "Why B12 runs low in so many Indians",
      subtitle: "Two or more of these together is a reason to ask your doctor about a test.",
      items: [
        { icon: "leaf", head: "Vegetarian, little dairy", text: "Plants have no reliable B12; milk, curd and paneer are the main sources", tone: "bad" },
        { icon: "pill", head: "Years of metformin", text: "Long-term use is linked with lower B12; don't stop it, get checked", tone: "bad" },
        { icon: "pill", head: "Years of acid tablets", text: "PPIs and H2 blockers for two years or more", tone: "bad" },
        { icon: "family", head: "Over 60", text: "The stomach releases less B12 from food with age", tone: "bad" },
        { icon: "alert", head: "Stomach or gut problems", text: "Past surgery, coeliac, Crohn's or pernicious anaemia", tone: "bad" },
        { icon: "baby", head: "Pregnancy on a low-B12 diet", text: "Tell your obstetrician what you eat; test as advised", tone: "bad" },
      ],
    },
    "inline-2": {
      type: "bands",
      title: "Reading a total B12 result",
      subtitle: "Bands from the UK NICE guideline (NG239, 2024). Your lab's own cut-offs and your symptoms come first.",
      items: [
        { range: "Below 180", name: "Low", color: "#dc2626", dark: true, text: "Deficiency confirmed. Your doctor looks for the cause and decides treatment." },
        { range: "180–350", name: "Grey zone", color: "#facc15", text: "Could be low or fine. With symptoms, a second test such as MMA or active B12 helps." },
        { range: "Above 350", name: "Unlikely", color: "#16a34a", dark: true, text: "Deficiency unlikely. Look for other causes of symptoms." },
      ],
      note: "Units: ng/L (same as pg/mL). Source: NICE NG239, Vitamin B12 deficiency in over 16s, 2024. Pregnancy uses a different test.",
    },
  },
  "cholesterol-report-explained": {
    theme: ["#7c2d12", "#c2410c", "#fde047"],
    hero: { kicker: "Heart health · lab report", title: "Your lipid profile explained: LDL, HDL, triglycerides and targets", icons: ["heart", "drop", "plate", "check"] },
    "inline-1": {
      type: "cards",
      title: "What each line on your report means",
      subtitle: "Read the report as a whole. LDL is the main target; your goal depends on your risk.",
      items: [
        { icon: "alert", head: "LDL cholesterol", text: "Builds plaque in arteries. Main treatment target: lower is better", tone: "bad" },
        { icon: "heart", head: "HDL cholesterol", text: "Better higher. Low with belly fat and inactivity", tone: "good" },
        { icon: "cup", head: "Triglycerides", text: "Rise with sugar, refined carbs and alcohol. Very high is urgent" },
        { icon: "drop", head: "Non-HDL", text: "Total minus HDL: every particle that can block arteries" },
        { icon: "family", head: "Lp(a)", text: "Mostly genetic. Worth testing once, especially with early heart disease in the family" },
      ],
    },
    "inline-2": {
      type: "bands",
      title: "LDL goals by heart risk",
      subtitle: "Your doctor decides your risk group from age, BP, sugar, smoking, kidneys and family history.",
      items: [
        { range: "Below 55", name: "Very high risk", color: "#7f1d1d", dark: true, text: "Past heart attack, stroke or stent; diabetes with organ damage. Also a 50% cut." },
        { range: "Below 70", name: "High risk", color: "#dc2626", dark: true, text: "Long-standing diabetes or one very high risk factor. Also a 50% cut." },
        { range: "Below 100", name: "Moderate risk", color: "#f97316", text: "For example, younger people with recent diabetes and no other risk factors." },
        { range: "Below 116", name: "Low risk", color: "#16a34a", dark: true, text: "Young, no diabetes, low overall risk." },
      ],
      note: "LDL in mg/dL. Source: 2019 ESC/EAS Guidelines for the management of dyslipidaemias.",
    },
  },
  "gout-uric-acid-india": {
    theme: ["#4c1d95", "#7c3aed", "#fcd34d"],
    hero: { kicker: "Metabolism · joints", title: "High uric acid and gout: diet, triggers and treatment", icons: ["drop", "bowl", "pill", "walk"] },
    "inline-1": {
      type: "cards",
      title: "High uric acid is not the same as gout",
      subtitle: "Most people with a high number never get gout. Gout means crystals causing joint attacks.",
      items: [
        { icon: "drop", head: "High uric acid, no symptoms", text: "Common on health checks. Usually not treated with medicine; check weight, BP, sugar, kidneys" },
        { icon: "alert", head: "Gout flare", text: "Sudden severe pain, swelling, redness and heat, often in the big toe", tone: "bad" },
        { icon: "clock", head: "Settles, then returns", text: "Flares ease in one to two weeks and can come back months later", tone: "bad" },
        { icon: "pill", head: "Frequent flares or lumps", text: "Long-term uric acid lowering medicine, adjusted by a doctor to a target", tone: "good" },
      ],
    },
    "inline-2": {
      type: "cards",
      title: "Gout and food: what to limit, what's fine",
      subtitle: "Alcohol, sugary drinks and big meat or seafood meals matter more than dal.",
      items: [
        { icon: "cup", head: "Limit: alcohol", text: "Especially beer, spirits and binge drinking", tone: "bad" },
        { icon: "cup", head: "Limit: sugary drinks", text: "Cold drinks, packaged juices, sweet lassi", tone: "bad" },
        { icon: "plate", head: "Limit: big meat and seafood meals", text: "Mutton, organ meat and seafood, especially at parties", tone: "bad" },
        { icon: "bowl", head: "Fine for most: dal and vegetables", text: "Plant purines weren't linked with more gout in a large study", tone: "good" },
        { icon: "drop", head: "Helps: water and low-fat dairy", text: "Water through the day; milk and curd were linked with less gout", tone: "good" },
      ],
    },
  },
  "anabolic-steroids-side-effects-india": {
    "theme": [
      "#1c1917",
      "#57534e",
      "#f43f5e"
    ],
    "hero": {
      "kicker": "Supplements and gym drugs",
      "title": "Anabolic steroids: the real cost to heart, liver and hormones",
      "icons": [
        "heart",
        "brain",
        "pill",
        "alert"
      ]
    },
    "inline-1": {
      "type": "cards",
      "title": "What steroids do across your body",
      "subtitle": "Harms reported in research and by health services. Many build silently for years.",
      "items": [
        {
          "icon": "heart",
          "head": "Heart",
          "text": "Weaker pumping, stiffer relaxation and more artery plaque in long-term users",
          "tone": "bad"
        },
        {
          "icon": "drop",
          "head": "Liver and kidneys",
          "text": "Oral steroids strain the liver: jaundice, and rarely tumours. Kidney damage reported",
          "tone": "bad"
        },
        {
          "icon": "family",
          "head": "Hormones and fertility",
          "text": "Shrunken testicles, low sperm count, and low testosterone that can last years after stopping",
          "tone": "bad"
        },
        {
          "icon": "mask",
          "head": "Skin and body",
          "text": "Severe acne, hair loss, breast tissue in men. Deeper voice and body hair in women",
          "tone": "bad"
        },
        {
          "icon": "brain",
          "head": "Mind",
          "text": "Mood swings, aggression, dependence, and low mood after stopping",
          "tone": "bad"
        },
        {
          "icon": "alert",
          "head": "Injections and fakes",
          "text": "Hepatitis B, C and HIV from shared needles or vials. About a third of black-market samples were fake",
          "tone": "bad"
        }
      ]
    },
    "inline-2": {
      "type": "bars",
      "title": "Heart pumping strength in weightlifters",
      "subtitle": "Left ventricular ejection fraction: the share of blood pumped out with each beat",
      "unit": "%",
      "max": 70,
      "items": [
        {
          "label": "Never used steroids (54 men)",
          "value": 63
        },
        {
          "label": "All steroid users (86 men)",
          "value": 52,
          "highlight": true
        },
        {
          "label": "Steroid users who had stopped (28 men)",
          "value": 58
        },
        {
          "label": "Current steroid users (58 men)",
          "value": 49,
          "highlight": true
        }
      ],
      "note": "Source: Baggish et al., Cardiovascular Toxicity of Illicit Anabolic-Androgenic Steroid Use, Circulation, 2017. Averages; lower means weaker pumping."
    }
  },
  "beginner-gym-guide-india": {
    "theme": [
      "#0f172a",
      "#0369a1",
      "#f97316"
    ],
    "hero": {
      "kicker": "Fitness · beginners",
      "title": "Your first month in the gym: a safe beginner's plan",
      "icons": [
        "dumbbell",
        "clock",
        "walk",
        "check"
      ]
    },
    "inline-1": {
      "type": "bars",
      "title": "How much activity WHO advises each week",
      "subtitle": "Adults 18–64: aerobic minutes per week, plus muscle-strengthening on 2 or more days.",
      "unit": " min",
      "max": 300,
      "items": [
        {
          "label": "Moderate activity, minimum (brisk walking, cycling)",
          "value": 150,
          "highlight": true
        },
        {
          "label": "Moderate activity, upper target",
          "value": 300
        },
        {
          "label": "Vigorous activity, minimum (running, fast cycling)",
          "value": 75,
          "highlight": true
        },
        {
          "label": "Vigorous activity, upper target",
          "value": 150
        }
      ],
      "note": "Source: WHO 2020 guidelines on physical activity and sedentary behaviour (Bull et al., British Journal of Sports Medicine, 2020)."
    },
    "inline-2": {
      "type": "cards",
      "title": "Your 4-week full-body plan",
      "subtitle": "3 days a week with a rest day between. Alternate Workout A and B. 1–2 minutes rest between sets.",
      "items": [
        {
          "icon": "pen",
          "head": "Week 1: learn the moves",
          "text": "2 sets of 10–12, light weight, stop 3–4 reps short of tired"
        },
        {
          "icon": "clock",
          "head": "Week 2: build the habit",
          "text": "2 sets of 10–12. Second set easy? Pick the next dumbbell"
        },
        {
          "icon": "dumbbell",
          "head": "Week 3: add a set",
          "text": "3 sets of 8–12 on the main lifts, 2 sets on the rest"
        },
        {
          "icon": "check",
          "head": "Week 4: progress the load",
          "text": "2 reps over target on the last set? Add a small step (ACSM: 2–10%)",
          "tone": "good"
        },
        {
          "icon": "alert",
          "head": "Stop and get checked",
          "text": "Chest pain, fainting, joint pain, swelling or very dark urine",
          "tone": "bad"
        }
      ]
    }
  },
  "creatine-guide-india": {
    "theme": [
      "#0c4a6e",
      "#0369a1",
      "#fb923c"
    ],
    "hero": {
      "kicker": "Supplements · evidence check",
      "title": "Creatine for Indians: kidneys, hair loss and vegetarians",
      "icons": [
        "dumbbell",
        "cup",
        "check",
        "leaf"
      ]
    },
    "inline-1": {
      "type": "bars",
      "title": "How much creatine is in your muscles?",
      "subtitle": "Total creatine in mmol per kg of dry muscle. Vegetarians start lower, so they may gain more from a supplement.",
      "unit": "",
      "max": 170,
      "items": [
        {
          "label": "Vegetarians, low end of range",
          "value": 90,
          "highlight": true
        },
        {
          "label": "Vegetarians, high end of range",
          "value": 110,
          "highlight": true
        },
        {
          "label": "Average, 70 kg person on a mixed diet",
          "value": 120
        },
        {
          "label": "Upper storage limit for most people",
          "value": 160
        }
      ],
      "note": "Source: Kreider et al., International Society of Sports Nutrition position stand on creatine, JISSN 2017."
    },
    "inline-2": {
      "type": "cards",
      "title": "Ask a doctor before creatine if",
      "subtitle": "Creatine has a strong safety record in healthy adults. These groups need a doctor's view first.",
      "items": [
        {
          "icon": "drop",
          "head": "Kidney disease",
          "text": "Or a past abnormal creatinine or eGFR. Safety studies were mostly in healthy people",
          "tone": "bad"
        },
        {
          "icon": "baby",
          "head": "Pregnant or breastfeeding",
          "text": "Research is still early. Ask your obstetrician",
          "tone": "bad"
        },
        {
          "icon": "family",
          "head": "Under 18",
          "text": "Limited evidence. Food, sleep and coaching come first; involve a parent and doctor",
          "tone": "bad"
        },
        {
          "icon": "pill",
          "head": "On regular medicines",
          "text": "Especially those that affect the kidneys",
          "tone": "bad"
        },
        {
          "icon": "check",
          "head": "Healthy adult who trains",
          "text": "Plain monohydrate, ISSN amounts, tell the lab before kidney tests",
          "tone": "good"
        }
      ]
    }
  },
  "fat-burners-pre-workout-risks-india": {
    "theme": [
      "#4a044e",
      "#a21caf",
      "#facc15"
    ],
    "hero": {
      "kicker": "Supplements · heart and liver",
      "title": "Fat burners and pre-workouts: what's inside and what can hurt",
      "icons": [
        "alert",
        "heart",
        "cup",
        "walk"
      ]
    },
    "inline-1": {
      "type": "bars",
      "title": "How much caffeine are you really taking?",
      "subtitle": "Approximate caffeine per serving, compared with EFSA's safe single amount and daily limit for healthy adults.",
      "unit": " mg",
      "max": 400,
      "items": [
        {
          "label": "Cup of black tea (220 ml)",
          "value": 50
        },
        {
          "label": "Can of cola (355 ml)",
          "value": 40
        },
        {
          "label": "Espresso (60 ml)",
          "value": 80
        },
        {
          "label": "Energy drink can (250 ml)",
          "value": 80
        },
        {
          "label": "Cup of filter coffee (200 ml)",
          "value": 90
        },
        {
          "label": "Caffeinated drink, 500 ml at FSSAI's 300 mg/L ceiling",
          "value": 150
        },
        {
          "label": "EFSA safe single amount",
          "value": 200,
          "highlight": true
        },
        {
          "label": "EFSA daily limit, healthy adults (not pregnancy)",
          "value": 400,
          "highlight": true
        }
      ],
      "note": "Sources: EFSA Scientific Opinion on the safety of caffeine, 2015; FSSAI caffeinated beverage standard (145–300 mg per litre, max 500 ml a day), as reported by BeverageDaily, 2026."
    },
    "inline-2": {
      "type": "cards",
      "title": "What's in the tub, and why it's a worry",
      "subtitle": "Read every label. If amounts are hidden in a 'proprietary blend', skip it.",
      "items": [
        {
          "icon": "cup",
          "head": "Caffeine",
          "text": "Small training boost. Add every source and stay within EFSA's 200 mg at once, 400 mg a day"
        },
        {
          "icon": "alert",
          "head": "DMAA, DMHA, octodrine",
          "text": "FDA-banned DMAA linked to heart risks; look-alikes have unknown safety. Prohibited in sport",
          "tone": "bad"
        },
        {
          "icon": "heart",
          "head": "Synephrine (bitter orange)",
          "text": "Raised blood pressure in a 2022 meta-analysis, with no proven weight loss",
          "tone": "bad"
        },
        {
          "icon": "pill",
          "head": "Yohimbine",
          "text": "Amounts ranged from none to drug-level, and most labels were wrong",
          "tone": "bad"
        },
        {
          "icon": "leaf",
          "head": "Green tea extract, Garcinia",
          "text": "Flagged in liver-injury research. 'Herbal' doesn't mean safe",
          "tone": "bad"
        },
        {
          "icon": "walk",
          "head": "What works instead",
          "text": "Calorie deficit, protein at every meal, lifting and more daily steps",
          "tone": "good"
        }
      ]
    }
  },
  "gym-heart-safety-chest-pain": {
    "theme": [
      "#0c4a6e",
      "#dc2626",
      "#fde047"
    ],
    "hero": {
      "kicker": "Heart health · gym safety",
      "title": "Chest pain at the gym isn't gas: warning signs and CPR",
      "icons": [
        "heart",
        "alert",
        "phone",
        "dumbbell"
      ]
    },
    "inline-1": {
      "type": "cards",
      "title": "Heart warning signs: stop and get help",
      "subtitle": "From the American Heart Association. If it lasts more than a few minutes, call 112 or 108.",
      "items": [
        {
          "icon": "heart",
          "head": "Chest pressure or pain",
          "text": "Squeezing, fullness, heaviness or burning in the centre of the chest",
          "tone": "bad"
        },
        {
          "icon": "alert",
          "head": "Pain that spreads",
          "text": "To one or both arms, the back, neck, jaw or upper stomach",
          "tone": "bad"
        },
        {
          "icon": "lungs",
          "head": "Breathlessness",
          "text": "With or without chest pain, out of proportion to the effort",
          "tone": "bad"
        },
        {
          "icon": "drop",
          "head": "Cold sweat or nausea",
          "text": "Often mistaken for acidity, especially in women",
          "tone": "bad"
        },
        {
          "icon": "clock",
          "head": "Racing or irregular heartbeat",
          "text": "Or feeling lightheaded or unusually tired",
          "tone": "bad"
        }
      ]
    },
    "inline-2": {
      "type": "bars",
      "title": "When someone collapses during sport",
      "subtitle": "Sports-related cardiac arrests in the general population, France, 2005 to 2010.",
      "unit": "%",
      "max": 100,
      "items": [
        {
          "label": "Arrest was witnessed by someone",
          "value": 93
        },
        {
          "label": "Bystander started CPR",
          "value": 30.7,
          "highlight": true
        },
        {
          "label": "Survived to leave hospital",
          "value": 15.7,
          "highlight": true
        }
      ],
      "note": "Source: Marijon et al., Sports-related sudden death in the general population, Circulation, 2011. Bystander CPR and early defibrillation each linked to about 3.7 times higher odds of survival."
    }
  },
  "peptides-bpc-157-gym-injections-truth": {
    "theme": [
      "#0c4a6e",
      "#0e7490",
      "#fb7185"
    ],
    "hero": {
      "kicker": "Supplements & gym drugs",
      "title": "Gym peptides: what the evidence really says",
      "icons": [
        "alert",
        "dumbbell",
        "heart",
        "plate"
      ]
    },
    "inline-1": {
      "type": "bars",
      "title": "How BPC-157 has been studied",
      "subtitle": "Studies included in a 2025 systematic review, by type",
      "unit": "",
      "max": 36,
      "items": [
        {
          "label": "All studies included",
          "value": 36
        },
        {
          "label": "Animal or lab-dish (preclinical) studies",
          "value": 35
        },
        {
          "label": "Human studies (one record review of 12 knee pain patients, no comparison group)",
          "value": 1,
          "highlight": true
        }
      ],
      "note": "Source: Vasireddi et al., Emerging Use of BPC-157 in Orthopaedic Sports Medicine: A Systematic Review, HSS Journal, 2025."
    },
    "inline-2": {
      "type": "cards",
      "title": "Approved peptide medicines vs research peptides",
      "subtitle": "Same word, very different products.",
      "items": [
        {
          "icon": "check",
          "head": "Approved: insulin, GLP-1s, prescribed GH",
          "text": "Tested in large human trials and approved by regulators such as CDSCO",
          "tone": "good"
        },
        {
          "icon": "pill",
          "head": "Approved: made to medicine standards",
          "text": "Licensed factories check purity, sterility and exact content",
          "tone": "good"
        },
        {
          "icon": "alert",
          "head": "Research peptides: BPC-157, TB-500",
          "text": "Mostly animal data, no human safety record, sold as research use only",
          "tone": "bad"
        },
        {
          "icon": "label",
          "head": "Research peptides: unverified vials",
          "text": "Content, impurities and sterility are not checked by any regulator",
          "tone": "bad"
        },
        {
          "icon": "dumbbell",
          "head": "Sport: banned at all times",
          "text": "WADA lists BPC-157, TB-500, MK-677 and GH-releasing peptides; NADA India tests against this list",
          "tone": "bad"
        }
      ]
    }
  },
  "protein-requirement-calculator-india": {
    "theme": [
      "#365314",
      "#4d7c0f",
      "#fbbf24"
    ],
    "hero": {
      "kicker": "Fitness · nutrition",
      "title": "Kitna protein chahiye? Your daily number",
      "icons": [
        "bowl",
        "scale",
        "dumbbell",
        "plate"
      ]
    },
    "inline-1": {
      "type": "cards",
      "title": "Your daily protein number",
      "subtitle": "Weight in kg × the g per kg on your line. Kidney disease? Your doctor sets it.",
      "items": [
        {
          "icon": "check",
          "head": "Healthy adult: 0.83 g/kg",
          "text": "ICMR-NIN 2020 allowance. About 54 g for 65 kg, 46 g for 55 kg"
        },
        {
          "icon": "bowl",
          "head": "Mostly cereal diet: about 1 g/kg",
          "text": "ICMR-NIN footnote for diets low in protein quality"
        },
        {
          "icon": "dumbbell",
          "head": "Lifting weights: 1.4–2.0 g/kg",
          "text": "ISSN 2017 range. Muscle gains level off near 1.6 g/kg (Morton 2018)",
          "tone": "good"
        },
        {
          "icon": "family",
          "head": "Over 65: 1.0–1.2 g/kg",
          "text": "PROT-AGE 2013; 1.2 g/kg or more if active"
        },
        {
          "icon": "alert",
          "head": "Kidney disease: ask your doctor",
          "text": "KDIGO 2024 patient guide: about 0.8 g/kg or less, set by your nephrologist",
          "tone": "bad"
        }
      ]
    },
    "inline-2": {
      "type": "bars",
      "title": "Protein in typical Indian servings",
      "subtitle": "Grams of protein, calculated from IFCT 2017 values. Dal, soya, chana and rice weighed dry; egg boiled.",
      "unit": " g",
      "max": 25,
      "items": [
        {
          "label": "Chicken breast, skinless, 100 g raw",
          "value": 21.8,
          "highlight": true
        },
        {
          "label": "Paneer, 100 g",
          "value": 18.9,
          "highlight": true
        },
        {
          "label": "Boiled egg, 100 g",
          "value": 13.4
        },
        {
          "label": "Soybean (brown, whole), 30 g dry",
          "value": 10.7
        },
        {
          "label": "Masoor dal, 30 g dry",
          "value": 7.3
        },
        {
          "label": "Cow's milk, 200 g",
          "value": 6.5
        },
        {
          "label": "Whole wheat atta, 60 g",
          "value": 6.3
        },
        {
          "label": "Raw rice, 60 g",
          "value": 4.8
        }
      ],
      "note": "Source: Indian Food Composition Tables 2017, ICMR-National Institute of Nutrition. Serving values are per-100 g figures multiplied by the weight shown."
    }
  },
  "sarms-spiked-gym-supplements-india": {
    "theme": [
      "#365314",
      "#4d7c0f",
      "#fb923c"
    ],
    "hero": {
      "kicker": "Supplements and gym drugs",
      "title": "SARMs and spiked supplements: the hidden steroid risk",
      "icons": [
        "label",
        "pill",
        "check",
        "alert"
      ]
    },
    "inline-1": {
      "type": "bars",
      "title": "What was inside 44 'SARM' products bought online",
      "subtitle": "Lab tests using WADA-approved methods, products bought in 2016",
      "unit": "%",
      "max": 100,
      "items": [
        {
          "label": "Contained one or more SARMs",
          "value": 52
        },
        {
          "label": "Contained a different unapproved drug",
          "value": 39,
          "highlight": true
        },
        {
          "label": "Contained substances not on the label",
          "value": 25,
          "highlight": true
        },
        {
          "label": "Contained no active drug at all",
          "value": 9,
          "highlight": true
        },
        {
          "label": "Amount close to what the label claimed",
          "value": 41
        }
      ],
      "note": "Source: Van Wagoner et al., Chemical Composition and Labeling of Substances Marketed as SARMs and Sold via the Internet, JAMA, 2017. Categories overlap."
    },
    "inline-2": {
      "type": "cards",
      "title": "Six checks before you buy a gym supplement",
      "subtitle": "No check makes a product risk-free, but together they cut the odds of hidden drugs.",
      "items": [
        {
          "icon": "bowl",
          "head": "Food first",
          "text": "Dal, paneer, curd, eggs, chicken and soya cover most protein needs",
          "tone": "good"
        },
        {
          "icon": "label",
          "head": "FSSAI licence and full label",
          "text": "Licence number, every ingredient, batch number and expiry on the pack",
          "tone": "good"
        },
        {
          "icon": "check",
          "head": "Independent batch testing",
          "text": "Check the batch on the tester's own website, not just a logo",
          "tone": "good"
        },
        {
          "icon": "scale",
          "head": "Plain, single ingredients",
          "text": "Whey or creatine monohydrate, not secret proprietary blends",
          "tone": "good"
        },
        {
          "icon": "alert",
          "head": "Skip 'anabolic' promises",
          "text": "SARM, research chemical, test booster or steroid-like on the label means walk away",
          "tone": "bad"
        },
        {
          "icon": "phone",
          "head": "No Instagram or WhatsApp sellers",
          "text": "Buy from authorised sellers and keep the bill",
          "tone": "bad"
        }
      ]
    }
  },
  "tirzepatide-mounjaro-india-guide": {
    "theme": [
      "#365314",
      "#4d7c0f",
      "#fb923c"
    ],
    "hero": {
      "kicker": "Weight & metabolism · India",
      "title": "Tirzepatide (Mounjaro) in India: who it suits and how to keep your muscle",
      "icons": [
        "pen",
        "scale",
        "dumbbell",
        "plate"
      ]
    },
    "inline-1": {
      "type": "bars",
      "title": "Average weight loss at 72 weeks (SURMOUNT-1)",
      "subtitle": "Adults with obesity, or overweight plus a related illness, without diabetes. Three strengths of tirzepatide compared with placebo.",
      "unit": "%",
      "max": 25,
      "items": [
        {
          "label": "Placebo",
          "value": 3.1
        },
        {
          "label": "Tirzepatide, lowest strength",
          "value": 15
        },
        {
          "label": "Tirzepatide, middle strength",
          "value": 19.5
        },
        {
          "label": "Tirzepatide, highest strength",
          "value": 20.9,
          "highlight": true
        }
      ],
      "note": "Source: Jastreboff et al., Tirzepatide Once Weekly for the Treatment of Obesity (SURMOUNT-1), New England Journal of Medicine, 2022. Averages; individual results vary widely."
    },
    "inline-2": {
      "type": "bars",
      "title": "What happens when you stop (SURMOUNT-4)",
      "subtitle": "Everyone took tirzepatide for 36 weeks, then half switched to placebo for 52 weeks.",
      "unit": "%",
      "max": 25,
      "items": [
        {
          "label": "Weight lost in the first 36 weeks on tirzepatide",
          "value": 20.9
        },
        {
          "label": "Kept taking tirzepatide: further weight lost over 52 weeks",
          "value": 5.5
        },
        {
          "label": "Switched to placebo: weight regained over 52 weeks",
          "value": 14,
          "highlight": true
        }
      ],
      "note": "Source: Aronne et al., Continued Treatment With Tirzepatide for Maintenance of Weight Reduction (SURMOUNT-4), JAMA, 2024."
    }
  },
  "women-weight-training-guide-india": {
    "theme": [
      "#701a75",
      "#c026d3",
      "#fde68a"
    ],
    "hero": {
      "kicker": "Fitness · women",
      "title": "Strength training for women: the real facts",
      "icons": [
        "dumbbell",
        "heart",
        "baby",
        "leaf"
      ]
    },
    "inline-1": {
      "type": "cards",
      "title": "What strength training does for women",
      "subtitle": "Two or three full-body sessions a week, built up slowly, at every stage of life.",
      "items": [
        {
          "icon": "dumbbell",
          "head": "Shape and strength",
          "text": "Firmer, leaner look and strength for daily loads. Bulky by accident is very unlikely",
          "tone": "good"
        },
        {
          "icon": "check",
          "head": "Stronger bones",
          "text": "Load helps bone density, before and after menopause",
          "tone": "good"
        },
        {
          "icon": "drop",
          "head": "Insulin and PCOS",
          "text": "2023 PCOS guideline: strength work on 2 non-consecutive days a week",
          "tone": "good"
        },
        {
          "icon": "baby",
          "head": "Pregnancy and after birth",
          "text": "Recommended without complications, with changes your doctor agrees",
          "tone": "good"
        },
        {
          "icon": "family",
          "head": "Independence later",
          "text": "Muscle and balance keep you on your feet in your 60s and beyond",
          "tone": "good"
        }
      ]
    },
    "inline-2": {
      "type": "bars",
      "title": "Low bone density in Indian women after menopause",
      "subtitle": "Pooled results from Indian studies of postmenopausal women, by site measured.",
      "unit": "%",
      "max": 40,
      "items": [
        {
          "label": "Osteoporosis, lumbar spine",
          "value": 29,
          "highlight": true
        },
        {
          "label": "Osteoporosis, femoral neck",
          "value": 29,
          "highlight": true
        },
        {
          "label": "Osteoporosis, hip region",
          "value": 6
        },
        {
          "label": "Osteopenia, lumbar spine",
          "value": 37
        }
      ],
      "note": "Source: Anupama et al., Burden of Osteopenia and Osteoporosis Among Postmenopausal Women in India, Journal of Mid-life Health, 2022. Few studies, varied methods."
    }
  },
};

export function render(slug) {
  const spec = SPECS[slug];
  const dir = path.join(ROOT, "public/health/posts", slug);
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, s] of Object.entries(spec)) {
    if (name === "theme") continue;
    const type = name === "hero" ? "hero" : s.type;
    fs.writeFileSync(path.join(dir, `${name}.svg`), RENDER[type]({ theme: spec.theme, ...s }));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const only = process.argv[2];
  for (const slug of Object.keys(SPECS)) if (!only || only === slug) render(slug);
  console.log(`SVGs written for ${only ?? Object.keys(SPECS).length + " posts"}`);
}
