// Throttled mobile lab run: 390px, Slow-4G-ish (150ms RTT, 1.6 Mbps down, 750 kbps up), CPU 4x. Median of 3.
const { chromium } = require('playwright');
const fs = require('fs');
const B = process.env.BASE || 'https://www.royalfitnesclub.in';
const pages = process.env.PAGES ? process.env.PAGES.split(',') : ['/', '/membership', '/join?plan=monthly', '/programs', '/contact', '/reviews', '/store', '/shop', '/library', '/blog',
  '/blog/gym-fees-in-noida-membership-cost-guide', '/tools', '/exercises', '/diet-plans', '/gallery',
  '/health', '/health/diseases/asthma', '/health/blog/sleep-guide-indians', '/hi/health/blog', '/health/health-calculators'];
const INIT = `window.__lcp=0;window.__cls=0;window.__tbt=0;
new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});
new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value}).observe({type:'layout-shift',buffered:true});
new PerformanceObserver(l=>{for(const e of l.getEntries())window.__tbt+=Math.max(0,e.duration-50)}).observe({type:'longtask',buffered:true});`;
const med = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
(async () => {
  const b = await chromium.launch();
  const out = [];
  for (const p of pages) {
    const runs = [];
    for (let i = 0; i < 3; i++) {
      const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
        userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36 RFC-Phase4-Audit' });
      await ctx.route(/(facebook\.net|facebook\.com\/tr|googlesyndication|doubleclick|google-analytics|googletagmanager|adservice)/, r => r.abort());
      const pg = await ctx.newPage();
      await pg.addInitScript(INIT);
      const cdp = await ctx.newCDPSession(pg);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      try {
        await pg.goto(B + p, { waitUntil: 'load', timeout: 90000 });
        await pg.waitForTimeout(3000);
        const m = await pg.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; const fcp = performance.getEntriesByName('first-contentful-paint')[0];
          return { lcp: Math.round(window.__lcp), cls: +window.__cls.toFixed(3), tbt: Math.round(window.__tbt), ttfb: Math.round(n.responseStart), fcp: fcp ? Math.round(fcp.startTime) : null,
            kb: Math.round(performance.getEntriesByType('resource').reduce((a, r) => a + (r.transferSize || 0), 0) / 1024 + (n.transferSize || 0) / 1024),
            jsKb: Math.round(performance.getEntriesByType('resource').filter(r => r.initiatorType === 'script' || /\.js(\?|$)/.test(r.name)).reduce((a, r) => a + (r.transferSize || 0), 0) / 1024) }; });
        runs.push(m);
      } catch (e) { runs.push({ error: String(e).slice(0, 100) }); }
      await ctx.close();
    }
    const ok = runs.filter(r => !r.error);
    const row = { page: p, n: ok.length };
    for (const k of ['ttfb', 'fcp', 'lcp', 'cls', 'tbt', 'kb', 'jsKb']) row[k] = ok.length ? med(ok.map(r => r[k])) : null;
    out.push(row); console.log(JSON.stringify(row));
  }
  fs.writeFileSync(process.env.OUT || 'perf.json', JSON.stringify(out, null, 1));
  await b.close();
})();
