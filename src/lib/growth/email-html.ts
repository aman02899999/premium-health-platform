// Branded HTML for outgoing emails, from the plain-text body stored in the outbox.
// Pure and dependency-free so it can be unit-tested; inline styles because email clients
// ignore <style> blocks.
import { CTA_RE } from "./nurture";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const linkify = (s: string) => esc(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#04466d">$1</a>');

export function splitCta(body: string): { text: string; cta: { label: string; url: string } | null } {
  const m = CTA_RE.exec(body);
  return m ? { text: body.replace(CTA_RE, ""), cta: { label: m[1], url: m[2] } } : { text: body, cta: null };
}

/** Plain text for the text part: the CTA becomes "Label: url". */
export function emailText(body: string, footer: string): string {
  const { text, cta } = splitCta(body);
  return `${text}${cta ? `\n\n${cta.label}: ${cta.url}` : ""}\n\n—\n${footer}`;
}

export function emailHtml(body: string, opts: { brand: string; footer: string; unsubscribeUrl?: string }): string {
  const { text, cta } = splitCta(body);
  const paras = text
    .split(/\n{2,}/)
    .map((p) => {
      const lines = p.split("\n");
      if (lines.every((l) => l.trim().startsWith("•")))
        return `<ul style="margin:0 0 16px;padding-left:20px">${lines.map((l) => `<li style="margin:4px 0">${linkify(l.replace(/^\s*•\s*/, ""))}</li>`).join("")}</ul>`;
      return `<p style="margin:0 0 16px">${lines.map(linkify).join("<br>")}</p>`;
    })
    .join("");
  const button = cta
    ? `<p style="margin:24px 0"><a href="${esc(cta.url)}" style="display:inline-block;background:#e8394b;color:#ffffff;text-decoration:none;font-weight:bold;padding:13px 26px;border-radius:999px">${esc(cta.label)}</a></p>`
    : "";
  const unsub = opts.unsubscribeUrl ? `<br><a href="${esc(opts.unsubscribeUrl)}" style="color:#64748b">Unsubscribe</a> from these emails.` : "";
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#04466d;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:bold;border-bottom:4px solid #e8394b">${esc(opts.brand)}</td></tr>
<tr><td style="padding:28px;font-size:15px;line-height:1.6">${paras}${button}</td></tr>
<tr><td style="padding:16px 28px 24px;font-size:12px;line-height:1.5;color:#64748b;border-top:1px solid #e2e8f0">${esc(opts.footer)}${unsub}</td></tr>
</table></td></tr></table></body></html>`;
}
