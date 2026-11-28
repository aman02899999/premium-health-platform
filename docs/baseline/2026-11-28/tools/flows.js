// Fill and submit the first visible form on each page. Every non-GET request to the site is mocked
// with a 400 {error:"MOCK-BLOCKED"}, so nothing real is created (no orders, leads or messages).
const { chromium } = require('playwright');
const pages = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  for (const p of pages) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const posts = [];
    await ctx.route(() => true, async (r) => {
      const req = r.request();
      const u = req.url();
      if (/(facebook\.net|facebook\.com\/tr|googlesyndication|doubleclick|google-analytics|googletagmanager)/.test(u)) return r.abort();
      if (req.method() !== 'GET' && u.includes('royalfitnesclub.in') && !u.includes('/_next/')) {
        posts.push(req.method() + ' ' + new URL(u).pathname + ' ' + (req.postData() || '').slice(0, 160));
        return r.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'MOCK-BLOCKED' }) });
      }
      return r.continue();
    });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message.slice(0, 150)));
    page.on('console', (m) => m.type() === 'error' && errs.push('CONSOLE ' + m.text().slice(0, 150)));
    await page.goto('https://www.royalfitnesclub.in' + p, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => errs.push('GOTO ' + e.message.slice(0, 100)));
    let result = 'no visible form';
    for (const f of await page.$$('form')) {
      if (!(await f.isVisible())) continue;
      for (const i of await f.$$('input:not([type=hidden]):not([type=radio]):not([type=checkbox]), textarea, select')) {
        if (!(await i.isVisible())) continue;
        const t = (await i.getAttribute('type')) || (await i.evaluate((e) => e.tagName.toLowerCase()));
        const ac = (await i.getAttribute('autocomplete')) || '';
        try {
          if (t === 'select') { const o = await i.$$eval('option', (os) => os.map((o) => o.value).filter(Boolean)); if (o[0]) await i.selectOption(o[0]); }
          else if (t === 'tel' || /tel/.test(ac)) await i.fill('9999999999');
          else if (t === 'email') await i.fill('audit@example.com');
          else if (t === 'number') await i.fill('30');
          else if (t === 'date') await i.fill(new Date(Date.now() + 864e5 * 3).toISOString().slice(0, 10));
          else if (t !== 'file') await i.fill('Audit Test');
        } catch {}
      }
      for (const c of await f.$$('input[type=checkbox][required]')) await c.check().catch(() => {});
      const btn = await f.$('button[type=submit], button:not([type]), input[type=submit]');
      if (!btn) continue;
      const label = (await btn.innerText().catch(() => '')).trim().slice(0, 40);
      await btn.click({ timeout: 5000 }).catch((e) => errs.push('CLICK ' + e.message.slice(0, 80)));
      await page.waitForTimeout(2500);
      const invalid = await f.evaluate((fm) => [...fm.querySelectorAll(':invalid')].map((e) => (e.name || e.id || e.type) + ':' + e.validationMessage).slice(0, 3)).catch(() => []);
      const shown = await page.evaluate(() => document.body.innerText.includes('MOCK-BLOCKED'));
      result = `btn="${label}" invalid=${JSON.stringify(invalid)} errorShownToUser=${shown}`;
      break;
    }
    console.log(JSON.stringify({ p, result, posts, errs: errs.slice(0, 6) }));
    await ctx.close();
  }
  await b.close();
})();
