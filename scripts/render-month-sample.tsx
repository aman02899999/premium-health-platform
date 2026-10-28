// Renders month-plan samples to a folder for review: cards as JPEG, both Reels as MP4, and the
// captions as text. Nothing is posted.
//   npx tsx --conditions=react-server scripts/render-month-sample.tsx <out-dir> [from-date] [days]
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { addDays } from "@/lib/growth/dates";
import { dailyPost } from "@/lib/growth/daily-posts";
import { cardPost, secondReelPost, reelPhoto, MONTH_START } from "@/lib/growth/month-plan";
import { OFFERS } from "@/lib/offers";
import { renderCard } from "@/lib/social/card-image";
import { renderReel, renderReelPost } from "@/lib/social/reel";

const biz = {
  name: "Royal Fitness Club",
  phone: "+91 88518 30081",
  siteUrl: "https://www.royalfitnesclub.in",
  coach: "Coach Aman Sharma",
  membershipFrom: 1500,
  address: "Main Road, near Gali No. 3, Gejha Village, Sector 93, Noida 201304",
};

async function main() {
  const [out, from = MONTH_START, days = "7", reels = "2"] = process.argv.slice(2);
  await mkdir(out, { recursive: true });
  for (let i = 0; i < Number(days); i++) {
    const date = addDays(from, i);
    for (const slot of ["am", "pm"] as const) {
      const p = cardPost(date, slot, biz, OFFERS);
      if (!p) continue;
      await writeFile(join(out, `${date}-${slot}.jpg`), await renderCard(p, biz));
      await writeFile(join(out, `${date}-${slot}.instagram.txt`), p.instagram);
      console.log(date, slot, p.card.id, p.instagram.length, "chars");
    }
    await writeFile(join(out, `${date}-reel1-evening.instagram.txt`), dailyPost(date, biz).instagram);
    const r = secondReelPost(date, biz);
    if (r) {
      await writeFile(join(out, `${date}-reel2.instagram.txt`), r.instagram);
      if (i < Number(reels)) {
        await writeFile(join(out, `${date}-reel2.mp4`), await renderReelPost(r, i, reelPhoto(date), biz));
        console.log(date, "reel2", r.theme);
        // The evening Reel that already posts every day (it now gets music too).
        await writeFile(join(out, `${date}-reel1-evening.mp4`), await renderReel(date, biz));
      }
    }
  }
}
main().catch((e) => (console.error(e), process.exit(1)));
