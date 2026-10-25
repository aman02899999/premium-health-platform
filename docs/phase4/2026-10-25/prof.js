// CPU profile during load (4x CPU, throttled net): self-time per script URL and top functions.
const { chromium } = require('playwright');
const B = process.env.BASE || 'https://www.royalfitnesclub.in';
(async () => { const b = await chromium.launch();
  for (const p of process.argv.slice(2)) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await ctx.route(/(facebook\.net|facebook\.com\/tr|googlesyndication|doubleclick|google-analytics|googletagmanager|adservice)/, r => r.abort());
    const pg = await ctx.newPage(); const cdp = await ctx.newCDPSession(pg);
    await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 2e5, uploadThroughput: 93750 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
    await pg.goto(B + p, { waitUntil: 'load', timeout: 90000 }); await pg.waitForTimeout(4000);
    const { profile } = await cdp.send('Profiler.stop');
    const dt = {}; const ids = profile.samples; const deltas = profile.timeDeltas; const byId = new Map(profile.nodes.map(n => [n.id, n]));
    for (let i = 0; i < ids.length; i++) { const n = byId.get(ids[i]); const k = n.callFrame.url || '(' + n.callFrame.functionName + ')'; dt[k] = (dt[k] || 0) + deltas[i] / 1000; }
    const fn = {}; for (let i = 0; i < ids.length; i++) { const n = byId.get(ids[i]); if (!n.callFrame.url) continue; const k = n.callFrame.functionName + ' @' + n.callFrame.url.split('/').pop() + ':' + n.callFrame.lineNumber; fn[k] = (fn[k] || 0) + deltas[i] / 1000; }
    console.log('==', p); Object.entries(dt).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => console.log(Math.round(v) + 'ms', k.slice(0, 110)));
    console.log('-- fns'); Object.entries(fn).sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([k, v]) => console.log(Math.round(v) + 'ms', k.slice(0, 110)));
    await ctx.close(); }
  await b.close(); })();
