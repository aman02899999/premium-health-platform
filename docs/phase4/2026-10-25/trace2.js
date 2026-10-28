// Long tasks during load, each broken down by its biggest child events (with script URL / function).
const { chromium } = require('playwright');
const B = process.env.BASE || 'https://www.royalfitnesclub.in';
(async () => { const b = await chromium.launch();
  for (const p of process.argv.slice(2)) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await ctx.route(/(facebook\.net|facebook\.com\/tr|googlesyndication|doubleclick|google-analytics|googletagmanager|adservice)/, r => r.abort());
    const pg = await ctx.newPage(); const cdp = await ctx.newCDPSession(pg);
    await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 2e5, uploadThroughput: 93750 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await b.startTracing(pg, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline'] });
    await pg.goto(B + p, { waitUntil: 'load', timeout: 90000 }); await pg.waitForTimeout(4000);
    const dom = await pg.evaluate(() => document.querySelectorAll('*').length);
    const ev = JSON.parse((await b.stopTracing()).toString()).traceEvents;
    const main = new Set(); ev.filter(e => e.name === 'thread_name' && e.args.name === 'CrRendererMain').forEach(e => main.add(e.pid + ':' + e.tid));
    const X = ev.filter(e => e.ph === 'X' && main.has(e.pid + ':' + e.tid) && e.dur).sort((a, b) => a.ts - b.ts);
    const t0 = (ev.find(e => e.name === 'navigationStart') || X[0]).ts;
    const tasks = X.filter(e => e.name === 'RunTask' && e.dur > 50000);
    console.log('==', p, 'DOM nodes', dom, 'long tasks', tasks.length);
    for (const t of tasks) {
      const kids = X.filter(e => e !== t && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur && e.name !== 'RunTask');
      // direct-ish children: not contained in another kid
      const top = kids.filter(k => !kids.some(o => o !== k && o.ts <= k.ts && o.ts + o.dur >= k.ts + k.dur && o.dur > k.dur));
      const desc = top.sort((a, b) => b.dur - a.dur).slice(0, 3).map(k => { const d = k.args && (k.args.data || k.args.beginData) || {}; const u = (d.url || (d.stackTrace && d.stackTrace[0] && d.stackTrace[0].url) || '').split('/').pop(); return `${k.name}${d.functionName ? ' ' + d.functionName : ''}${u ? ' ' + u.slice(0, 30) : ''} ${Math.round(k.dur / 1000)}`; });
      console.log(`  @${Math.round((t.ts - t0) / 1000)}ms ${Math.round(t.dur / 1000)}ms: ${desc.join(' | ')}`);
    }
    await ctx.close(); }
  await b.close(); })();
