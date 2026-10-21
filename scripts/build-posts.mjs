// Long-form health posts: content/blog/en/<slug>.md and content/blog/hi/<slug>.md.
// This checks every post against the editorial rules and writes the listing metadata to
// src/health/data/posts-index.generated.ts (bodies are read on the server at build time).
//   node scripts/build-posts.mjs          write the index (runs before every build)
//   node scripts/build-posts.mjs --check  fail if a post breaks a rule or the index is stale
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "content/blog");
const OUT = path.join(ROOT, "src/health/data/posts-index.generated.ts");
const LANGS = ["en", "hi"];

/** A small YAML subset: `key: value`, `key: [a, b]`, and `key:` followed by `  - item` lines. */
export function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: src };
  const data = {};
  let listKey = null;
  for (const raw of m[1].split("\n")) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    const item = raw.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      data[listKey].push(unquote(item[1]));
      continue;
    }
    const kv = raw.match(/^([A-Za-z][\w]*):\s*(.*)$/);
    if (!kv) continue;
    const [, key, value] = kv;
    if (value === "") {
      data[key] = [];
      listKey = key;
    } else if (/^\[.*\]$/.test(value)) {
      data[key] = value.slice(1, -1).split(",").map((v) => unquote(v.trim())).filter(Boolean);
      listKey = null;
    } else {
      data[key] = /^\d+$/.test(value) ? Number(value) : unquote(value);
      listKey = null;
    }
  }
  return { data, body: src.slice(m[0].length) };
}
const unquote = (v) => v.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");

/** "Title | Publisher | Year | URL" */
const source = (s) => {
  const [title = "", publisher = "", year = "", url = ""] = s.split("|").map((x) => x.trim());
  return { title, publisher, year, url };
};

const words = (body) =>
  body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[\[[^\]]*\]\]/g, " ")
    .replace(/[#>*`|:_-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

const REQUIRED = ["title", "hindiTitle", "slug", "category", "tags", "description", "readingTime", "publishedAt", "lastReviewed", "author", "reviewedBy", "reviewStatus", "heroImage", "heroAlt", "sources"];

function check(lang, file, data, body) {
  const errors = [];
  for (const k of REQUIRED) if (data[k] === undefined || data[k] === "" || (Array.isArray(data[k]) && !data[k].length)) errors.push(`missing ${k}`);
  if ((data.related ?? []).length < 3) errors.push("needs 3–5 related internal links (related:)");
  if (data.slug && `${data.slug}.md` !== path.basename(file)) errors.push(`slug "${data.slug}" doesn't match the file name`);
  // Category pages build their URL from the name (lowercase, spaces to hyphens).
  if (lang === "en" && /[&'’/]/.test(String(data.category ?? ""))) errors.push(`category "${data.category}" can't contain &, apostrophes or slashes (it becomes a URL)`);
  if (String(data.description ?? "").length > 160) errors.push(`description is ${String(data.description).length} chars (max 160)`);
  if (data.reviewStatus !== "pending-medical-review" && data.reviewStatus !== "medically-reviewed") errors.push(`reviewStatus must be pending-medical-review`);
  if (data.reviewStatus === "medically-reviewed" && /pending/i.test(String(data.reviewedBy))) errors.push("marked reviewed but reviewedBy is a placeholder");
  const ads = (body.match(/^\s*\[\[ad\]\]\s*$/gm) ?? []).length;
  if (ads > 3) errors.push(`${ads} ads (max 3)`);
  for (const [re, what] of [
    [/^:::answer/m, "a short answer (:::answer)"],
    [/^```\s*mermaid/m, "a Mermaid flowchart"],
    [/^:::mythfact/m, "a myth-vs-fact table (:::mythfact)"],
    [/^:::warning/m, "a when-to-see-a-doctor box (:::warning)"],
    [/^:::faq/m, "an FAQ (:::faq)"],
    [/^:::tip/m, "tips (:::tip)"],
  ])
    if (!re.test(body)) errors.push(`needs ${what}`);
  const images = (body.match(/^!\[[^\]]+\]\([^)]+\)\s*$/gm) ?? []).length;
  if (images < 2) errors.push(`${images} inline images (needs 2, each with alt text)`);
  const faqs = (body.match(/:::faq[\s\S]*?\n:::/)?.[0].match(/^###\s/gm) ?? []).length;
  if (faqs < 4 || faqs > 6) errors.push(`FAQ has ${faqs} questions (4–6)`);
  const n = words(body);
  if (lang === "en" && (n < 2500 || n > 3800)) errors.push(`${n} words (English: 2,500–3,500)`);
  if (lang === "hi" && n < 1500) errors.push(`${n} words (Hindi: 1,500+)`);
  // A claim, not a denial: "don't cure", "isn't a cure", "no proven cure" and "doesn't mean … cure" are fine.
  const claims = body.replace(/(?:\b(?:not|no|never|without|nor)\b|n't)(?:\s+[\w'-]+){0,6}?\s+(?:cures?|cured|guaranteed?)\b/gi, "").replace(/\bcure-all\b/gi, "");
  if (/\b(cures?|cured|guaranteed?)\b/i.test(claims)) errors.push(`contains a cure/guarantee claim: "${claims.match(/.{0,40}\b(?:cures?|cured|guaranteed?)\b.{0,20}/i)?.[0]}"`);
  return { errors, words: n, ads };
}

