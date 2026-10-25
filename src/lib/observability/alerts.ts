// What the owner receives when the watchdog finds a problem. Pure builders; watchdog.ts sends them.
import type { Draft } from "@/lib/growth/messages";
import type { Problem } from "./checks";

/** One email per problem per India day: the dedupe key carries the date. */
export function alertDraft(p: Problem, to: string, date: string, adminUrl: string): Draft {
  const body = [`${p.title}.`, p.detail, `What to do: ${p.fix}`, `This alert repeats once a day until it's fixed.`, `[[CTA:Open the admin|${adminUrl}]]`].join("\n\n");
  return { channel: "email", to, toName: "Admin", kind: "admin-alert", subject: `Site alert: ${p.title}`.slice(0, 200), body, template: "", params: [], dedupeKey: `admin-alert:${p.key}:${date}` };
}

/** The same alert as a short Telegram message. */
export const telegramText = (p: Problem) => `⚠️ Royal Fitness site: ${p.title}\n${p.detail}\nWhat to do: ${p.fix}`.slice(0, 1000);

/** What anyone may see at /api/status: whether it's healthy and which checks fail, no details. */
export const publicStatus = (problems: Problem[]) => ({ ok: problems.length === 0, failing: problems.map((p) => p.key) });
