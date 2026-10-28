const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const strip of [true, false]) for (const w of [390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 } });
    const p = await ctx.newPage();
    if (strip) await p.route(u => !u.pathname.startsWith('/_next') , async r => { if (r.request().resourceType() !== 'document') return r.continue(); const res = await r.fetch(); r.fulfill({ response: res, body: (await res.text()).replace(/ cv-auto/g, '') }); });
    for (const [path, a] of [['/', '#newsletter'], ['/library', '#complete'], ['/library', '#combos']]) {
      await p.goto((process.env.BASE || 'http://localhost:3100') + path + a, { waitUntil: 'load' });
      const t = [];
      for (const ms of [300, 1500, 4000]) { await p.waitForTimeout(ms - (t.length ? [300,1500,4000][t.length-1] : 0)); t.push(await p.evaluate(a => Math.round(document.querySelector(a)?.getBoundingClientRect().top ?? -1), a)); }
      const sy = await p.evaluate(() => Math.round(scrollY));
      console.log(JSON.stringify({ strip, w, path, a, tops: t, scrollY: sy }));
    }
    await ctx.close();
  }
  await b.close();
})();
