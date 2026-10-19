"use client";

import { useState } from "react";
import { Check, Clapperboard, Copy, ExternalLink, X } from "lucide-react";
import type { KitText } from "@/lib/social/app-kit";
import type { SocialStatus } from "@/lib/social/automation";

const INTENT: Record<string, string> = { price: "Fees", diet: "Diet", trial: "Trial", visit: "Timing / address", shop: "Shop", hello: "Greeting", other: "Other" };
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function Chip({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${on ? "bg-emerald-500/15 text-emerald-200" : "bg-white/5 text-white/50"}`}>
      {on ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />} {label}
    </span>
  );
}

/** Greeting, away message and quick replies for the WhatsApp Business app, each with a copy button. */
function AppKit({ kit }: { kit: KitText[] }) {
  const [copied, setCopied] = useState("");
  const copy = async (k: KitText) => {
    try {
      await navigator.clipboard.writeText(k.text);
      setCopied(k.id);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      setCopied("");
    }
  };
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <h3 className="font-display text-lg text-white">WhatsApp Business app kit</h3>
      <p className="mt-1 text-sm text-white/60">
        For the number you call and chat on. The app can&apos;t be run by the website, so paste these into its own automation (WhatsApp Business → Settings → Business tools). Prices follow your plans and offer; copy them again when the offer changes.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {kit.map((k) => (
          <article key={k.id} className="flex flex-col rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{k.title}</p>
                <p className="text-xs text-white/45">{k.where}</p>
              </div>
              <button type="button" onClick={() => copy(k)} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20">
                {copied === k.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied === k.id ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-xs text-white/75">{k.text}</pre>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Instagram auto-post and the WhatsApp / Instagram auto-replies: what is on, what was posted, what came in. */
export function Social({ status, siteUrl, appKit, busy = false, onPostReel }: { status: SocialStatus | null; siteUrl: string; appKit?: KitText[]; busy?: boolean; onPostReel?: () => void }) {
  if (!status) return <p className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">Apply the latest database migration (social automation) to turn this on.</p>;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const allOn = status.instagram && status.facebook && status.whatsapp && status.webhook;
  return (
    <div className="space-y-6">
      {appKit && appKit.length > 0 && <AppKit kit={appKit} />}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          <Chip on={status.instagram} label="Instagram Reel + Story" />
          <Chip on={status.facebook} label="Facebook Page" />
          <Chip on={status.whatsapp} label="WhatsApp API" />
          <Chip on={status.webhook} label="Meta webhook" />
          <Chip on={status.autoReply} label="Auto-replies" />
        </div>
        {!allOn && (
          <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-white/70">
            <li>Instagram account → switch it to a Professional (Business or Creator) account.</li>
            <li>developers.facebook.com → create an app → add the Instagram product (&quot;API setup with Instagram login&quot;) and WhatsApp.</li>
            <li>Generate a long-lived Instagram token and add it in Vercel as INSTAGRAM_ACCESS_TOKEN. The site refreshes it every week, so it never expires.</li>
            <li>WhatsApp: add WHATSAPP_TOKEN (a System User token) and WHATSAPP_PHONE_NUMBER_ID.</li>
            <li>
              Vercel: add META_APP_SECRET (and INSTAGRAM_APP_SECRET if Instagram shows a different one) and META_VERIFY_TOKEN (any phrase). In Meta → Webhooks, use the callback URL <code className="rounded bg-white/10 px-1">{siteUrl}/api/webhooks/meta</code> with that phrase, and subscribe to WhatsApp &quot;messages&quot; and Instagram &quot;messages&quot; and &quot;comments&quot;.
            </li>
            <li>Facebook Page: add FACEBOOK_PAGE_ID and FACEBOOK_PAGE_TOKEN (a System User token for the Page), and subscribe the Page webhook to &quot;messages&quot; and &quot;feed&quot;.</li>
            <li>Redeploy. The Story then goes out every morning at about 7:45 am, the day&apos;s Reel at about 7 pm, and every message gets an answer in seconds.</li>
          </ol>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-[minmax(0,280px)_1fr]">
        <div>
          <h2 className="mb-2 text-sm font-bold text-white/80">Today&apos;s Reel</h2>
          <p className="mb-2 text-xs text-white/60">Posts by itself at about 7 pm on Instagram and Facebook (peak time). If a Reel can&apos;t be posted, the image below goes out instead.</p>
          <div className="mb-5 flex flex-wrap gap-2">
            <a href={`/api/admin/social/reel/${today}.mp4`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 hover:text-white">
              <Clapperboard className="h-3.5 w-3.5" /> Preview Reel (takes ~20 s)
            </a>
            {onPostReel && (
              <button type="button" disabled={busy} onClick={onPostReel} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50">
                {busy ? "Posting… (up to 3 min)" : "Post today's Reel now"}
              </button>
            )}
          </div>
          <h2 className="mb-2 text-sm font-bold text-white/80">Today&apos;s post image</h2>
          {/* eslint-disable-next-line @next/next/no-img-element -- generated JPEG, shown as is */}
          <img src={`/api/social/post-image/${today}.jpg`} alt="Today's post" width={1080} height={1350} className="w-full rounded-xl border border-white/10" />
          <a href={`/api/social/post-image/${today}.jpg`} download className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sky-300 hover:underline">
            Download for WhatsApp Status <ExternalLink className="h-3 w-3" />
          </a>
          <h2 className="mb-2 mt-5 text-sm font-bold text-white/80">Today&apos;s sales Story</h2>
          {/* eslint-disable-next-line @next/next/no-img-element -- generated JPEG, shown as is */}
          <img src={`/api/social/story-image/${today}.jpg`} alt="Today's story" width={1080} height={1920} className="w-2/3 rounded-xl border border-white/10" />
          <a href={`/api/social/story-image/${today}.jpg`} download className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sky-300 hover:underline">
            Download for Facebook / WhatsApp Status <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-bold text-white/80">Instagram posts, Stories &amp; Facebook</h2>
          {status.posts.length ? (
            <ul className="divide-y divide-white/5 rounded-xl border border-white/10">
              {status.posts.map((p) => (
                <li key={`${p.date}-${p.channel}`} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                  <span className="w-24 shrink-0 text-white/60">{p.date}</span>
                  <span className="w-24 shrink-0 text-xs font-semibold text-white/70">{p.channel === "instagram-story" ? "IG Story" : p.channel === "facebook" ? "Facebook" : "Instagram"}</span>
                  <span className="min-w-0 flex-1 truncate">{p.theme}</span>
                  {p.status === "published" && p.permalink ? (
                    <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-emerald-300 hover:underline">
                      {p.permalink.includes("/reel/") ? "Reel posted ↗" : "Posted ↗"}
                    </a>
                  ) : (
                    <span className={`text-xs font-semibold ${p.status === "failed" ? "text-rose-300" : "text-white/60"}`} title={p.error ?? undefined}>
                      {p.status === "failed" ? `Failed: ${p.error ?? ""}` : p.status}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-white/50">Nothing posted yet.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-white/80">Latest messages and comments</h2>
        {status.inbox.length ? (
          <ul className="divide-y divide-white/5 rounded-xl border border-white/10">
            {status.inbox.map((m) => (
              <li key={m.id} className="p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
                  <span className="font-semibold text-white/80">{m.channel === "whatsapp" ? "WhatsApp" : `${m.channel === "facebook" ? "Facebook" : "Instagram"} ${m.kind === "comment" ? "comment" : "message"}`}</span>
                  <span>{m.name || (m.channel === "whatsapp" ? `+${m.from}` : m.from)}</span>
                  <span>· {when(m.createdAt)}</span>
                  <span className="rounded bg-white/5 px-1.5">{INTENT[m.intent] ?? m.intent}</span>
                  <span className={m.replied ? "text-emerald-300" : m.error ? "text-rose-300" : ""} title={m.error ?? undefined}>
                    {m.replied ? "Auto-replied" : m.error ? "Reply failed" : "Waiting for you"}
                  </span>
                  {m.channel === "whatsapp" && (
                    <a href={`https://wa.me/${m.from}`} target="_blank" rel="noopener noreferrer" className="ml-auto font-semibold text-sky-300 hover:underline">
                      Open chat
                    </a>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-white/85">{m.body || "(photo, voice note or sticker)"}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-white/50">No messages yet. They appear here once the webhook is connected.</p>
        )}
      </section>
    </div>
  );
}
