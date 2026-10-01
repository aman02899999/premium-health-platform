import type { Metadata } from "next";
import { getContent } from "@/lib/content/store";
import { pageMeta } from "@/lib/seo";
import { PageHero } from "@/components/ui/Section";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, { title: "Privacy Policy", description: `How ${c.business.name} handles your personal information.`, path: "/privacy" });
}

export default async function PrivacyPage() {
  const c = await getContent();
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy" highlight="policy" />
      <section className="prose-royal mx-auto max-w-3xl px-4 pb-10 sm:px-6">
        <p>This policy explains what information {c.business.name} collects through this website and how we use it.</p>
        <h2>What we collect</h2>
        <ul>
          <li>Your name, phone number, fitness goal and message when you submit the free-trial form.</li>
          <li>If you sign in with Google: your name, email address and profile photo from your Google account.</li>
          <li>If you sign in and use the Health Hub: the workout plan, food log and progress check-ins you choose to save.</li>
          <li>If you buy from the Premium Library or pay for a membership online: your name, email and mobile number, and the order and payment IDs. Card, UPI and bank details go directly to Razorpay, our payment processor — we never see or store them.</li>
          <li>If you review a book: your rating, review text, the name you choose to show, and your city and country.</li>
          <li>Standard server logs (IP address, browser type) needed to run the site securely.</li>
        </ul>
        <p>
          Our calculators run entirely in your browser — the numbers you enter are never sent to us. If you use the Health Hub without signing in, your
          data stays only in your browser.
        </p>
        <h2>Where it is stored</h2>
        <p>
          Accounts and saved data are stored with our database provider, Supabase. Each member can only access their own data. You can delete your
          synced data at any time from <a href="/account">My account</a>.
        </p>
        <h2>How we use it</h2>
        <p>We use your details only to contact you about your trial, membership or order, to deliver the books you buy and to help you recover your downloads. We never sell or share your data with third parties for marketing.</p>
        <h2>Your choices</h2>
        <p>
          To have your enquiry or your account deleted, call us at {c.business.phone} or message us on WhatsApp and we will remove it.
        </p>
        <h2>Third-party services</h2>
        <p>Our contact page embeds Google Maps, and links go to Instagram and WhatsApp. Those services have their own privacy policies.</p>
        <h2>Advertising</h2>
        <p>
          This site shows ads served by Google AdSense. Google and its partners use cookies to show ads based on your visits to this and other
          websites. You can turn off personalised ads in{" "}
          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>, and learn more in{" "}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">how Google uses data from sites that use its services</a>.
        </p>
      </section>
    </>
  );
}
