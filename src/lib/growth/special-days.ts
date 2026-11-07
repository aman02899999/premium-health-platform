// One-off festival posts that take the place of a normal scheduled post on their day. Pure: the
// date and slot pick the post. The images are ready-made JPGs in public/social (designed and
// approved by the owner before they go in here), so nothing renders at post time.
//
// - `feed` replaces the month plan's card in that slot (Instagram + Facebook).
// - `story` replaces the day's sales Story on Instagram.
// The rest of the day (the other card, the Reels) runs as normal.
import type { FeedSlot } from "./month-plan";

export type SpecialPost = {
  id: string;
  /** India date, YYYY-MM-DD. */
  date: string;
  slot: FeedSlot;
  /** Paths under public/. */
  feedImage: string;
  storyImage: string;
  theme: string;
  instagram: string;
  /** Facebook captions can carry a link; Instagram's can't (the bio link does). */
  facebook: string;
};

const DIWALI_OFFER = `👉 Festive Offer, 31 Dec tak:
• Monthly ₹1,500 + 5 bonus days
• Quarterly ₹4,000 + 10 bonus days
• Half-yearly ₹7,000 + 20 bonus days
• Female's Special ₹7,000 (6 months + diet plan)
• Annual ₹14,000 = 14 months
Couple prices standard rehte hain.`;

const DIWALI_BODY = `Happy Diwali from Royal Fitness Club 🪔

Aap sabko aur aapki family ko Diwali ki dher saari shubhkamnayein.

Tyohaar hai, toh mithai khao, ghar walon ke saath time bitao, aur patakhon ke dhuein se thoda door raho. Ek din ki mithai se progress nahi rukti. Progress roz ki aadat se banti hai, aur woh aadat Diwali ke baad bhi wahin milegi.

Is Diwali ek diya apni sehat ke naam bhi jalao. 🙏

${DIWALI_OFFER}`;

const SIGN_OFF = `— Coach Aman Sharma, Royal Fitness Club
📍 Main Road, near Gali No. 3, Gejha Village, Sector 93, Noida 201304`;

const DIWALI_TAGS =
  "#HappyDiwali #ShubhDeepawali #Diwali2026 #RoyalFitnessClub #CoachAman #NoidaGym #GymInNoida #Sector93Noida #NoidaFitness #FitnessIndia #FestiveOffer #HealthyDiwali #GymLife";

const DIWALI_LINK = "https://www.royalfitnesclub.in/membership?utm_source=facebook&utm_medium=social&utm_campaign=diwali-2026";

export const SPECIAL_POSTS: SpecialPost[] = [
  {
    id: "diwali-2026",
    date: "2026-11-08",
    slot: "am",
    feedImage: "/social/diwali-2026-feed.jpg",
    storyImage: "/social/diwali-2026-story.jpg",
    theme: "Happy Diwali 2026",
    instagram: `${DIWALI_BODY}

📲 Link in bio se plan dekho ya join karo.
📞 Call or WhatsApp 88518 30081

${SIGN_OFF}

${DIWALI_TAGS}`,
    facebook: `${DIWALI_BODY}

📲 Plan dekho ya join karo: ${DIWALI_LINK}
📞 Call or WhatsApp 88518 30081

${SIGN_OFF}

${DIWALI_TAGS}`,
  },
];

/** The festival post that replaces this slot's card today, if any. */
export function specialFeedPost(date: string, slot: FeedSlot, posts: SpecialPost[] = SPECIAL_POSTS): SpecialPost | null {
  return posts.find((p) => p.date === date && p.slot === slot) ?? null;
}

/** The festival Story that replaces today's sales Story, if any. */
export function specialStory(date: string, posts: SpecialPost[] = SPECIAL_POSTS): SpecialPost | null {
  return posts.find((p) => p.date === date) ?? null;
}
