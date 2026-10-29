#!/usr/bin/env node
// Renders a Premium Library volume: Markdown source -> print-ready A5 PDF, plus the store cover (webp).
//
//   node scripts/library/render-book.mjs --md book.md --meta book.meta.json --volume 61 \
//     --category "Nutrition for Performance" --pdf out/61-x.pdf --cover public/library/covers/vol-61.webp
//
// Book sources are paid content and are NOT kept in this public repo. Keep them in the private
// project files and upload the PDF from /admin → Library (the file name must be <slug>.pdf, max 4 MB).

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import { createRequire } from "node:module";
import sharp from "sharp";

// Same convention as scripts/render-banners.mjs: playwright-core is not a project dependency.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || "playwright-core");

const { values: args } = parseArgs({
  options: {
    md: { type: "string" },
    meta: { type: "string" },
    volume: { type: "string" },
    category: { type: "string" },
    pdf: { type: "string" },
    cover: { type: "string" },
  },
});
for (const k of ["md", "meta", "volume", "category"]) if (!args[k]) throw new Error(`--${k} is required`);

// Cover palettes per library section, matched to the existing covers.
const PALETTES = {
  "Strength & Physique": ["#29221a", "#0b0905"],
  "Nutrition for Performance": ["#182921", "#090c08"],
  "Health & Lifestyle Medicine": ["#13243a", "#060b13"],
  "Psychology & Mindset": ["#241a2c", "#0b070e"],
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** A small Markdown subset: headings, paragraphs, lists, checklists, tables, quotes and [!WARNING]/[!TIP] boxes. */
export function markdownToHtml(md) {
  const lines = md.replace(/\r/g, "").split("\n");
  const out = [];
  const chapters = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const text = h[2].trim();
      if (level === 1) {
        const id = `ch-${chapters.length + 1}-${slugify(text)}`;
        chapters.push({ id, title: text });
        out.push(`<section class="chapter" id="${id}"><p class="ch-num">Chapter ${chapters.length}</p><h1>${inline(text)}</h1></section>`);
      } else out.push(`<h${level}>${inline(text)}</h${level}>`);
      i++;
      continue;
    }
    if (line.startsWith(">")) {
      const block = [];
      while (i < lines.length && lines[i].startsWith(">")) block.push(lines[i++].replace(/^>\s?/, ""));
      const kind = /^\[!(WARNING|TIP)\]\s*(.*)$/.exec(block[0] ?? "");
      if (kind) {
        const rest = [kind[2], ...block.slice(1)].filter((l) => l.trim());
        const title = kind[1] === "WARNING" ? "See a doctor first" : "Coach's tip";
        out.push(`<aside class="box ${kind[1].toLowerCase()}"><p class="box-title">${title}</p>${listOrParas(rest)}</aside>`);
      } else out.push(`<blockquote>${block.map(inline).join(" ")}</blockquote>`);
      continue;
    }
    if (/^\s*\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const body = rows.filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r));
      const [head, ...rest] = body;
      out.push(`<table><thead><tr>${cells(head).map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rest.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const items = [];
      const ordered = /^\s*\d+\./.test(line);
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, ""));
      const tag = ordered ? "ol" : "ul";
      const lis = items.map((t) => {
        const box = /^\[( |x)\]\s+(.*)$/i.exec(t);
        return box ? `<li class="check">${inline(box[2])}</li>` : `<li>${inline(t)}</li>`;
      });
      out.push(`<${tag}>${lis.join("")}</${tag}>`);
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|>|\s*\||\s*([-*]|\d+\.)\s+)/.test(lines[i])) para.push(lines[i++].trim());
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return { html: out.join("\n"), chapters };
}

function listOrParas(lines) {
  if (lines.every((l) => /^\s*[-*]\s+/.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`).join("")}</ul>`;
  return lines.map((l) => (/^\s*[-*]\s+/.test(l) ? `<p>• ${inline(l.replace(/^\s*[-*]\s+/, ""))}</p>` : `<p>${inline(l)}</p>`)).join("");
}

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Cormorant+Garamond:ital,wght@1,400;1,500&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=block" rel="stylesheet">`;

