const links = require('fs').readFileSync(__dirname + '/links.txt', 'utf8').trim().split('\n');
(async () => { let i = 0; const bad = [];
  async function w() { while (i < links.length) { const u = links[i++]; try { const r = await fetch(u, { redirect: 'manual' }); if (r.status !== 200) bad.push(r.status + ' ' + u + (r.headers.get('location') ? ' -> ' + r.headers.get('location') : '')); } catch (e) { bad.push('ERR ' + u); } } }
  await Promise.all([w(), w(), w()]); console.log(links.length, 'links;', bad.length, 'non-200'); console.log(bad.join('\n')); })();
