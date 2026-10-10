import "server-only";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { getContent } from "@/lib/content/store";
import { fullAddress, SITE_URL } from "@/lib/site";
import { DEFAULT_COACH, DEFAULT_PROFILE } from "@/lib/diet-pro/defaults";
import { targets } from "@/lib/diet-pro/engine";
import { lifestyle, supplements, training } from "@/lib/diet-pro/guidance";
import { planLabels } from "@/lib/diet-pro/labels";
import { planDays } from "@/lib/diet-pro/meals";
import { buildPlanPdf, type PdfAssets } from "@/lib/diet-pro/pdf-core";
import { dietPlan } from "./config";
import { intakeToProfile } from "./diet-intake";
import type { DietOrder } from "./diet-orders";

// Builds a paid order's plan on the server: the same Diet Pro engine and the same branded PDF
// the coach gets from the "Branded PDF" button, from the answers the client gave at checkout.

/** A file from /public: from disk when it is bundled, otherwise over HTTP from the live site. */
async function publicFile(rel: string): Promise<Buffer | null> {
  const clean = rel.replace(/^\/+/, "");
  if (!/^[a-z0-9/_.-]+$/i.test(clean) || clean.includes("..")) return null;
  try {
    return await fs.readFile(path.join(process.cwd(), "public", clean));
  } catch {
    try {
      const res = await fetch(`${SITE_URL}/${clean}`, { signal: AbortSignal.timeout(8000) });
      return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
    } catch {
      return null;
    }
  }
}

const dataUrl = (buf: Buffer | null, mime = "image/png") => (buf ? `data:${mime};base64,${buf.toString("base64")}` : null);

/** The coach photo as a round PNG, cropped to head and shoulders like the browser version. */
async function roundPhoto(src: string): Promise<string | null> {
  if (!src) return null;
  try {
    const buf = /^https?:\/\//.test(src) ? Buffer.from(await (await fetch(src, { signal: AbortSignal.timeout(8000) })).arrayBuffer()) : await publicFile(src);
    if (!buf) return null;
    const img = sharp(buf);
    const { width = 0, height = 0 } = await img.metadata();
    if (!width || !height) return null;
    const side = Math.round(Math.min(width, height) * 0.55);
    const left = Math.round((width - side) / 2);
    const top = Math.round(Math.min(height - side, Math.max(0, height * 0.42 - side / 2)));
    const size = 320;
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`);
    const out = await img.extract({ left, top, width: side, height: side }).resize(size, size).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
    return dataUrl(out);
  } catch {
    return null;
  }
}

/** The note on page 1, by package. */
export function autoCoachNote(planId: string, firstName: string): string {
  const p = dietPlan(planId);
  if (p.trial) return `Welcome, ${firstName}! This is your 7-day trial, built on your own numbers. Follow it exactly for 7 days, fill the tracker each morning, and send it to me on Day 7 — we'll review your week together and plan what comes next.`;
  const checkIn = p.checkIns > 0 ? ` In 2 weeks I'll message you for your weight and waist, and update this plan for you.` : " Message me on WhatsApp with any question.";
  return `Welcome, ${firstName}! Start tomorrow morning: follow the diet chart, drink your water and hit your daily steps. Don't aim for perfect — aim for 5 good days out of 7.${checkIn}`;
}

export async function renderOrderPlan(order: DietOrder): Promise<{ pdf: Buffer; filename: string }> {
  const c = await getContent();
  const b = c.business;
  const head = c.trainers?.[0];
  const client = intakeToProfile(order.name, order.intake, DEFAULT_PROFILE);
  const T = targets(client);
  const days = planDays(T, client, 7);
  const firstName = order.name.trim().split(/\s+/)[0] || order.name;
  const assets: PdfAssets = {
    logo: dataUrl(await publicFile("/brand/logo-full.png")),
    mark: dataUrl(await publicFile("/brand/logo-mark.png")),
    photo: await roundPhoto(head?.image || ""),
  };
  const { doc, filename } = await buildPlanPdf(
    {
      client,
      t: T,
      days,
      training: training({ ...client, goal: T.goal }),
      supplements: supplements(client),
      lifestyle: lifestyle(client),
      business: { name: b.name, phone: b.phone, address: fullAddress(b), instagram: b.instagram, site: SITE_URL.replace(/^https?:\/\//, "") },
      coach: { name: head?.name || "Aman Sharma", ...DEFAULT_COACH, photo: head?.image || "" },
      coachNote: autoCoachNote(order.plan, firstName),
      extras: { roadmap: true, grocery: true, tracker: true },
      bodyImage: null,
      labels: planLabels(client, T),
      trial: Boolean(dietPlan(order.plan).trial),
    },
    assets,
  );
  return { pdf: Buffer.from(doc.output("arraybuffer")), filename };
}
