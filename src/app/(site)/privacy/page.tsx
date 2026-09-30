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
          <li>Standard server logs (IP address, browser type) needed to run the site securely.</li>
        </ul>
        <p>Our fitness calculators run entirely in your browser — the numbers you enter are never sent to us.</p>
        <h2>How we use it</h2>
        <p>We use your details only to contact you about your trial or membership enquiry. We never sell or share your data with third parties for marketing.</p>
        <h2>Your choices</h2>
        <p>
          To have your enquiry deleted, call us at {c.business.phone} or message us on WhatsApp and we will remove it.
        </p>
        <h2>Third-party services</h2>
        <p>Our contact page embeds Google Maps, and links go to Instagram and WhatsApp. Those services have their own privacy policies.</p>
      </section>
    </>
  );
}