function coverHtml(meta, volume, category, { width, height }) {
  const [top, bottom] = PALETTES[category] ?? PALETTES["Strength & Physique"];
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
  *{box-sizing:border-box;margin:0}
  html,body{width:${width}px;height:${height}px}
  body{background:linear-gradient(180deg,${top},${bottom});color:#f3ecdc;font-family:'Crimson Pro',serif;position:relative;overflow:hidden}
  .f1{position:absolute;inset:${height * 0.036}px ${width * 0.055}px;border:1px solid rgba(201,163,98,.55)}
  .f2{position:absolute;inset:${height * 0.044}px ${width * 0.067}px;border:1px solid rgba(201,163,98,.3)}
  .wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;text-align:center;padding:${height * 0.105}px ${width * 0.15}px 0}
  .brand{font:500 ${width * 0.0183}px Inter;letter-spacing:.32em;color:#c9a362;text-transform:uppercase}
  .badge{margin-top:${height * 0.093}px;padding:${height * 0.011}px ${width * 0.06}px;background:linear-gradient(90deg,#a77b3e,#d8bb79 50%,#a77b3e);color:#1b140b;font:600 ${width * 0.019}px Inter;letter-spacing:.2em;text-transform:uppercase;border:1px solid #e6cf97}
  .badge:before,.badge:after{content:"✦";margin:0 1em;font-size:.8em}
  .cat{margin-top:${height * 0.024}px;font:500 ${width * 0.0183}px Inter;letter-spacing:.26em;text-transform:uppercase;color:#d9d2c2}
  h1{margin-top:${height * 0.02}px;font:400 ${width * 0.07}px/1.12 'Playfair Display',serif;color:#f6efdf}
  .rule{width:${width * 0.15}px;height:1px;background:#c9a362;margin:${height * 0.028}px auto}
  .sub{font:italic 400 ${width * 0.032}px/1.35 'Cormorant Garamond',serif;color:#e5dccb;max-width:${width * 0.66}px}
  .inside{margin-top:${height * 0.06}px;width:${width * 0.65}px;border-top:1px solid rgba(201,163,98,.55);border-bottom:1px solid rgba(201,163,98,.55);padding:${height * 0.016}px 0 ${height * 0.02}px}
  .inside p{font:500 ${width * 0.0167}px Inter;letter-spacing:.26em;color:#c9a362;text-transform:uppercase;margin-bottom:${height * 0.01}px}
  .inside li{list-style:none;font:400 ${width * 0.026}px/1.6 'Crimson Pro',serif;color:#efe7d6;text-align:left;padding-left:${width * 0.1}px;position:relative}
  .inside li:before{content:"◆";position:absolute;left:${width * 0.07}px;color:#c9a362;font-size:.55em;top:.55em}
  .mark{position:absolute;bottom:${height * 0.125}px;left:50%;width:${width * 0.09}px;height:${width * 0.09}px;margin-left:-${width * 0.045}px;border:1px solid #c9a362;transform:rotate(45deg)}
  .mark span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform:rotate(-45deg);font:400 ${width * 0.03}px 'Playfair Display',serif;color:#c9a362}
  .vol{position:absolute;bottom:${height * 0.07}px;left:0;right:0;text-align:center;font:italic 400 ${width * 0.027}px 'Cormorant Garamond',serif;color:#c9a362}
  </style></head><body><div class="f1"></div><div class="f2"></div><div class="wrap">
  <p class="brand">Royal Fitness Club · Premium Library</p>
  <p class="badge">${esc(meta.label)}</p>
  <p class="cat">${esc(category)}</p>
  <h1>${esc(meta.title)}</h1>
  <div class="rule"></div>
  <p class="sub">${esc(meta.subtitle)}</p>
  <div class="inside"><p>Inside this book</p><ul>${meta.benefits.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>
  </div><div class="mark"><span>R</span></div><p class="vol">Volume ${volume}</p></body></html>`;
}

function bookHtml(meta, volume, category, body, chapters, coverPng) {
  const year = new Date().getFullYear();
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
  @page{size:148mm 210mm;margin:18mm 16mm 20mm}
  @page:first{margin:0}
  *{box-sizing:border-box}
  body{font:400 10.6pt/1.55 'Crimson Pro',serif;color:#1d1a16;margin:0}
  .cover{width:148mm;height:210mm;page-break-after:always;overflow:hidden}
  .cover img{display:block;width:148mm;height:210mm;object-fit:cover}
  .front{page-break-after:always;padding-top:30mm;text-align:center}
  .front .t{font:400 22pt/1.2 'Playfair Display',serif;margin:0 0 4mm}
  .front .s{font:italic 400 13pt 'Cormorant Garamond',serif;color:#5a4f40;margin:0 0 14mm}
  .front .m{font:500 7.5pt Inter;letter-spacing:.2em;text-transform:uppercase;color:#8a6a35}
  .legal{page-break-after:always;font-size:8.6pt;line-height:1.5;color:#4a4339;padding-top:90mm}
  .legal h3{font:600 8pt Inter;letter-spacing:.14em;text-transform:uppercase;color:#8a6a35;margin:5mm 0 1.5mm}
  .toc{page-break-after:always}
  .toc h2{font:400 18pt 'Playfair Display',serif;margin:0 0 6mm}
  .toc ol{padding-left:0;list-style:none;counter-reset:c}
  .toc li{counter-increment:c;display:flex;gap:3mm;padding:1.3mm 0;border-bottom:.3pt solid #e4dccb;font-size:10.5pt}
  .toc li:before{content:counter(c,decimal-leading-zero);font:600 8pt Inter;color:#a77b3e;padding-top:1mm;width:7mm}
  .chapter{page-break-before:always;padding-top:12mm;margin-bottom:6mm}
  .ch-num{font:600 7.5pt Inter;letter-spacing:.26em;text-transform:uppercase;color:#a77b3e;margin:0 0 2mm}
  h1{font:400 21pt/1.15 'Playfair Display',serif;margin:0;padding-bottom:4mm;border-bottom:.6pt solid #c9a362}
  h2{font:600 13pt/1.25 'Playfair Display',serif;margin:6mm 0 2mm;page-break-after:avoid}
  h3{font:600 9pt Inter;letter-spacing:.04em;margin:4.5mm 0 1.5mm;color:#3b3226;page-break-after:avoid}
  p{margin:0 0 2.4mm;orphans:2;widows:2}
  ul,ol{margin:0 0 3mm;padding-left:5mm}
  li{margin-bottom:1mm}
  li.check{list-style:none;margin-left:-5mm;padding-left:6mm;position:relative}
  li.check:before{content:"";position:absolute;left:0;top:1.3mm;width:3mm;height:3mm;border:.6pt solid #8a6a35;border-radius:.6mm}
  blockquote{margin:4mm 4mm;padding:0 0 0 4mm;border-left:1.4pt solid #c9a362;font:italic 400 12pt/1.4 'Cormorant Garamond',serif;color:#3b3226;page-break-inside:avoid}
  .box{margin:4mm 0;padding:3mm 4mm;border-radius:1.5mm;page-break-inside:avoid;font-size:9.8pt}
  .box p:last-child,.box ul:last-child{margin-bottom:0}
  .box-title{font:600 7.5pt Inter;letter-spacing:.16em;text-transform:uppercase;margin-bottom:1.5mm}
  .warning{background:#fbf0e6;border:.6pt solid #d9a679}.warning .box-title{color:#a4501f}
  .tip{background:#f2f4ec;border:.6pt solid #b9c59b}.tip .box-title{color:#566b2c}
  table{width:100%;border-collapse:collapse;margin:2mm 0 4mm;font-size:8.6pt;line-height:1.35;page-break-inside:auto}
  tr{page-break-inside:avoid}
  th{font:600 7.4pt Inter;text-align:left;background:#efe8da;padding:1.6mm 1.8mm;border-bottom:.6pt solid #c9a362}
  td{padding:1.5mm 1.8mm;border-bottom:.3pt solid #e4dccb;vertical-align:top}
  code{font-size:.9em}
  </style></head><body>
  <div class="cover"><img src="data:image/jpeg;base64,${coverPng.toString("base64")}" alt=""></div>
  <div class="front"><p class="m">Royal Fitness Club · Premium Library · Volume ${volume}</p><p class="t">${esc(meta.title)}</p><p class="s">${esc(meta.subtitle)}</p><p class="m">${esc(category)}</p></div>
  <div class="legal">
    <p>© ${year} Royal Fitness Club. All rights reserved. This book is licensed to the buyer for personal use. Please don't share, resell or upload it.</p>
    <h3>Important</h3>
    <p>This book is for education. It supports, and never replaces, care from your doctor or another qualified health professional. It contains no medicine doses, cycles or sources. If you have a medical condition, are pregnant or breastfeeding, or take any medicine, talk to your doctor before you change how you eat, train or use supplements.</p>
    <p>Stop exercising and get medical help straight away if you have chest pain, severe breathlessness, fainting, or sudden weakness.</p>
  </div>
  <div class="toc"><h2>Contents</h2><ol>${chapters.map((c) => `<li>${inline(c.title)}</li>`).join("")}</ol></div>
  ${body}
  </body></html>`;
}

const md = readFileSync(args.md, "utf8");
const meta = JSON.parse(readFileSync(args.meta, "utf8"));
const volume = Number(args.volume);
const { html: body, chapters } = markdownToHtml(md);

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
try {
  // The cover is drawn once at print resolution; the store image is a downscaled copy of it.
  const page = await browser.newPage({ viewport: { width: 600, height: 900 }, deviceScaleFactor: 3 });
  await page.setContent(coverHtml(meta, volume, args.category, { width: 600, height: 900 }), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const coverPng = await page.screenshot({ type: "png" });
  await page.close();
  if (args.cover) {
    mkdirSync(dirname(args.cover), { recursive: true });
    writeFileSync(args.cover, await sharp(coverPng).resize(600, 900).webp({ quality: 82 }).toBuffer());
  }
  if (args.pdf) {
    const page = await browser.newPage();
    await page.setContent(bookHtml(meta, volume, args.category, body, chapters, await sharp(coverPng).resize(1200, 1800).jpeg({ quality: 85 }).toBuffer()), { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    mkdirSync(dirname(args.pdf), { recursive: true });
    await page.pdf({
      path: args.pdf,
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `<div style="width:100%;font:7pt Inter,sans-serif;color:#8a6a35;display:flex;justify-content:space-between;padding:0 16mm"><span>${esc(meta.title)}</span><span class="pageNumber"></span></div>`,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify({ slug: meta.slug, chapters: chapters.length, words: md.split(/\s+/).filter(Boolean).length }));
