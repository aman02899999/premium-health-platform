import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/health/db";
import { newsItems } from "@/health/db/schema";
import { dataSyncJobs } from "@/health/db/health-schema";
import type { NewsItem } from "@/health/types";
import { LIVE_FETCHERS, type LiveSource } from "./live-sources";

export type SyncResult = { source: LiveSource; ok: boolean; items: number; error?: string };

const JOB = { provider: "live-sources", jobType: "daily-news-sync" } as const;

function row(n: NewsItem) {
  return {
    slug: n.slug,
    title: n.title.slice(0, 320),
    summary: n.summary,
    category: n.category,
    kind: n.kind,
    body: { summary: n.summary, body: n.body, keyTakeaways: n.keyTakeaways, tags: n.tags, relatedDiseases: n.relatedDiseases, relatedLabs: n.relatedLabs, relatedHerbs: n.relatedHerbs, factCheckNote: n.factCheckNote },
    sourceName: n.sourceName.slice(0, 255),
    sourceUrl: n.sourceUrl,
    status: "published",
    author: n.author.slice(0, 255),
    reviewer: n.reviewer.slice(0, 255),
    publishedAt: new Date(n.publishedAt),
    updatedAt: new Date(n.updatedAt),
  };
}

/** When the last successful sync finished, or null. */
export async function lastSyncAt(): Promise<Date | null> {
  try {
    const [last] = await db
      .select({ at: dataSyncJobs.completedAt })
      .from(dataSyncJobs)
      .where(sql`${dataSyncJobs.provider} = ${JOB.provider} and ${dataSyncJobs.status} = 'done'`)
      .orderBy(desc(dataSyncJobs.completedAt))
      .limit(1);
    return last?.at ?? null;
  } catch {
    return null;
  }
}

/** Pulls every live source and upserts the items. One failing source never blocks the others. */
export async function runLiveSync(): Promise<SyncResult[]> {
  const startedAt = new Date();
  const [job] = await db.insert(dataSyncJobs).values({ ...JOB, status: "running", startedAt }).returning({ id: dataSyncJobs.id });
  const results: SyncResult[] = [];
  for (const source of Object.keys(LIVE_FETCHERS) as LiveSource[]) {
    try {
      const items = await LIVE_FETCHERS[source]();
      for (const n of items) {
        const r = row(n);
        await db.insert(newsItems).values(r).onConflictDoUpdate({ target: newsItems.slug, set: { ...r, slug: undefined } });
      }
      results.push({ source, ok: true, items: items.length });
    } catch (err) {
      results.push({ source, ok: false, items: 0, error: (err as Error).message.slice(0, 200) });
    }
  }
  const failed = results.filter((r) => !r.ok).length;
  await db
    .update(dataSyncJobs)
    .set({ status: failed === results.length ? "failed" : "done", completedAt: new Date(), total: results.reduce((s, r) => s + r.items, 0), progress: results.length - failed, logs: results, error: failed ? results.filter((r) => !r.ok).map((r) => `${r.source}: ${r.error}`).join("; ") : null })
    .where(eq(dataSyncJobs.id, job.id));
  return results;
}
