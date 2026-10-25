const { chromium } = require('playwright');
const fs = require('fs');
const urls = fs.readFileSync(process.argv[2],'utf8').trim().split('\n').filter(u=>/\/(diseases|blog|herbs|lab-tests|symptoms|nutrition|news|medicines|ayurveda)\/[^/]+$|\/hi\/health\/blog\/[^/]+$/.test(u));
(async()=>{
  const b = await chromium.launch();
  const out=[]; let i=0;
  async function worker(){ const ctx=await b.newContext(); const p=await ctx.newPage();
    await p.route('**/*',r=>['image','font','media'].includes(r.request().resourceType())||/googlesyndication|google-analytics|googletagmanager|facebook/.test(r.request().url())?r.abort():r.continue());
    while(i<urls.length){ const u=urls[i++]; try{ const res=await p.goto(u,{waitUntil:'domcontentloaded',timeout:45000});
      const d=await p.evaluate(()=>{ const m=document.querySelector('article')||document.querySelector('main')||document.body;
        const c=m.cloneNode(true); c.querySelectorAll('nav,footer,script,style,aside,[aria-label=Breadcrumb]').forEach(e=>e.remove());
        const t=c.innerText; const robots=document.querySelector('meta[name=robots]')?.content||'';
        return {text:t, words:(t.match(/\S+/g)||[]).length, title:document.title, robots, ads:document.querySelectorAll('ins.adsbygoogle').length, refs:document.querySelectorAll('a[href^="http"]').length};});
      out.push({u,status:res.status(),...d}); }catch(e){out.push({u,error:String(e).slice(0,100)});} }
    await ctx.close(); }
  await Promise.all(Array.from({length:6},worker));
  fs.writeFileSync(process.argv[3],JSON.stringify(out));
  await b.close(); console.log(out.length);
})();
