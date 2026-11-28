const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const posts = [];
  await ctx.route(() => true, async (r) => { const q = r.request(); const u = q.url();
    if (/(facebook|googlesyndication|doubleclick|google-analytics|googletagmanager)/.test(u)) return r.abort();
    if (q.method() !== 'GET' && u.includes('royalfitnesclub.in') && !u.includes('/_next/')) { posts.push(new URL(u).pathname + ' ' + (q.postData()||'').slice(0,300)); return r.fulfill({ status: 400, contentType: 'application/json', body: '{"error":"MOCK-BLOCKED"}' }); }
    return r.continue(); });
  const page = await ctx.newPage();
  await page.goto('https://www.royalfitnesclub.in/diet-chart?plan=trial#order', { waitUntil: 'networkidle' });
  const form = page.locator('form').filter({ has: page.locator('input[autocomplete=name]') }).first();
  await form.locator('input[autocomplete=name]').fill('Audit Test');
  await form.locator('input[type=tel]').fill('9999999999');
  await form.locator('input[type=email]').fill('audit@example.com');
  const nums = form.locator('input[type=number]:visible');
  const vals = ['30', '170', '75', '70', '80', '80', '80', '80'];
  for (let i = 0; i < await nums.count(); i++) await nums.nth(i).fill(vals[i] || '80');
  await form.getByRole('radio', { name: 'male', exact: true }).click(); await form.locator('input[type=checkbox][required]').check();
  const submit = form.locator('button[type=submit]');
  console.log('submit visible', await submit.isVisible(), 'disabled', await submit.isDisabled(), await submit.innerText());
  await submit.scrollIntoViewIfNeeded();
  await submit.click({ timeout: 8000 }).catch(e => console.log('CLICK FAIL', e.message.split('\n').slice(0,8).join(' | ')));
  await page.waitForTimeout(3000);
  console.log('invalid', await form.evaluate(f => [...f.querySelectorAll(':invalid')].map(e => (e.name||e.type)+':'+e.validationMessage)));
  console.log('posts', posts, 'shown', await page.evaluate(() => document.body.innerText.includes('MOCK-BLOCKED')));
  await page.screenshot({ path: 'diet.png', fullPage: false });
  await b.close();
})();
