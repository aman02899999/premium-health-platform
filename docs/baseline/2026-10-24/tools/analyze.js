// Summarise results.jsonl into per-page CSV + aggregate stats + link check list.
const fs = require('fs');
const path = require('path');
const rows = fs.readFileSync(path.join(__dirname, 'results.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
const byUrl = new Map();
for (const r of rows) {
  if (!byUrl.has(r.url)) byUrl.set(r.url, {});
  byUrl.get(r.url)[r.width] = r;
}
const section = u => {
  const p = new URL(u).pathname;
  if (p.startsWith('/health/hi') || p.startsWith('/hi')) return 'hindi';
  if (p.startsWith('/health')) return 'health';
  if (p.startsWith('/blog')) return 'gym-blog';
  if (p.startsWith('/shop') || p.startsWith('/store')) return 'store';
  if (p.startsWith('/library')) return 'library';
  if (p.startsWith('/exercises')) return 'exercises';
  return 'gym';
};
const esc = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
const csv = ['url,section,status,final_url,title,h1_count,overflow_widths,console_errors,page_errors,failed_requests,lcp_360,lcp_390,lcp_1280,cls_360,cls_390,cls_1280,longtask_ms_390,ttfb_390,transfer_kb_390,ad_slots,axe_serious_critical,axe_ids,error'];
const agg = { pages: 0, non200: [], overflow: {}, consoleErr: [], pageErr: [], axeSC: 0, axePages: 0, axeIds: {}, lcpOver: [], clsOver: [], adsOutside: [], errors: [], failedReq: {} };
const allLinks = new Set();
for (const [url, w] of byUrl) {
  agg.pages++;
  const r = w[390] || w[360] || Object.values(w)[0];
  const ov = Object.values(w).filter(x => x.overflow).map(x => x.width);
  const ce = new Set(), pe = new Set(), fr = new Set();
  for (const x of Object.values(w)) { x.consoleErrors?.forEach(e => ce.add(e)); x.pageErrors?.forEach(e => pe.add(e)); x.failedRequests?.forEach(e => fr.add(e)); }
  const axe = (w[390]?.axe || []);
  const sc = axe.filter(v => v.impact === 'serious' || v.impact === 'critical');
  sc.forEach(v => { agg.axeIds[v.id + ' (' + v.impact + ')'] = (agg.axeIds[v.id + ' (' + v.impact + ')'] || 0) + 1; });
  if (sc.length) agg.axePages++;
  agg.axeSC += sc.reduce((a, v) => a + v.n, 0);
  if (r.status !== 200) agg.non200.push(`${r.status} ${url}${r.finalUrl && r.finalUrl !== url ? ' -> ' + r.finalUrl : ''}`);
  if (ov.length) { const s = section(url); agg.overflow[url] = { widths: ov, offenders: (w[360] || w[390] || {}).overflowOffenders }; }
  if (ce.size) agg.consoleErr.push([url, [...ce]]);
  if (pe.size) agg.pageErr.push([url, [...pe]]);
  for (const f of fr) { const k = f.replace(/\?.*$/, '').replace(/[0-9a-f]{8,}/g, '*'); agg.failedReq[k] = (agg.failedReq[k] || 0) + 1; }
  const m = [w[360], w[390]].filter(Boolean);
  if (m.some(x => x.lcp > 2500)) agg.lcpOver.push([url, m.map(x => x.lcp)]);
  if (m.some(x => x.cls > 0.1)) agg.clsOver.push([url, m.map(x => x.cls)]);
  const sec = section(url);
  if ((r.adSlots || r.adsScripts) && !['health', 'gym-blog', 'hindi'].includes(sec)) agg.adsOutside.push(url);
  Object.values(w).forEach(x => x.error && agg.errors.push(`${x.width} ${url} ${x.error}`));
  (w[390]?.links || []).forEach(l => allLinks.add(l));
  csv.push([esc(url), sec, r.status, esc(r.finalUrl !== url ? r.finalUrl : ''), esc(r.title), r.h1, esc(ov.join(' ')), ce.size, pe.size, fr.size,
    w[360]?.lcp, w[390]?.lcp, w[1280]?.lcp, w[360]?.cls, w[390]?.cls, w[1280]?.cls, w[390]?.longTaskMs, w[390]?.ttfb, w[390]?.transferKB,
    r.adSlots, sc.reduce((a, v) => a + v.n, 0), esc(sc.map(v => v.id).join(' ')), esc(Object.values(w).map(x => x.error).filter(Boolean)[0] || '')].join(','));
}
fs.writeFileSync(path.join(__dirname, 'pages.csv'), csv.join('\n') + '\n');
fs.writeFileSync(path.join(__dirname, 'links.txt'), [...allLinks].sort().join('\n') + '\n');
const sitemap = new Set(byUrl.keys());
fs.writeFileSync(path.join(__dirname, 'links-not-in-sitemap.txt'), [...allLinks].filter(l => !sitemap.has(l)).sort().join('\n') + '\n');
const top = o => Object.entries(o).sort((a, b) => b[1] - a[1]);
const s = {
  pages: agg.pages, loads: rows.length,
  non200: agg.non200, errors: agg.errors.length, errorSamples: agg.errors.slice(0, 10),
  overflowPages: Object.keys(agg.overflow).length, overflow: agg.overflow,
  consoleErrorPages: agg.consoleErr.length, consoleErrTop: top(agg.consoleErr.flatMap(([, e]) => e).reduce((a, e) => (a[e.slice(0, 140)] = (a[e.slice(0, 140)] || 0) + 1, a), {})).slice(0, 15),
  pageErrorPages: agg.pageErr.length, pageErr: agg.pageErr.slice(0, 20),
  failedReqTop: top(agg.failedReq).slice(0, 20),
  axeSeriousCriticalNodes: agg.axeSC, axePagesWithSC: agg.axePages, axeIds: top(agg.axeIds),
  lcpOverMobile: agg.lcpOver.length, lcpWorst: agg.lcpOver.sort((a, b) => Math.max(...b[1]) - Math.max(...a[1])).slice(0, 15),
  clsOverMobile: agg.clsOver.length, clsWorst: agg.clsOver.sort((a, b) => Math.max(...b[1]) - Math.max(...a[1])).slice(0, 20),
  adsOutsideAllowed: agg.adsOutside,
  internalLinks: allLinks.size, linksNotInSitemap: [...allLinks].filter(l => !sitemap.has(l)).length,
};
fs.writeFileSync(path.join(__dirname, 'summary.json'), JSON.stringify(s, null, 1));
console.log(JSON.stringify({ ...s, overflow: Object.keys(s.overflow).slice(0, 40) }, null, 1).slice(0, 12000));
