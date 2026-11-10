/**
 * Large files in public/ that are served as static files and only ever fetched by URL, never read
 * from disk by server code. next.config.ts keeps them out of every server function, because on the
 * Vercel Hobby plan oversized functions push a deploy past the 12-function limit and it fails.
 */
export const MEDIA_ONLY_BY_URL = ["public/youtube", "public/social/reels", "public/samples", "public/anatomy"];

/** Any file in public/ at or above this size must live in one of the folders above. */
export const BIG_FILE_BYTES = 1024 * 1024;
