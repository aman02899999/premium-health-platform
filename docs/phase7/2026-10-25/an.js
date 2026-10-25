const fs=require('fs'); const P=JSON.parse(fs.readFileSync(process.argv[2]));
const type=u=>{const m=u.match(/\/(hi\/health\/blog|diseases|blog|herbs|lab-tests|symptoms|nutrition|news|medicines|ayurveda)\//);return m?m[1]:'?'};
const dose=/\b\d+(\.\d+)?\s?[–-]?\s?\d*\s?(mg|mcg|µg|IU|ml|mL|g)\b(?!\/dL)[^.\n]{0,30}/g;
const cure=/\b(cures?|cured|guarantee[d]?|permanent(ly)? (cure|relief)|reverses?|100%|miracle|eliminates?)\b/gi;
const stat=/\b\d+(\.\d+)?\s?(%|crore|lakh|million|M\+|in \d+)/g;
const sh=t=>{const w=t.toLowerCase().match(/[a-zऀ-ॿ]+/g)||[];const s=new Set();for(let i=0;i+5<=w.length;i++)s.add(w.slice(i,i+5).join(' '));return s};
const ok=P.filter(p=>!p.error);
ok.forEach(p=>{p.t=type(p.u);p.sh=sh(p.text);p.doses=[...new Set((p.text.match(dose)||[]).map(s=>s.trim()))];p.cures=[...new Set((p.text.match(cure)||[]).map(s=>s.toLowerCase()))];p.stats=(p.text.match(stat)||[]).length;});
// uniqueness: share of shingles that appear in no other page of same type
const cnt={};ok.forEach(p=>{p.sh.forEach(s=>{cnt[p.t+'|'+s]=(cnt[p.t+'|'+s]||0)+1})});
ok.forEach(p=>{let u=0;p.sh.forEach(s=>{if(cnt[p.t+'|'+s]===1)u++});p.uniq=p.sh.size?Math.round(100*u/p.sh.size):0;p.uniqWords=u;});
const rows=ok.map(p=>({t:p.t,slug:p.u.split('/').pop(),status:p.status,words:p.words,uniqPct:p.uniq,uniqWords:p.uniqWords,doses:p.doses.length,doseEx:p.doses.slice(0,3).join(' | '),cure:p.cures.join(','),stats:p.stats,ext:p.refs,ads:p.ads,robots:p.robots}));
fs.writeFileSync(process.argv[3],JSON.stringify(rows,null,0));
const by={};rows.forEach(r=>{(by[r.t]=by[r.t]||[]).push(r)});
for(const[t,rs]of Object.entries(by)){const med=a=>a.sort((x,y)=>x-y)[a.length>>1];console.log(t.padEnd(16),'n',rs.length,'medWords',med(rs.map(r=>r.words)),'medUniqWords',med(rs.map(r=>r.uniqWords)),'uniq<150',rs.filter(r=>r.uniqWords<150).length,'withDoses',rs.filter(r=>r.doses).length,'cureWords',rs.filter(r=>r.cure).length,'noindex',rs.filter(r=>/noindex/.test(r.robots)).length,'ads',rs.filter(r=>r.ads).length,'medExt',med(rs.map(r=>r.ext)))}
console.log('errors',P.filter(p=>p.error).length, P.filter(p=>p.status&&p.status!==200).map(p=>p.u+' '+p.status));
