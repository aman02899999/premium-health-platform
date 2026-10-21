// Brings a finished article into the long-form post format.
//   node scripts/import-post.mjs content/import/01-dengue-home-care-guide.md dengue-home-care-guide [en|hi]
// Keeps the article body, adds the frontmatter skeleton (review status pending), writes
// content/blog/<lang>/<slug>.md, then runs the post rules so you can see what is still missing
// (short answer box, flowchart, myth-vs-fact table, warning box, FAQ, sources, images, word count).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "./build-posts.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [src, slug, lang = "en"] = process.argv.slice(2);
if (!src || !slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error("Usage: node scripts/import-post.mjs <file.md> <slug> [en|hi]");
  process.exit(1);
}
const out = path.join(ROOT, "content/blog", lang, `${slug}.md`);
if (fs.existsSync(out)) {
  console.error(`${path.relative(ROOT, out)} already exists; edit it instead.`);
  process.exit(1);
}

const raw = fs.readFileSync(path.resolve(src), "utf8").replace(/\r\n/g, "\n");
const { data, body } = parseFrontmatter(raw);
// A leading "# Title" becomes the title; the page renders its own h1.
const h1 = body.match(/^#\s+(.+)\n/);
const title = data.title || h1?.[1].trim() || slug;
const text = h1 ? body.slice(h1[0].length) : body;
const today = new Date().toISOString().slice(0, 10);
const q = (v) => JSON.stringify(String(v ?? ""));

const fm = [
  "---",
  `title: ${q(title)}`,
  `hindiTitle: ${q(data.hindiTitle ?? "")}`,
  `slug: ${slug}`,
  `category: ${data.category ?? "Disease Education"}`,
  `tags: [${(data.tags ?? []).join(", ")}]`,
  `description: ${q(data.description ?? "")}`,
  `readingTime: ${data.readingTime ?? Math.max(1, Math.round(text.split(/\s+/).length / 200))}`,
  `publishedAt: ${data.publishedAt ?? today}`,
  `lastReviewed: ${data.lastReviewed ?? today}`,
  `author: ${lang === "hi" ? "रॉयल फ़िटनेस क्लब हेल्थ डेस्क" : "Royal Fitness Club Health Desk"}`,
  `reviewedBy: ${lang === "hi" ? "डॉक्टर की समीक्षा बाकी" : "Pending medical review"}`,
  "reviewStatus: pending-medical-review",
  `heroImage: /health/posts/${slug}/hero.svg`,
  `heroAlt: ${q(data.heroAlt ?? "")}`,
  "related:",
  "sources:",
  "---",
  "",
].join("\n");

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, fm + text.trim() + "\n");
console.log(`Wrote ${path.relative(ROOT, out)}. Checking it against the post rules:`);
try {
  execFileSync(process.execPath, [path.join(ROOT, "scripts/build-posts.mjs"), "--check"], { stdio: "inherit" });
} catch {
  console.log("Fill in what's listed above (and add an image spec in scripts/post-images.mjs), then run npm run posts.");
}
