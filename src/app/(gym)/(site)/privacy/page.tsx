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
          <li>If you order from the Royal Supplements Store: your delivery address, city, state, pincode and any note you add, so we can deliver it.</li>
          <li>
            If you buy a diet plan: your age, sex, height, weight and body measurements, goal, food preferences, health conditions, allergies and any
            medicines you list. Only our coach uses these, to write your plan. We never use them for ads and never share them.
          </li>
          <li>If you review a book: your rating, review text, the name you choose to show, and your city and country.</li>
          <li>Your WhatsApp messages to our business number, so we can reply and keep a record of the chat.</li>
          <li>Standard server logs (IP address, browser type) needed to run the site securely.</li>
        </ul>
        <p>
          Our calculators run entirely in your browser — the numbers you enter are never sent to us. If you use the Health Hub without signing in, your
          data stays only in your browser.
        </p>
        <h2 id="health-data">Blood report analyser (health data)</h2>
        <p>
          Members and diet-plan clients we switch it on for can type in the results from a blood test, or upload the PDF report from their lab, to get a plain-language explanation. Blood
          test results are sensitive personal data, so we handle them more strictly than anything else on this site:
        </p>
        <ul>
          <li>We only process your results after you tick the consent box, and only to show you the explanation. It is education, not a diagnosis.</li>
          <li>
            If you upload a PDF, it is read inside your own browser. The file is never sent to us or stored. Only the test values the page finds
            (which you check and can change first) are sent for the explanation, exactly as if you had typed them. The page also reads your age and
            sex from the report to fill in the form; we don&apos;t take your name, phone number or any other details from it.
          </li>
          <li>
            By default nothing is stored: we analyse the numbers and forget them. If you choose &ldquo;Keep this report in my account&rdquo;, we save
            the values, your age and sex encrypted, and only you can see them on your account page.
          </li>
          <li>Saved reports are hidden after 12 months, and you can delete one or all of them at any time from the analyser page. Deleting removes them from our database.</li>
          <li>
            Our staff do not look at your reports. Only the owner can open them, only when you ask us to (for example for a review call), and every
            such look is recorded with the reason.
          </li>
          <li>Your results are never used for advertising, never sent to Meta, Google or any analytics tool, and never used to message you.</li>
        </ul>
        <p>
          To withdraw your consent or ask us about your health data, delete your reports on the analyser page or contact us using the details below.
          This follows India&apos;s Digital Personal Data Protection Act, 2023.
        </p>
        <h2>Google user data</h2>
        <p>
          When you choose &ldquo;Continue with Google&rdquo;, we receive only your name, email address and profile photo from your Google account. We
          use them only to create and sign you in to your {c.business.name} account and to show your name on your account page. We do not read your
          Gmail, contacts, calendar or any other Google data, we do not use Google user data for advertising, and we never sell it or share it with
          anyone. Our use of information received from Google APIs follows the{" "}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.
        </p>
        <h2>Where it is stored</h2>
        <p>
          Accounts and saved data are stored with our database provider, Supabase. Each member can only access their own data. You can delete your
          synced data at any time from <a href="/account">My account</a>. The website is hosted on Vercel, emails are sent through Resend, WhatsApp
          messages through Meta&apos;s WhatsApp Business platform, automated WhatsApp replies are written with an AI service, and online payments are
          handled by Razorpay. These providers process data only to
          provide their service to us.
        </p>
        <h2>How we use it</h2>
        <ul>
          <li>
            To reply to your enquiry and schedule your free trial. When you send the trial form we send you one WhatsApp message (and an email if you
            gave one) to confirm it, and a few follow-ups over the next weeks. Reply STOP to end them.
          </li>
          <li>
            Messages to our WhatsApp business number may first get a reply from our automated assistant. It uses an AI service to write the reply
            from your message and our gym details, and hands you to a person when needed. For a person straight away, call or WhatsApp {c.business.phone}.
          </li>
          <li>To run your account, membership or order: payment receipts, plan delivery, book downloads and membership renewal reminders.</li>
          <li>
            To send a short series of welcome and fitness-tip emails after you sign up, and occasional offers or our weekly newsletter if you opted in.
            Every such email has an unsubscribe link. To stop WhatsApp messages, message us on WhatsApp and we will turn them off.
          </li>
          <li>
            App notifications, only if you turn them on in <a href="/account">My account</a>. We keep your browser&apos;s notification address and
            keys, linked to your sign-in email, and use them to tell you when your plan is ready. The notification itself is delivered free by your
            browser&apos;s own service (Google, Apple, Mozilla or Microsoft). Turn them off in My account or in your phone&apos;s settings at any time.
          </li>
          <li>To keep the site secure and fix problems.</li>
        </ul>
        <p>We never sell your data or share it with third parties for their own marketing.</p>
        <h2>Your choices</h2>
        <p>
          You can unsubscribe from emails at any time with the link in any email. To see, correct or delete your personal data or your account,
          email us at <a href={`mailto:${c.business.email}`}>{c.business.email}</a>, call {c.business.phone} or message us on WhatsApp.
        </p>
        <h2>How long we keep it</h2>
        <p>
          We keep your details for as long as you have an account, membership or open enquiry with us, and payment records for as long as Indian
          tax law requires. You can ask us to delete the rest at any time.
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
        <p>
          We use Google Analytics to count visits and see which links bring people to the site (for example our Google profile, posts and
          Instagram). It sets Google cookies and records the pages you view, the link you came from and your rough location, never your name,
          email or phone number. Account and admin pages are not tracked. You can block it with the{" "}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics opt-out add-on</a>.
        </p>
        <p>
          We use the Meta Pixel and Meta&apos;s Conversions API to measure our Facebook and Instagram ads: when you view a page, send a trial or
          enquiry form, or complete a purchase, Meta is told that this happened. Your email and mobile number are sent only as one-way hashes,
          never in readable form, and we never share payment details. Meta may use its cookies to show you our ads on its apps. You can control
          this in your{" "}
          <a href="https://accountscenter.facebook.com/ad_preferences" target="_blank" rel="noopener noreferrer">Meta ad preferences</a>.
        </p>
        <p>
          A cookie of our own (rfc_attr, kept for 90 days) remembers how you first found us and what brought you back last: the campaign tags in
          the link you clicked, the website you came from and the page you landed on. It holds nothing about you personally. If you send an
          enquiry or buy something, we store those details with it so we know which of our posts, ads and messages actually bring members.
        </p>
        <h2>Contact</h2>
        <p>
          {c.business.name}, {c.business.address.street}, {c.business.address.locality}, {c.business.address.city} {c.business.address.postalCode}.
          Email <a href={`mailto:${c.business.email}`}>{c.business.email}</a>.
        </p>
        <p>Last updated: 25 October 2026.</p>
      </section>
    </>
  );
}