function headings(body) {
  return [...body.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
}
function faqItems(body) {
  const box = body.match(/:::faq\n([\s\S]*?)\n:::/)?.[1] ?? "";
  return box
    .split(/^###\s+/m)
    .slice(1)
    .map((chunk) => {
      const [q, ...rest] = chunk.split("\n");
      return { q: q.trim(), a: rest.join(" ").replace(/\s+/g, " ").replace(/\*\*|\[|\]\([^)]*\)/g, "").trim() };
    });
}
function takeaways(body) {
  const box = body.match(/:::takeaways[^\n]*\n([\s\S]*?)\n:::/)?.[1] ?? "";
  return [...box.matchAll(/^\s*[-*]\s+(.+)$/gm)].map((m) => m[1].replace(/\*\*/g, "").trim());
}

export function buildIndex() {
  const posts = [];
  const problems = [];
  for (const lang of LANGS) {
    const dir = path.join(DIR, lang);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".md")).sort()) {
      const file = path.join(dir, f);
      const { data, body } = parseFrontmatter(fs.readFileSync(file, "utf8"));
      const { errors, words: n, ads } = check(lang, file, data, body);
      if (errors.length) problems.push(`${lang}/${f}: ${errors.join("; ")}`);
      posts.push({
        lang,
        slug: data.slug,
        title: data.title,
        hindiTitle: data.hindiTitle,
        description: data.description,
        category: data.category,
        tags: data.tags,
        readingTime: data.readingTime,
        publishedAt: data.publishedAt,
        lastReviewed: data.lastReviewed,
        author: data.author,
        reviewedBy: data.reviewedBy,
        reviewStatus: data.reviewStatus,
        heroImage: data.heroImage,
        heroAlt: data.heroAlt,
        sources: (data.sources ?? []).map(source),
        related: (data.related ?? []).map((r) => {
          const [label = "", href = ""] = r.split("|").map((x) => x.trim());
          return { label, href };
        }),
        headings: headings(body),
        takeaways: takeaways(body),
        faqs: faqItems(body),
        words: n,
        ads,
      });
    }
  }
  for (const p of posts.filter((x) => x.lang === "hi")) if (!posts.some((e) => e.lang === "en" && e.slug === p.slug)) problems.push(`hi/${p.slug}.md has no English original`);
  const ts = `// Generated by scripts/build-posts.mjs from content/blog/**. Do not edit by hand.\nimport type { PostMeta } from "@/health/lib/post-types";\n\nexport const POSTS: PostMeta[] = ${JSON.stringify(posts, null, 2)};\n`;
  return { ts, problems, posts };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { ts, problems, posts } = buildIndex();
  const checkOnly = process.argv.includes("--check");
  if (problems.length) {
    console.error(`Post rules broken:\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  if (checkOnly) {
    const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
    if (current !== ts) {
      console.error("posts-index.generated.ts is out of date: run node scripts/build-posts.mjs");
      process.exit(1);
    }
  } else fs.writeFileSync(OUT, ts);
  console.log(`${posts.length} post files OK (${posts.filter((p) => p.lang === "en").length} English, ${posts.filter((p) => p.lang === "hi").length} Hindi)`);
}
