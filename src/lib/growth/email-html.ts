// Branded HTML for outgoing emails, from the plain-text body stored in the outbox.
// Pure and dependency-free so it can be unit-tested; inline styles and tables because email
// clients ignore <style> blocks and flexbox.
//
// Markup the builders can put in a body (each on its own line):
//   [[CTA:Label|https://…]]   a button, where it stands (the first one is the main call to action)
//   [[MEME:top line|punchline]]  a meme-style card with our own words (never someone else's image)
//   [[HERO:offer]]            the banner on top (otherwise chosen from the email's kind)
//   lines starting with "•"   a ticked list

export const BANNERS = ["offer", "welcome", "renewal", "trial", "comeback", "diet", "referral", "thanks"] as const;
export type Banner = (typeof BANNERS)[number];

const TOKEN_RE = /^\s*\[\[(CTA|MEME|HERO):([^\]]*)\]\]\s*$/;
const CTA_ANY = /\[\[CTA:([^|\]]+)\|([^\]]+)\]\]/;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** How a bare link reads: "Chat on WhatsApp" for wa.me, otherwise the address without its tracking query. */
function linkLabel(url: string): string {
  if (/^https:\/\/wa\.me\//.test(url)) return "Chat on WhatsApp";
  const short = url.replace(/^https?:\/\/(www\.)?/, "").replace(/[?#].*$/, "").replace(/\/$/, "");
  return short.length > 48 ? `${short.slice(0, 47)}…` : short;
}
const linkify = (s: string, color = "#04466d") =>
  esc(s).replace(/(https?:\/\/[^\s<]+)/g, (u) => `<a href="${u}" style="color:${color};font-weight:700;text-decoration:underline">${linkLabel(u.replace(/&amp;/g, "&")).replace(/&/g, "&amp;")}</a>`);

/** The first call-to-action in a body, wherever it stands, and the body without any CTA markup. */
export function splitCta(body: string): { text: string; cta: { label: string; url: string } | null } {
  const m = CTA_ANY.exec(body);
  const text = body
    .split("\n")
    .filter((l) => !TOKEN_RE.test(l))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { text, cta: m ? { label: m[1].trim(), url: m[2].trim() } : null };
}

/** Plain text for the text part: buttons become "Label: url", memes become two lines. */
export function emailText(body: string, footer: string): string {
  const lines = body.split("\n").flatMap((l) => {
    const t = TOKEN_RE.exec(l);
    if (!t) return [l];
    const [a, b = ""] = t[2].split("|");
    if (t[1] === "CTA") return [`${a.trim()}: ${b.trim()}`];
    if (t[1] === "MEME") return [`${a.trim()}`, `${b.trim()}`];
    return [];
  });
  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n\n—\n${footer}`;
}

export type EmailLinks = { site: string; join?: string; trial?: string; whatsapp?: string; call?: string; directions?: string; instagram?: string };

export type EmailOpts = {
  brand: string;
  footer: string;
  unsubscribeUrl?: string;
  /**
   * "newsletter": offers and nurture mail (banner, meme cards, quick links, unsubscribe).
   * "personal": orders, plans and bookings: the same brand, lighter (logo, card, button, no promotions).
   * "internal": alerts to the coach and admin: compact.
   */
  style?: "newsletter" | "personal" | "internal";
  /** Absolute site URL, for the logo, banners and links. */
  siteUrl?: string;
  /** Outbox kind, to pick the banner. */
  kind?: string;
  links?: EmailLinks;
  /** e.g. "★ 4.7 · 303+ ratings on Justdial" */
  trust?: string;
  /** Hidden preview line shown by Gmail next to the subject. */
  preheader?: string;
};

/** The banner for an email kind (null = no banner). */
export function bannerFor(kind = ""): Banner | null {
  if (kind === "nurture-campaign") return "offer";
  if (kind === "nurture-review") return "thanks";
  if (kind === "nurture-pick" || kind.startsWith("nurture-diet") || kind.startsWith("diet-")) return "diet";
  if (kind.startsWith("nurture-pt") || kind.startsWith("nurture-membership") || kind.startsWith("trial-")) return "trial";
  if (kind.startsWith("renew")) return "renewal";
  return null;
}

const FONT = "'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const NAVY = "#04466d";
const RED = "#d62839"; // a touch darker than the site red so white button text passes contrast

function button(label: string, url: string, primary: boolean): string {
  const bg = primary ? RED : "#ffffff";
  const fg = primary ? "#ffffff" : NAVY;
  const border = primary ? RED : NAVY;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:26px auto"><tr><td align="center" bgcolor="${bg}" style="border-radius:999px;border:2px solid ${border};mso-padding-alt:14px 34px">
<a href="${esc(url)}" target="_blank" style="display:inline-block;padding:15px 36px;font-family:${FONT};font-size:17px;font-weight:800;color:${fg};text-decoration:none;border-radius:999px;letter-spacing:.3px">${esc(label)} &rarr;</a></td></tr></table>`;
}

function meme(top: string, bottom: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 22px"><tr><td style="background:#0b1f33;border-radius:16px;padding:22px 24px;text-align:center;font-family:Impact,'Arial Black',${FONT}">
<div style="font-size:22px;line-height:1.25;color:#ffffff;text-transform:uppercase;letter-spacing:.5px">${esc(top)}</div>
<div style="margin:12px auto;width:48px;height:3px;background:${RED};border-radius:3px"></div>
<div style="font-size:24px;line-height:1.25;color:#ffd166;text-transform:uppercase;letter-spacing:.5px">${esc(bottom)}</div></td></tr></table>`;
}

function bullets(lines: string[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px">${lines
    .map(
      (l) =>
        `<tr><td valign="top" width="30" style="padding:6px 0"><div style="width:22px;height:22px;border-radius:50%;background:#e9f6ee;color:#15803d;font-size:13px;font-weight:800;line-height:22px;text-align:center">&#10003;</div></td><td style="padding:6px 0 6px 6px;font-size:15px;line-height:1.5;color:#1e293b">${linkify(l.replace(/^\s*•\s*/, ""))}</td></tr>`,
    )
    .join("")}</table>`;
}

/** The body, block by block: paragraphs, ticked lists, buttons and meme cards where they stand. */
function blocks(body: string, style: EmailOpts["style"]): { html: string; hero: Banner | null } {
  let hero: Banner | null = null;
  let firstCta = true;
  const out: string[] = [];
  let para: string[] = [];
  const flush = () => {
    if (!para.length) return;
    const firstBullet = para.findIndex((l) => l.trim().startsWith("•"));
    // "Heading" lines followed by bullets: the heading in bold, then the ticked list.
    if (firstBullet >= 0 && para.slice(firstBullet).every((l) => l.trim().startsWith("•"))) {
      if (firstBullet > 0) out.push(`<p style="margin:0 0 8px;font-size:16px;line-height:1.5;font-weight:800;color:${NAVY}">${para.slice(0, firstBullet).map((l) => linkify(l)).join("<br>")}</p>`);
      out.push(bullets(para.slice(firstBullet)));
    } else out.push(`<p style="margin:0 0 16px;font-size:15.5px;line-height:1.65;color:#1e293b">${para.map((l) => linkify(l)).join("<br>")}</p>`);
    para = [];
  };
  for (const line of body.split("\n")) {
    const t = TOKEN_RE.exec(line);
    if (t) {
      flush();
      const [a = "", b = ""] = t[2].split("|").map((s) => s.trim());
      if (t[1] === "CTA" && a && b) {
        out.push(button(a, b, firstCta));
        firstCta = false;
      } else if (t[1] === "MEME" && style !== "internal") out.push(meme(a, b));
      else if (t[1] === "HERO" && (BANNERS as readonly string[]).includes(a)) hero = a as Banner;
      continue;
    }
    if (!line.trim()) flush();
    else para.push(line);
  }
  flush();
  return { html: out.join("\n"), hero };
}

function quickLinks(l: EmailLinks): string {
  const items = [
    l.join && ["💪", "Join online", l.join],
    l.trial && ["🎟️", "Free trial", l.trial],
    l.whatsapp && ["💬", "WhatsApp", l.whatsapp],
    l.directions && ["📍", "Directions", l.directions],
  ].filter(Boolean) as [string, string, string][];
  if (!items.length) return "";
  const w = Math.floor(100 / items.length);
  return `<tr><td style="padding:4px 20px 22px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${items
    .map(
      ([icon, label, url]) =>
        `<td width="${w}%" align="center" style="padding:4px"><a href="${esc(url)}" target="_blank" style="display:block;background:#f1f6fb;border-radius:12px;padding:12px 4px;font-family:${FONT};font-size:13px;font-weight:700;color:${NAVY};text-decoration:none"><span style="font-size:20px;line-height:1">${icon}</span><br>${esc(label)}</a></td>`,
    )
    .join("")}</tr></table></td></tr>`;
}

export function emailHtml(body: string, opts: EmailOpts): string {
  const style = opts.style ?? "newsletter";
  const site = (opts.siteUrl || opts.links?.site || "").replace(/\/$/, "");
  const { html: content, hero: chosen } = blocks(body, style);
  const heroId = style === "internal" ? null : (chosen ?? (style === "newsletter" || style === "personal" ? bannerFor(opts.kind) : null));
  const cta = splitCta(body).cta;
  const logo = site ? `<img src="${esc(site)}/brand/logo-mark.png" width="88" height="40" alt="" style="display:block;border:0;width:88px;height:40px">` : "";
  const header = `<tr><td style="background:#ffffff;padding:18px 24px;border-bottom:4px solid ${RED}"><table role="presentation" cellpadding="0" cellspacing="0"><tr>${logo ? `<td valign="middle" style="padding-right:12px">${site ? `<a href="${esc(site)}" target="_blank">${logo}</a>` : logo}</td>` : ""}<td valign="middle" style="font-family:${FONT}"><div style="font-size:16px;font-weight:800;letter-spacing:1.5px;color:${NAVY};text-transform:uppercase;white-space:nowrap">${esc(opts.brand)}</div><div style="font-size:11px;font-weight:700;letter-spacing:3px;color:${RED};text-transform:uppercase;margin-top:2px">Sector 93 &middot; Noida</div></td></tr></table></td></tr>`;
  const banner =
    heroId && site
      ? `<tr><td style="padding:0;line-height:0">${cta ? `<a href="${esc(cta.url)}" target="_blank">` : ""}<img src="${esc(site)}/brand/banners/${heroId}.jpg" width="600" alt="${esc(opts.brand)}" style="display:block;width:100%;max-width:600px;height:auto;border:0">${cta ? "</a>" : ""}</td></tr>`
      : "";
  const trust =
    style !== "internal" && opts.trust
      ? `<tr><td align="center" style="padding:0 24px 18px;font-family:${FONT};font-size:12.5px;font-weight:600;color:#475569">${esc(opts.trust)}</td></tr>`
      : "";
  const links = style === "newsletter" && opts.links ? quickLinks(opts.links) : "";
  const social = opts.links?.instagram && style !== "internal" ? ` &middot; <a href="${esc(opts.links.instagram)}" style="color:#64748b">Instagram</a>` : "";
  const unsub = opts.unsubscribeUrl ? `<br><a href="${esc(opts.unsubscribeUrl)}" style="color:#64748b">Unsubscribe</a> from these emails.` : "";
  const pre = opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(opts.preheader)}</div>` : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
<body style="margin:0;padding:0;background:#eaf0f6;font-family:${FONT};color:#0f172a">${pre}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eaf0f6;padding:${style === "internal" ? "16px 8px" : "24px 10px"}"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(4,70,109,.10)">
${header}
${banner}
<tr><td style="padding:${style === "internal" ? "22px 24px 8px" : "30px 30px 10px"};font-family:${FONT}">${content}</td></tr>
${trust}
${links}
<tr><td style="background:#0b1f33;padding:20px 26px;font-family:${FONT};font-size:12px;line-height:1.6;color:#cbd5e1">${esc(opts.footer)}${social ? `<br><span style="color:#94a3b8">Follow us</span>${social}` : ""}${unsub.replace(/color:#64748b/g, "color:#cbd5e1")}</td></tr>
</table>
<div style="font-family:${FONT};font-size:11px;color:#94a3b8;padding:14px 0">${style === "internal" ? "Sent by your website" : "You're receiving this because you contacted or joined Royal Fitness Club."}</div>
</td></tr></table></body></html>`;
}
