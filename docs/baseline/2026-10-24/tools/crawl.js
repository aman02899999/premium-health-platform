// Phase 0 crawl: every sitemap URL at 4 widths. Read-only: GET pages, no clicks, no form submits.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const AXE = fs.readFileSync(path.join(__dirname, 'node_modules/axe-core/axe.min.js'), 'utf8');

const urls = fs.readFileSync(path.join(__dirname, 'urls.txt'), 'utf8').trim().split('\n');
const widths = (process.env.WIDTHS || '360,390,768,1280').split(',').map(Number);
const CONC = Number(process.env.CONC || 4);
const out = fs.createWriteStream(path.join(__dirname, process.env.OUT || 'results.jsonl'), { flags: 'a' });
const done = new Set();
try {
  for (const l of fs.readFileSync(path.join(__dirname, process.env.OUT || 'results.jsonl'), 'utf8').split('\n')) {
    if (l) { const r = JSON.parse(l); done.add(r.url + '|' + r.width); }
  }
} catch {}

const PERF_INIT = `
window.__lcp = 0; window.__cls = 0; window.__lt = 0;
try {
  new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt += Math.max(0, e.duration - 50); }).observe({ type: 'longtask', buffered: true });
} catch (e) {}
`;

async function run() {
  const browser = await chromium.launch();
  const jobs = [];
  for (const u of urls) for (const w of widths) if (!done.has(u + '|' + w)) jobs.push([u, w]);
  console.log('jobs', jobs.length);
  let i = 0;
  async function worker() {
    while (i < jobs.length) {
      const [url, width] = jobs[i++];
      const ctx = await browser.newContext({
        viewport: { width, height: width < 800 ? 800 : 900 },
        isMobile: width < 800, hasTouch: width < 800, deviceScaleFactor: 1,
        userAgent: width < 800
          ? 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36 RFC-Phase0-Audit'
          : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 RFC-Phase0-Audit',
      });
      // Block analytics/ads pixels so the audit doesn't pollute Meta/AdSense/GA data.
      await ctx.route(/(facebook\.net|facebook\.com\/tr|googlesyndication|doubleclick|google-analytics|googletagmanager|adservice)/, r => r.abort());
      const page = await ctx.newPage();
      await page.addInitScript(PERF_INIT);
      const rec = { url, width, consoleErrors: [], pageErrors: [], failedRequests: [] };
      page.on('console', m => { if (m.type() === 'error') rec.consoleErrors.push(m.text().slice(0, 300)); });
      page.on('pageerror', e => rec.pageErrors.push(String(e.message || e).slice(0, 300)));
      page.on('requestfailed', r => {
        const f = r.failure()?.errorText || '';
        if (!/ERR_ABORTED|ERR_FAILED/.test(f) || !/(facebook|google|doubleclick)/.test(r.url())) rec.failedRequests.push(r.url().slice(0, 200) + ' ' + f);
      });
      page.on('response', r => {
        const s = r.status();
        if (s >= 400 && r.url().includes('royalfitnesclub.in')) rec.failedRequests.push(s + ' ' + r.url().slice(0, 200));
      });
      const t0 = Date.now();
      try {
        const resp = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
        rec.status = resp ? resp.status() : null;
        rec.finalUrl = page.url();
        await page.waitForTimeout(1500);
        rec.loadMs = Date.now() - t0;
        Object.assign(rec, await page.evaluate(() => {
          const de = document.documentElement;
          const vw = de.clientWidth;
          const offenders = [];
          if (de.scrollWidth > vw + 1) {
            for (const el of document.querySelectorAll('body *')) {
              const r = el.getBoundingClientRect();
              if (r.right > vw + 1 && r.width > 0 && getComputedStyle(el).position !== 'fixed') {
                offenders.push((el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '')).slice(0, 80) + ' r=' + Math.round(r.right));
                if (offenders.length >= 5) break;
              }
            }
          }
          const nav = performance.getEntriesByType('navigation')[0];
          const links = [...new Set([...document.querySelectorAll('a[href]')].map(a => a.href).filter(h => h.startsWith(location.origin)).map(h => h.split('#')[0]))];
          return {
            title: document.title, h1: document.querySelectorAll('h1').length,
            scrollWidth: de.scrollWidth, clientWidth: vw, overflow: de.scrollWidth > vw + 1, overflowOffenders: offenders,
            lcp: Math.round(window.__lcp), cls: Math.round(window.__cls * 1000) / 1000, longTaskMs: Math.round(window.__lt),
            ttfb: nav ? Math.round(nav.responseStart) : null,
            transferKB: Math.round(performance.getEntriesByType('resource').reduce((a, r) => a + (r.transferSize || 0), 0) / 1024),
            adsScripts: [...document.scripts].filter(s => /adsbygoogle|googlesyndication/.test(s.src)).length,
            adSlots: document.querySelectorAll('ins.adsbygoogle').length,
            links: links,
          };
        }));
        if (width === 390) {
          await page.addScriptTag({ content: AXE });
          rec.axe = await page.evaluate(async () => {
            const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'], resultTypes: ['violations'] });
            return r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length }));
          });
        } else delete rec.links;
      } catch (e) {
        rec.error = String(e.message || e).slice(0, 300);
      }
      out.write(JSON.stringify(rec) + '\n');
      await ctx.close();
      if (i % 50 === 0) console.log(i, '/', jobs.length);
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  await browser.close();
}
run();
