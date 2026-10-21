// Renders the branded banners (1200x628) used as email hero images and WhatsApp template headers.
//   node scripts/render-banners.mjs <out-dir>   (needs playwright-core; CHROME_PATH = a Chromium binary)
// Then save each PNG as public/brand/banners/<id>.jpg (quality ~84, under 150 KB).
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || "playwright-core");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.argv[2];

const B = [
  { id: "offer", photo: "aman-sharma-chest-shoulders", tag: "LIMITED-TIME OFFER", h1: ["WOW!", "OFFER", "UNLOCKED"], red: 0, sub: "Grab it before it's gone. Start building your dream physique.", chip: "Limited time only" },
  { id: "welcome", photo: "aman-sharma-royal-fitness-gym", tag: "MEMBERSHIP ACTIVE", h1: ["WELCOME TO", "THE ROYAL", "FAMILY"], red: 1, sub: "Your trainers are ready. Your journey starts now.", chip: "Member perks inside" },
  { id: "renewal", photo: "aman-sharma-front-pose", tag: "MEMBERSHIP REMINDER", h1: ["DON'T BREAK", "THE", "STREAK"], red: 2, sub: "Renew in one tap and keep your spot.", chip: "Renew online in 1 minute" },
  { id: "trial", photo: "aman-sharma-gym-selfie", tag: "FREE TRIAL", h1: ["YOUR FIRST", "WORKOUT IS", "ON US"], red: 2, sub: "One session with a trainer. No payment needed.", chip: "Book your time" },
  { id: "comeback", photo: "aman-sharma-back-pose", tag: "WE SAVED YOUR SPOT", h1: ["THE GYM", "MISSES", "YOU"], red: 2, sub: "Your dumbbells have been asking about you.", chip: "Restart anytime" },
  { id: "diet", photo: "aman-sharma-between-sets", tag: "PERSONAL DIET PLAN", h1: ["ABS ARE MADE", "IN THE", "KITCHEN"], red: 2, sub: "Indian meals in katori and roti measures, built for your body.", chip: "Made by your coach" },
  { id: "referral", photo: "aman-sharma-back-flex", tag: "REFERRAL REWARD", h1: ["BONUS DAYS", "UNLOCKED", ""], red: 1, sub: "Thanks for bringing a friend. Gains are better together.", chip: "Added to your plan" },
  { id: "thanks", photo: "aman-sharma-physique", tag: "ROYAL FITNESS CLUB", h1: ["THANK YOU", "FOR TRAINING", "WITH US"], red: 0, sub: "Your support helps people in Noida find a good gym.", chip: "Sector 93, Noida" },
];

const font = (f) => `file://${ROOT}/src/app/(gym)/fonts/${f}`;
const html = (b) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Oswald;src:url("${font("oswald-latin-wght-normal.woff2")}");font-weight:200 700}
@font-face{font-family:Inter;src:url("${font("inter-latin-wght-normal.woff2")}");font-weight:100 900}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:628px;overflow:hidden;background:#051c2e;font-family:Inter}
.photo{position:absolute;right:0;top:0;width:620px;height:628px;background:url("file://${ROOT}/public/gallery/${b.photo}.webp") center 22%/cover}
.fade{position:absolute;inset:0;background:linear-gradient(90deg,#04263d 0%,#04263d 44%,rgba(4,38,61,.85) 54%,rgba(4,38,61,.15) 78%,rgba(4,38,61,0) 100%)}
.glow{position:absolute;left:-120px;bottom:-160px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(232,57,75,.35),rgba(232,57,75,0) 70%)}
.bar{position:absolute;left:0;top:0;bottom:0;width:14px;background:#e8394b}
.wrap{position:absolute;left:64px;top:44px;width:640px}
.logo{display:inline-flex;align-items:center;gap:14px;background:#fff;border-radius:18px;padding:10px 18px 10px 10px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
.logo img{height:58px}
.logo b{font-family:Oswald;font-weight:700;font-size:24px;letter-spacing:2px;color:#04466d;line-height:1}
.logo small{display:block;font-family:Oswald;font-size:15px;letter-spacing:3px;color:#c21f30;margin-top:3px}
.tag{margin-top:30px;display:block;font-weight:800;font-size:17px;letter-spacing:4px;color:#ffd166}
h1{margin-top:6px;font-family:Oswald;font-weight:700;font-size:84px;line-height:.98;color:#fff;text-transform:uppercase;text-shadow:0 6px 24px rgba(0,0,0,.4)}
h1 .r{color:#ff4d5e}
p{margin-top:16px;font-size:24px;line-height:1.35;color:#dbe7f1;max-width:560px}
.chip{position:absolute;right:40px;bottom:40px;background:#e8394b;color:#fff;font-weight:800;font-size:24px;padding:14px 26px;border-radius:999px;box-shadow:0 10px 30px rgba(232,57,75,.45);transform:rotate(-3deg)}
.url{position:absolute;left:64px;bottom:30px;font-size:18px;font-weight:600;letter-spacing:1px;color:#9fb8cc}
</style></head><body>
<div class="photo"></div><div class="fade"></div><div class="glow"></div><div class="bar"></div>
<div class="wrap">
 <div class="logo"><img src="file://${ROOT}/public/brand/logo-mark.png"><span><b>ROYAL FITNESS CLUB</b><small>SECTOR 93 · NOIDA</small></span></div>
 <div class="tag">${b.tag}</div>
 <h1>${b.h1.filter(Boolean).map((l, i) => `<div${i === b.red ? ' class="r"' : ""}>${l}</div>`).join("")}</h1>
 <p>${b.sub}</p>
</div>
<div class="chip">${b.chip}</div>
<div class="url">royalfitnesclub.in</div>
</body></html>`;

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 628 } });
const fs = await import("fs");
for (const b of B) {
  const f = `${OUT}/${b.id}.html`;
  fs.writeFileSync(f, html(b));
  await page.goto(`file://${f}`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${b.id}.png` });
  console.log(b.id);
}
await browser.close();
