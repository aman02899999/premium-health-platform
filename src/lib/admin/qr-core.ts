// QR codes: the pure half (what a QR may point at, building and re-checking targets, the scan
// reference). The database half is qr.ts.
//
// Every QR prints /q/<code>. A scan is counted and redirected to the target, which may only be:
//   bot     WhatsApp chat with the API number (instant automatic answers), message pre-typed
//   desk    WhatsApp chat with the desk number (WhatsApp Business app, a person answers)
//   optin   WhatsApp chat with the API number, "START PROMOTIONS" pre-typed: one tap to opt in
//   page    a page of this site, tagged utm_source=qr so the visit and any lead are attributed
//   review  the gym's Google review link

export type QrKind = "bot" | "desk" | "optin" | "page" | "review";
export const QR_KINDS: { id: QrKind; label: string; hint: string }[] = [
  { id: "bot", label: "WhatsApp: instant answers", hint: "Opens a chat with the automatic number; fees, timings and trial booking answered 24×7" },
  { id: "desk", label: "WhatsApp: talk to the desk", hint: "Opens a chat with the desk number (Business app); a person replies" },
  { id: "optin", label: "Get offers on WhatsApp", hint: "One tap sends START PROMOTIONS: they're opted in to offers, with consent recorded" },
  { id: "page", label: "Website page", hint: "Membership, free trial, diet charts, shop…" },
  { id: "review", label: "Google review", hint: "Your Google review link; put it at the desk and in the changing room" },
];
export const isQrKind = (k: unknown): k is QrKind => QR_KINDS.some((x) => x.id === k);

export const QR_PAGES: { path: string; label: string }[] = [
  { path: "/membership", label: "Membership plans & offer" },
  { path: "/contact#trial", label: "Book a free trial" },
  { path: "/", label: "Home page" },
  { path: "/diet-chart", label: "Personal diet charts" },
  { path: "/programs", label: "Programs" },
  { path: "/reviews", label: "Member reviews" },
  { path: "/shop", label: "Supplements store" },
  { path: "/membership/price-sheet", label: "Printable price sheet" },
];

export type QrBiz = { siteUrl: string; botNumber: string; deskNumber: string; reviewUrl: string };

export const OPTIN_TEXT = "START PROMOTIONS";
const digits = (s: string) => s.replace(/\D/g, "");
/** WhatsApp wants the number with country code, digits only. */
const waNumber = (s: string) => {
  const d = digits(s);
  return d.length === 10 ? `91${d}` : d;
};

/** "(ref Ab3dE6fG)" at the end of a pre-typed message tells the bot which QR brought the chat. */
export const refLine = (code: string) => `(ref ${code})`;
export function refFromText(text: string): string | null {
  const m = /\(ref ([A-Za-z0-9]{6,12})\)\s*$/.exec(text.trim());
  return m ? m[1] : null;
}

export function newQrCode(): string {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; // no 0/O, 1/l/I
  // Web Crypto: available in Node and the browser, so this file can be imported by both.
  return [...crypto.getRandomValues(new Uint8Array(8))].map((b) => A[b % A.length]).join("");
}

export type QrRequest = { kind: unknown; label: unknown; page?: unknown; text?: unknown };

/** The destination for a new QR, or an error to show. */
export function buildTarget(r: QrRequest, code: string, biz: QrBiz): { target: string; label: string } | { error: string } {
  if (!isQrKind(r.kind)) return { error: "Pick what the QR opens." };
  const label = typeof r.label === "string" ? r.label.trim().slice(0, 60) : "";
  if (!label) return { error: "Name the QR (where it will be stuck), e.g. “Reception poster”." };
  const text = typeof r.text === "string" ? r.text.trim().slice(0, 300) : "";
  switch (r.kind) {
    case "bot":
    case "desk": {
      const n = waNumber(r.kind === "bot" ? biz.botNumber : biz.deskNumber);
      if (!/^\d{11,15}$/.test(n)) return { error: "That WhatsApp number isn't set in Business details." };
      const msg = `${text || "Hi! I saw your QR code. Please share the membership offer."} ${refLine(code)}`;
      return { target: `https://wa.me/${n}?text=${encodeURIComponent(msg)}`, label };
    }
    case "optin": {
      const n = waNumber(biz.botNumber);
      if (!/^\d{11,15}$/.test(n)) return { error: "The automatic WhatsApp number isn't set in Business details." };
      return { target: `https://wa.me/${n}?text=${encodeURIComponent(OPTIN_TEXT)}`, label };
    }
    case "page": {
      const p = QR_PAGES.find((x) => x.path === r.page);
      if (!p) return { error: "Pick a page." };
      const [path, hash] = p.path.split("#");
      const u = new URL(path, biz.siteUrl);
      u.searchParams.set("utm_source", "qr");
      u.searchParams.set("utm_medium", "print");
      u.searchParams.set("utm_campaign", code);
      return { target: `${u.toString()}${hash ? `#${hash}` : ""}`, label };
    }
    case "review": {
      if (!biz.reviewUrl || !/^https:\/\//.test(biz.reviewUrl)) return { error: "Add your Google review link in Business details first." };
      return { target: biz.reviewUrl, label };
    }
  }
}

/**
 * Checked again on every scan: a stored target is only followed while it still points at this
 * site, the gym's own WhatsApp numbers or its current review link.
 */
export function allowedTarget(target: string, biz: QrBiz): boolean {
  let u: URL;
  try {
    u = new URL(target);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  const site = new URL(biz.siteUrl);
  if (u.host === site.host) return true;
  if (u.host === "wa.me") return [waNumber(biz.botNumber), waNumber(biz.deskNumber)].includes(u.pathname.slice(1));
  return !!biz.reviewUrl && target === biz.reviewUrl;
}

/** The lead source a QR chat gets, e.g. "qr:Ab3dE6fG" (fits leads.source). */
export const qrSource = (code: string) => `qr:${code}`;
