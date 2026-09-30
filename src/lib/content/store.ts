import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { cache } from "react";
import { DEFAULT_CONTENT } from "./defaults";
import type { Lead, SiteContent } from "./types";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient, createPublicClient } from "@/lib/supabase/server";

// Storage backend:
//  - Supabase configured → Postgres tables + the "media" storage bucket.
//    Row-level security decides who may write, so admin writes must use the
//    cookie-bound client of a signed-in admin.
//  - otherwise           → JSON files under .data/ (local development only).
// Reads never throw: on any failure the site falls back to DEFAULT_CONTENT.

const DATA_DIR = path.join(process.cwd(), ".data");

export const storageMode = supabaseConfigured ? "supabase" : "file";

/** Saved values win; any section missing from storage falls back to the default. */
export function mergeContent(saved: Partial<SiteContent> | null | undefined): SiteContent {
  if (!saved || typeof saved !== "object") return DEFAULT_CONTENT;
  const merged = { ...DEFAULT_CONTENT } as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_CONTENT) as (keyof SiteContent)[]) {
    const value = saved[key];
    if (value === undefined || value === null) continue;
    const def = DEFAULT_CONTENT[key];
    merged[key] =
      def && typeof def === "object" && !Array.isArray(def) && typeof value === "object" && !Array.isArray(value)
        ? { ...def, ...value }
        : value;
  }
  return merged as SiteContent;
}

async function readRaw(): Promise<Partial<SiteContent> | null> {
  if (supabaseConfigured) {
    const { data, error } = await createPublicClient().from("site_content").select("content").eq("id", 1).maybeSingle();
    if (error) throw new Error(error.message);
    return (data?.content as Partial<SiteContent>) ?? null;
  }
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, "content.json"), "utf8"));
  } catch {
    return null;
  }
}

export const getContent = cache(async (): Promise<SiteContent> => {
  try {
    return mergeContent(await readRaw());
  } catch (err) {
    console.error("[content] falling back to defaults:", (err as Error).message);
    return DEFAULT_CONTENT;
  }
});

export async function saveContent(content: SiteContent, editor: string): Promise<void> {
  if (supabaseConfigured) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("site_content")
      .upsert({ id: 1, content, updated_at: new Date().toISOString(), updated_by: editor });
    if (error) throw new Error(error.message);
    return;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, "content.json"), JSON.stringify(content, null, 2));
}

// ---------- media ----------

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};
export const ALLOWED_MEDIA = Object.keys(EXT);

/** Stores an image and returns the URL pages should use. */
export async function saveMedia(mime: string, data: Buffer): Promise<string> {
  if (!EXT[mime]) throw new Error("Unsupported image type");
  const id = `${randomUUID()}.${EXT[mime]}`;
  if (supabaseConfigured) {
    const supabase = await createClient();
    const { error } = await supabase.storage.from("media").upload(id, data, { contentType: mime, cacheControl: "31536000" });
    if (error) throw new Error(error.message);
    return supabase.storage.from("media").getPublicUrl(id).data.publicUrl;
  }
  await fs.mkdir(path.join(DATA_DIR, "media"), { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, "media", id), data);
  return `/api/media/${id}`;
}

/** Local-file mode only; Supabase media is served straight from its CDN. */
export async function readMedia(id: string): Promise<{ mime: string; data: Buffer } | null> {
  if (supabaseConfigured || !/^[0-9a-f-]{36}\.(jpg|png|webp|avif|gif)$/.test(id)) return null;
  try {
    const data = await fs.readFile(path.join(DATA_DIR, "media", id));
    const ext = id.split(".").pop()!;
    const mime = Object.entries(EXT).find(([, e]) => e === ext)![0];
    return { mime, data };
  } catch {
    return null;
  }
}

// ---------- leads ----------

type LeadRow = { id: string; created_at: string; name: string; phone: string; goal: string; message: string; source: string };
const fromRow = (r: LeadRow): Lead => ({ id: r.id, createdAt: r.created_at, name: r.name, phone: r.phone, goal: r.goal, message: r.message, source: r.source });

export async function saveLead(input: Omit<Lead, "id" | "createdAt">): Promise<void> {
  if (supabaseConfigured) {
    // Visitors can insert but not read leads, so don't ask for the row back.
    const { error } = await createPublicClient().from("leads").insert(input);
    if (error) throw new Error(error.message);
    return;
  }
  const leads = await listLeads();
  const lead: Lead = { id: randomUUID(), createdAt: new Date().toISOString(), ...input };
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, "leads.json"), JSON.stringify([lead, ...leads], null, 2));
}

export async function listLeads(): Promise<Lead[]> {
  if (supabaseConfigured) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    return (data as LeadRow[]).map(fromRow);
  }
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, "leads.json"), "utf8"));
  } catch {
    return [];
  }
}

export async function deleteLead(id: string): Promise<void> {
  if (supabaseConfigured) {
    const supabase = await createClient();
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  const leads = (await listLeads()).filter((l) => l.id !== id);
  await fs.writeFile(path.join(DATA_DIR, "leads.json"), JSON.stringify(leads, null, 2));
}
