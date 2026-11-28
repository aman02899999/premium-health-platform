const urls = require('fs').readFileSync(__dirname + '/urls.txt', 'utf8').trim().split('\n');
(async () => { const out = []; let i = 0;
  async function w() { while (i < urls.length) { const u = urls[i++]; try { const r = await fetch(u, { redirect: 'manual' }); const h = await r.text();
    const robots = (h.match(/<meta name="robots" content="([^"]*)"/) || [])[1] || ''; const can = (h.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
    const title = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || ''; const desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
    out.push({ u, s: r.status, robots, can, title, dl: desc.length }); } catch (e) { out.push({ u, err: e.message }); } } }
  await Promise.all([w(), w(), w()]);
  const norm = x => x.replace(/\/$/, '');
  console.log('noindex in sitemap:', out.filter(o => /noindex/.test(o.robots)).map(o => o.u));
  console.log('canonical != url:', out.filter(o => o.can && norm(o.can) !== norm(o.u)).map(o => o.u + ' -> ' + o.can).slice(0, 30));
  console.log('no canonical:', out.filter(o => !o.can).map(o => o.u).slice(0, 20));
  const t = {}; out.forEach(o => (t[o.title] = t[o.title] || []).push(o.u)); console.log('dup titles:', Object.entries(t).filter(([k, v]) => v.length > 1).map(([k, v]) => k + ' x' + v.length).slice(0, 20));
  console.log('no/short desc:', out.filter(o => o.dl < 50).map(o => o.u).slice(0, 20));
  console.log('non200:', out.filter(o => o.s !== 200).map(o => o.s + ' ' + o.u));
})();
