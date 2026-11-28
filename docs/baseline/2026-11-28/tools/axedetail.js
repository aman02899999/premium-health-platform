const { chromium } = require('playwright');
const AXE = require('fs').readFileSync(__dirname + '/node_modules/axe-core/axe.min.js', 'utf8');
(async () => {
  const b = await chromium.launch();
  for (const p of process.argv.slice(2)) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, isMobile: true });
    await ctx.route(/(facebook|googlesyndication|doubleclick|google-analytics|googletagmanager)/, r => r.abort());
    const page = await ctx.newPage();
    await page.goto('https://www.royalfitnesclub.in' + p, { waitUntil: 'load' }); await page.waitForTimeout(1500);
    await page.addScriptTag({ content: AXE });
    const v = await page.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] })).violations.filter(v => ['serious','critical'].includes(v.impact)).map(v => ({ id: v.id, nodes: v.nodes.slice(0, 4).map(n => n.html.slice(0, 220) + ' || ' + (n.failureSummary||'').split('\n').slice(1,2).join('').slice(0,160)) })));
    console.log('### ' + p); console.log(JSON.stringify(v, null, 1));
    await ctx.close();
  }
  await b.close();
})();
