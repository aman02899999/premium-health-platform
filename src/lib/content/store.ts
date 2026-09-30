import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { cache } from "react";
import { Pool } from "pg";
import { DEFAULT_CONTENT } from "./defaults";
import type { Lead, SiteContent } from "./types";

// Storage backend:
//  - DATABASE_URL set → PostgreSQL (tables are created on first use)
//  - otherwise        → JSON files under .data/ (fine for local dev / a VPS;
//                       read-only serverless hosts need DATABASE_URL)
// Reads never throw: on any failure the site falls back to DEFAULT_CONTENT.

const DATA_DIR = path.join(process.cwd(), ".data");
const databaseUrl = process.env.DATABASE_URL;

const globalForPg = globalThis as typeof globalThis & { __royalPool?: Pool; __royalSchema?: Promise<void> };

function pool(): Pool | null {
  if (!databaseUrl) return null;
  if (!globalForPg.__royalPool) {
    const p = new Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 4000, max: 5 });
    p.on("error", () => {});
    globalForPg.__royalPool = p;
  }
  return globalForPg.__royalPool;
}

async function ensureSchema(p: Pool) {
  globalForPg.__royalSchema ??= p
    .query(
      `CREATE TABLE IF NOT EXISTS site_kv (key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
       CREATE TABLE IF NOT EXISTS site_media (id text PRIMARY KEY, mime text NOT NULL, data bytea NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
       CREATE TABLE IF NOT EXISTS site_leads (id text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), data jsonb NOT NULL);`,
    )
    .then(() => undefined)
    .catch((err) => {
      globalForPg.__royalSchema = undefined;
      throw err;
    });
  return globalForPg.__royalSchema;
}

export const storageMode = databaseUrl ? "postgres" : "file";

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
  const p = pool();
  if (p) {
    await ensureSchema(p);
    const res = await p.query("SELECT value FROM site_kv WHERE key = 'content'");
    return res.rows[0]?.value ?? null;
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

export async function saveContent(content: SiteContent): Promise<void> {
  const p = pool();
  if (p) {
    await ensureSchema(p);
    await p.query(
      `INSERT INTO site_kv (key, value, updated_at) VALUES ('content', $1, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [JSON.stringify(content)],
    );
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

export async function saveMedia(mime: string, data: Buffer): Promise<string> {
  if (!EXT[mime]) throw new Error("Unsupported image type");
  const id = `${randomUUID()}.${EXT[mime]}`;
  const p = pool();
  if (p) {
    await ensureSchema(p);
    await p.query("INSERT INTO site_media (id, mime, data) VALUES ($1, $2, $3)", [id, mime, data]);
  } else {
    await fs.mkdir(path.join(DATA_DIR, "media"), { recursive: true });
    await fs.writeFile(path.join(DATA_DIR, "media", id), data);
  }
  return `/api/media/${id}`;
}

export async function readMedia(id: string): Promise<{ mime: string; data: Buffer } | null> {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|avif|gif)$/.test(id)) return null;
  const p = pool();
  if (p) {
    await ensureSchema(p);
    const res = await p.query("SELECT mime, data FROM site_media WHERE id = $1", [id]);
    return res.rows[0] ?? null;
  }
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

export async function saveLead(input: Omit<Lead, "id" | "createdAt">): Promise<Lead> {
  const lead: Lead = { id: randomUUID(), createdAt: new Date().toISOString(), ...input };
  const p = pool();
  if (p) {
    await ensureSchema(p);
    await p.query("INSERT INTO site_leads (id, created_at, data) VALUES ($1, $2, $3)", [lead.id, lead.createdAt, JSON.stringify(lead)]);
    return lead;
  }
  const leads = await listLeads();
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, "leads.json"), JSON.stringify([lead, ...leads], null, 2));
  return lead;
}

export async function listLeads(): Promise<Lead[]> {
  const p = pool();
  if (p) {
    await ensureSchema(p);
    const res = await p.query("SELECT data FROM site_leads ORDER BY created_at DESC LIMIT 500");
    return res.rows.map((r) => r.data as Lead);
  }
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, "leads.json"), "utf8"));
  } catch {
    return [];
  }
}

export async function deleteLead(id: string): Promise<void> {
  const p = pool();
  if (p) {
    await ensureSchema(p);
    await p.query("DELETE FROM site_leads WHERE id = $1", [id]);
    return;
  }
  const leads = (await listLeads()).filter((l) => l.id !== id);
  await fs.writeFile(path.join(DATA_DIR, "leads.json"), JSON.stringify(leads, null, 2));
}
