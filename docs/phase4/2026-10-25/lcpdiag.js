// Which element is LCP, which resource, and when did it start/finish loading. Throttled mobile, 1 run.
const { chromium } = require('playwright');
const B = process.env.BASE || 'https://www.royalfitnesclub.in';
const pages = process.argv.slice(2);
const INIT = `window.__lcpE=null;new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lcpE={t:e.startTime,url:e.url,size:e.size,tag:e.element&&e.element.tagName,cls:e.element&&String(e.element.className).slice(0,120),txt:e.element&&(e.element.textContent||'').slice(0,60),rt:e.renderTime,lt:e.loadTime}}).observe({type:'largest-contentful-paint',buffered:true});
window.__shifts=[];new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__shifts.push({v:+e.value.toFixed(4),t:Math.round(e.startTime),src:(e.sources||[]).map(s=>s.node&&(s.node.tagName+'.'+String(s.node.className).slice(0,60)))})}).observe({type:'layout-shift',buffered:true});`;
(async () => {
  const b = await chromium.launch();
  for (const p of pages) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await ctx.route(/(facebook\.net|facebook\.com\/tr|googlesyndication|doubleclick|google-analytics|googletagmanager|adservice)/, r => r.abort());
    const pg = await ctx.newPage(); await pg.addInitScript(INIT);
    const cdp = await ctx.newCDPSession(pg); await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 2e5, uploadThroughput: 93750 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await pg.goto(B + p, { waitUntil: 'load', timeout: 90000 }); await pg.waitForTimeout(3000);
    const r = await pg.evaluate(() => { const e = window.__lcpE; const res = e && e.url ? performance.getEntriesByName(e.url)[0] : null;
      const big = performance.getEntriesByType('resource').sort((a,b)=>b.transferSize-a.transferSize).slice(0,6).map(x=>({u:x.name.slice(0,110),kb:Math.round(x.transferSize/1024),st:Math.round(x.startTime),end:Math.round(x.responseEnd)}));
      return { lcp: e, res: res && { start: Math.round(res.startTime), end: Math.round(res.responseEnd), kb: Math.round(res.transferSize / 1024) }, shifts: window.__shifts, big }; });
    console.log(p, JSON.stringify(r, null, 1));
    await ctx.close();
  }
  await b.close();
})();
