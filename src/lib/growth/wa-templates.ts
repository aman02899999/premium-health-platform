import "server-only";
import { SITE_URL } from "@/lib/site";
import { TEMPLATES, type MessageKind } from "./messages";
import { sendWhatsAppTemplate, templateMissing, type DocumentHeader, type SendResult } from "./providers";

/** Public URL of a template's banner (its IMAGE header). */
export const bannerUrl = (banner: string) => `${SITE_URL}/brand/banners/${banner}.jpg`;

/**
 * Sends a message kind with its current template: the v3 one with the banner, or, while Meta hasn't
 * approved that yet, the legacy text-only template it replaces (same parameters). Rows queued
 * under an older template name send with the current one, so a long campaign upgrades mid-way.
 */
export async function sendKind(to: string, kind: string, storedName: string, params: string[], doc?: DocumentHeader): Promise<SendResult> {
  const t = (TEMPLATES as Record<string, (typeof TEMPLATES)[MessageKind] | undefined>)[kind];
  if (!t) return sendWhatsAppTemplate(to, storedName, params, doc);
  const res = await sendWhatsAppTemplate(to, t.name, params, doc, !doc && t.header ? bannerUrl(t.header) : undefined);
  if (!res.ok && t.legacy && templateMissing(res.error)) return sendWhatsAppTemplate(to, t.legacy, params, doc);
  return res;
}
