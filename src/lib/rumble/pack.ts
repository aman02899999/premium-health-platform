// The weekly Rumble pack. Rumble gives upload API keys only by request (bd@rumble.com, Nov 2026)
// and its terms ban unapproved automated uploads, so until a key arrives the GitHub runner keeps a
// copy of every video it puts on YouTube, and the workflow attaches them to one GitHub release per
// week ("rumble-2026-W47"). The owner opens that release on their phone, downloads each MP4 and
// pastes the title and description shown beside it into Rumble's Upload Video form.
// Pure functions only, so they are tested without files or the network.
import type { VideoMeta } from "@/lib/youtube/client";

/** The IST calendar date (YYYY-MM-DD) for an instant. */
export function istDate(now: Date): string {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

/** ISO-8601 week of an IST date, e.g. "2026-W47". Weeks start on Monday. */
export function isoWeek(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day); // the Thursday of this week decides the year
  const year = d.getUTCFullYear();
  const week = Math.ceil(((d.getTime() - Date.UTC(year, 0, 1)) / 86_400_000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export const releaseTag = (now: Date) => `rumble-${isoWeek(istDate(now))}`;

/** A file name that sorts by date and is safe in a URL: "2026-11-16-short-slot1-viral-nimbu-pani.mp4". */
export function packFileName(now: Date, label: string, id: string): string {
  const safe = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "video";
  return `${istDate(now)}-${safe(label)}-${safe(id)}.mp4`;
}

/** Longest run of backticks in a text, so a fenced block can always hold it unchanged. */
function fence(text: string): string {
  const longest = Math.max(2, ...Array.from(text.matchAll(/`+/g), (m) => m[0].length));
  return "`".repeat(longest + 1);
}

/**
 * One video's entry in the release notes. Title and description sit in their own code blocks
 * because GitHub shows a copy button on each, which is the easiest way to copy on a phone.
 */
export function noteEntry(fileName: string, meta: Pick<VideoMeta, "title" | "description" | "tags">, youtubeUrl: string): string {
  const tags = meta.tags.slice(0, 10).join(", ");
  const f1 = fence(meta.title), f2 = fence(meta.description);
  return [
    `### ${fileName}`,
    `On YouTube: ${youtubeUrl}`,
    "",
    "Title:",
    f1, meta.title, f1,
    "",
    "Description:",
    f2, meta.description, f2,
    ...(tags ? ["", `Tags: ${tags}`] : []),
    "",
  ].join("\n");
}

export const RELEASE_INTRO = [
  "Videos that went on YouTube this week, ready for Rumble.",
  "",
  "For each video below: download the MP4 from **Assets** at the bottom, open studio.rumble.com → Create → Upload Video, pick the file, then copy the title and description from here.",
  "",
  "Shorts are vertical and under 90 seconds, so Rumble files them under Shorts by itself.",
  "",
].join("\n");
