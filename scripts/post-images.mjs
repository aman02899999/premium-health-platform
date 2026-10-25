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
