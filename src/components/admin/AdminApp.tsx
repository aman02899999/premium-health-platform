"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Download,
  Dumbbell,
  ExternalLink,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Inbox,
  Loader2,
  LogOut,
  MessageSquareQuote,
  Search,
  Save,
  Tag,
  Upload,
  Users,
  Home,
  IndianRupee,
  BookOpen,
  Salad,
  TrendingUp,
  ShoppingBag,
} from "lucide-react";
import type { BlogPost, Lead, SiteContent } from "@/lib/content/types";
import { slugify } from "@/lib/content/validate";
import { parseMarkdown } from "@/lib/markdown";
import { CALCULATORS } from "@/lib/calculators";
import { Markdown } from "@/components/blog/Markdown";
import { ListEditor, ObjectEditor, type Field } from "./fields";
import { LibraryAdmin } from "./LibraryAdmin";
import { DEFAULT_POSTS } from "@/lib/content/default-posts";
import { LOCAL_POSTS } from "@/lib/content/local-posts";

const BUILTIN_POST_SLUGS = new Set([...DEFAULT_POSTS, ...LOCAL_POSTS].map((p) => p.slug));

const uid = () => Math.random().toString(36).slice(2, 9);

const TABS = [
  { id: "business", label: "Business Info", icon: Building2 },
  { id: "home", label: "Home & Hero", icon: Home },
  { id: "programs", label: "Programs", icon: Dumbbell },
  { id: "plans", label: "Membership", icon: Tag },
  { id: "trainers", label: "Trainers", icon: Users },
  { id: "gallery", label: "Gallery", icon: ImageIcon },
  { id: "testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { id: "faqs", label: "FAQs", icon: HelpCircle },
  { id: "blog", label: "Blog", icon: FileText },
  { id: "seo", label: "SEO & Theme", icon: Search },
  { id: "leads", label: "Enquiries", icon: Inbox },
  { id: "payments", label: "Payments", icon: IndianRupee },
  { id: "library", label: "Library", icon: BookOpen },
] as const;
type TabId = (typeof TABS)[number]["id"];

function Card({ title, children, help }: { title: string; help?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-coal p-5 ring-1 ring-white/10 sm:p-6">
      <h2 className="font-display text-xl text-white">{title}</h2>
      {help && <p className="mt-1 text-sm text-white/50">{help}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function AdminApp({ storage }: { storage: string }) {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [saved, setSaved] = useState("");
  const [tab, setTab] = useState<TabId>("business");
  const [status, setStatus] = useState<{ kind: "ok" | "err" | "busy"; msg: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => (r.status === 401 ? (location.href = "/admin/login") : r.json()))
      .then((j) => {
        if (j?.content) {
          setContent(j.content);
          setSaved(JSON.stringify(j.content));
        }
      });
  }, []);

  const dirty = content !== null && JSON.stringify(content) !== saved;

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = useCallback(async () => {
    if (!content) return;
    setStatus({ kind: "busy", msg: "Saving…" });
    const res = await fetch("/api/admin/content", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ content }) });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      setSaved(JSON.stringify(content));
      setStatus({ kind: "ok", msg: "Saved — the live site is updated." });
    } else setStatus({ kind: "err", msg: j.error || "Save failed" });
  }, [content]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  if (!content) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const set = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => setContent({ ...content, [key]: value });

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
          <span className="font-display min-w-0 truncate text-lg text-white">
            Admin<span className="hidden text-brand sm:inline"> · {content.business.name}</span>
          </span>
          <span className="hidden rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/45 sm:inline">storage: {storage}</span>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            {status && (
              <span className={`hidden text-sm md:inline ${status.kind === "err" ? "text-red-300" : status.kind === "ok" ? "text-emerald-300" : "text-white/60"}`}>{status.msg}</span>
            )}
            <a href="/admin/diet-pro" className="inline-flex items-center gap-1.5 rounded-lg border border-brand/50 bg-brand/10 px-3 py-2 text-sm font-semibold text-white">
              <Salad className="h-4 w-4 text-brand" /> <span className="hidden sm:inline">Diet Calculator</span>
            </a>
            <a href="/" target="_blank" className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80">
              <ExternalLink className="h-4 w-4" /> <span className="hidden sm:inline">View site</span>
            </a>
            <button
              type="button"
              onClick={save}
              disabled={!dirty || status?.kind === "busy"}
              className="btn-brand inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-40 sm:px-4"
            >
              {status?.kind === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {dirty ? "Save changes" : "Saved"}
            </button>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST" });
                location.href = "/admin/login";
              }}
              className="rounded-lg border border-white/15 p-2 text-white/70"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        {status?.kind === "err" && <p className="bg-red-500/15 px-4 py-2 text-center text-sm text-red-200 md:hidden">{status.msg}</p>}
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:sticky lg:top-20 lg:flex-col lg:self-start" aria-label="Sections">
          <a href="/admin/diet-pro" className="flex shrink-0 items-center gap-2.5 rounded-xl bg-brand/15 px-3.5 py-2.5 text-left text-sm font-bold text-white ring-1 ring-brand/50 hover:bg-brand/25">
            <Salad className="h-4 w-4 text-brand" /> Diet Calculator
          </a>
          <a href="/admin/growth" className="flex shrink-0 items-center gap-2.5 rounded-xl bg-emerald-500/10 px-3.5 py-2.5 text-left text-sm font-bold text-white ring-1 ring-emerald-400/40 hover:bg-emerald-500/20">
            <TrendingUp className="h-4 w-4 text-emerald-300" /> Growth &amp; renewals
          </a>
          <a href="/admin/shop" className="flex shrink-0 items-center gap-2.5 rounded-xl bg-amber-400/10 px-3.5 py-2.5 text-left text-sm font-bold text-white ring-1 ring-amber-400/40 hover:bg-amber-400/20">
            <ShoppingBag className="h-4 w-4 text-amber-300" /> Royal Supplements Store
          </a>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium ${tab === t.id ? "bg-brand text-white" : "text-white/70 hover:bg-white/5"}`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
          <BackupTools content={content} onImport={setContent} />
        </nav>

        <div className="min-w-0 space-y-6">
          {tab === "business" && (
            <>
              <Card title="Business details" help="Shown in the header, footer, contact page and Google structured data.">
                <ObjectEditor
                  value={content.business}
                  onChange={(v) => set("business", v)}
                  fields={[
                    { key: "name", label: "Gym name" },
                    { key: "shortName", label: "Short name" },
                    { key: "tagline", label: "Tagline", wide: true },
                    { key: "description", label: "Description", type: "textarea" },
                    { key: "phone", label: "Phone" },
                    { key: "altPhone", label: "Alternate phone" },
                    { key: "whatsapp", label: "WhatsApp number", help: "Digits with country code, e.g. 918851830081" },
                    { key: "email", label: "Email" },
                    { key: "instagram", label: "Instagram handle", help: "Without @" },
                    { key: "foundedYear", label: "Founded year", type: "number" },
                    { key: "googleMapsUrl", label: "Google Maps link", wide: true },
                    { key: "googleReviewUrl", label: "Google review link", wide: true, help: "From your Google Business Profile → Ask for reviews" },
                    { key: "mapEmbedUrl", label: "Map embed URL", wide: true, help: "Google Maps → Share → Embed a map → copy the src URL" },
                    { key: "priceRange", label: "Price range (₹, ₹₹, ₹₹₹)" },
                  ]}
                />
              </Card>
              <Card title="Address & location">
                <ObjectEditor
                  value={content.business.address}
                  onChange={(v) => set("business", { ...content.business, address: v })}
                  fields={[
                    { key: "street", label: "Street", wide: true },
                    { key: "locality", label: "Sector / locality" },
                    { key: "city", label: "City" },
                    { key: "region", label: "State" },
                    { key: "postalCode", label: "PIN code" },
                  ]}
                />
                <div className="mt-4">
                  <ObjectEditor
                    value={content.business.geo}
                    onChange={(v) => set("business", { ...content.business, geo: v })}
                    fields={[
                      { key: "lat", label: "Latitude", type: "number" },
                      { key: "lng", label: "Longitude", type: "number" },
                    ]}
                  />
                </div>
              </Card>
              <Card title="Opening hours" help="One row per batch. Use 24-hour times like 05:30 and 22:00. Day ranges like “Monday – Saturday” are understood by Google; days not listed show as closed.">
                <ListEditor
                  items={content.business.hours}
                  titleKey="label"
                  onChange={(v) => set("business", { ...content.business, hours: v })}
                  create={() => ({ label: "Batch", days: "Monday – Saturday", open: "08:00", close: "12:00" })}
                  addLabel="Add hours row"
                  fields={[
                    { key: "label", label: "Label (e.g. Morning)" },
                    { key: "days", label: "Days" },
                    { key: "open", label: "Opens (HH:MM)" },
                    { key: "close", label: "Closes (HH:MM)" },
                  ]}
                />
              </Card>
              <Card title="Rating" help="Update this from your Google / Justdial profile. It appears in Google results as star rating.">
                <ObjectEditor
                  value={content.business.rating}
                  onChange={(v) => set("business", { ...content.business, rating: v })}
                  fields={[
                    { key: "value", label: "Rating (out of 5)", type: "number" },
                    { key: "count", label: "Number of reviews", type: "number" },
                    { key: "source", label: "Source (e.g. Google)" },
                  ]}
                />
              </Card>
            </>
          )}

          {tab === "home" && (
            <>
              <Card title="Top announcement bar" help="Leave empty to hide.">
                <input className="field" value={content.announcement} onChange={(e) => set("announcement", e.target.value)} />
              </Card>
              <Card title="Hero section">
                <ObjectEditor
                  value={content.hero}
                  onChange={(v) => set("hero", v)}
                  fields={[
                    { key: "eyebrow", label: "Small label above title", wide: true },
                    { key: "title", label: "Title (white)" },
                    { key: "highlight", label: "Title (highlighted)" },
                    { key: "subtitle", label: "Subtitle", type: "textarea" },
                    { key: "primaryCta", label: "Main button text" },
                    { key: "secondaryCta", label: "Second button text" },
                  ]}
                />
              </Card>
              <Card title="Stats strip" help="Animated counters under the hero.">
                <ListEditor
                  items={content.stats}
                  titleKey="label"
                  onChange={(v) => set("stats", v)}
                  create={() => ({ value: 100, suffix: "+", label: "New stat" })}
                  fields={[
                    { key: "value", label: "Number", type: "number" },
                    { key: "suffix", label: "Suffix (+, ★, %)" },
                    { key: "label", label: "Label" },
                  ]}
                />
              </Card>
            </>
          )}

          {tab === "programs" && (
            <Card title="Programs / services">
              <ListEditor
                items={content.programs}
                titleKey="title"
                onChange={(v) => set("programs", v)}
                create={() => ({ id: uid(), title: "New program", icon: "Dumbbell", summary: "", points: [], image: "" })}
                addLabel="Add program"
                fields={[
                  { key: "title", label: "Title" },
                  { key: "icon", label: "Icon", type: "icon" },
                  { key: "summary", label: "Summary", type: "textarea" },
                  { key: "points", label: "Bullet points (one per line)", type: "lines" },
                  { key: "image", label: "Image (optional)", type: "image" },
                ]}
              />
            </Card>
          )}

          {tab === "plans" && (
            <>
              <Card title="Membership plans">
                <ListEditor
                  items={content.plans}
                  titleKey="name"
                  onChange={(v) => set("plans", v)}
                  create={() => ({ id: uid(), name: "New plan", duration: "1 month", price: 1000, couplePrice: 0, originalPrice: 0, perks: [], featured: false })}
                  addLabel="Add plan"
                  fields={[
                    { key: "name", label: "Plan name" },
                    { key: "duration", label: "Duration", help: "e.g. 3 months, 12 months — used to compute price per month" },
                    { key: "price", label: "Single price (₹)", type: "number" },
                    { key: "couplePrice", label: "Couple price (₹, 0 to hide)", type: "number" },
                    { key: "originalPrice", label: "Crossed-out price (₹, 0 to hide)", type: "number" },
                    { key: "featured", label: "Highlight as most popular", type: "bool" },
                    { key: "perks", label: "Included perks (one per line)", type: "lines" },
                  ]}
                />
              </Card>
              <Card title="Note under plans">
                <textarea className="field" rows={3} value={content.planNote} onChange={(e) => set("planNote", e.target.value)} />
              </Card>
            </>
          )}

          {tab === "trainers" && (
            <Card title="Trainers">
              <ListEditor
                items={content.trainers}
                titleKey="name"
                onChange={(v) => set("trainers", v)}
                create={() => ({ id: uid(), name: "New trainer", role: "Certified Trainer", bio: "", image: "", specialties: [], instagram: "" })}
                addLabel="Add trainer"
                fields={[
                  { key: "name", label: "Name" },
                  { key: "role", label: "Role" },
                  { key: "bio", label: "Bio", type: "textarea" },
                  { key: "image", label: "Photo", type: "image" },
                  { key: "specialties", label: "Specialties (one per line)", type: "lines" },
                  { key: "instagram", label: "Instagram handle" },
                ]}
              />
            </Card>
          )}

          {tab === "gallery" && (
            <Card title="Gallery" help="Upload real photos of your gym from Instagram. Portrait (4:5) photos look best in the 3D carousel.">
              <ListEditor
                items={content.gallery}
                titleKey="title"
                onChange={(v) => set("gallery", v)}
                create={() => ({ id: uid(), title: "New photo", caption: "", image: "" })}
                addLabel="Add photo"
                fields={[
                  { key: "image", label: "Photo", type: "image" },
                  { key: "title", label: "Title" },
                  { key: "caption", label: "Caption" },
                ]}
              />
            </Card>
          )}

          {tab === "testimonials" && (
            <Card title="Testimonials" help="Copy real reviews from Google with the member's permission. The section shows a Google-reviews link while this list is empty.">
              <ListEditor
                items={content.testimonials}
                titleKey="name"
                onChange={(v) => set("testimonials", v)}
                create={() => ({ id: uid(), name: "Member name", text: "", rating: 5, result: "" })}
                addLabel="Add testimonial"
                fields={[
                  { key: "name", label: "Name" },
                  { key: "rating", label: "Stars (1–5)", type: "number" },
                  { key: "result", label: "Result (e.g. Lost 12 kg in 4 months)", wide: true },
                  { key: "text", label: "Review text", type: "textarea" },
                ]}
              />
            </Card>
          )}

          {tab === "faqs" && (
            <Card title="FAQs" help="Shown on the home page and marked up for Google FAQ results.">
              <ListEditor
                items={content.faqs}
                titleKey="q"
                onChange={(v) => set("faqs", v)}
                create={() => ({ id: uid(), q: "New question?", a: "" })}
                addLabel="Add FAQ"
                fields={[
                  { key: "q", label: "Question", wide: true },
                  { key: "a", label: "Answer", type: "textarea" },
                ]}
              />
            </Card>
          )}

          {tab === "blog" && <BlogEditor posts={content.posts} onChange={(v) => set("posts", v)} business={content.business} />}

          {tab === "seo" && (
            <>
              <Card title="Search engine settings">
                <ObjectEditor
                  value={content.seo}
                  onChange={(v) => set("seo", v)}
                  fields={[
                    { key: "title", label: "Home page title (≤ 60 chars)", wide: true },
                    { key: "description", label: "Meta description (≤ 160 chars)", type: "textarea" },
                    { key: "keywords", label: "Keywords (one per line)", type: "lines" },
                    { key: "ogImage", label: "Social share image (1200×630)", type: "image", help: "Leave empty to use the auto-generated image" },
                    { key: "googleVerification", label: "Google Search Console verification code", wide: true },
                  ]}
                />
                <SeoPreview title={content.seo.title} description={content.seo.description} />
              </Card>
              <Card title="Brand colours">
                <ObjectEditor
                  value={content.theme}
                  onChange={(v) => set("theme", v)}
                  fields={[
                    { key: "primary", label: "Primary (logo red)", type: "color" },
                    { key: "secondary", label: "Secondary (logo navy)", type: "color" },
                  ]}
                />
              </Card>
            </>
          )}

          {tab === "leads" && <Leads />}
          {tab === "payments" && <Payments />}
          {tab === "library" && <LibraryAdmin />}
        </div>
      </div>
    </div>
  );
}

function SeoPreview({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-6 rounded-xl bg-white p-4 text-left">
      <p className="text-xs text-[#202124]">royalfitnessclub.in</p>
      <p className="truncate text-lg text-[#1a0dab]">{title}</p>
      <p className="line-clamp-2 text-sm text-[#4d5156]">{description}</p>
      <p className={`mt-2 text-xs ${title.length > 60 || description.length > 160 ? "text-red-600" : "text-green-700"}`}>
        Title {title.length}/60 · Description {description.length}/160
      </p>
    </div>
  );
}

function BlogEditor({ posts, onChange, business }: { posts: BlogPost[]; onChange: (v: BlogPost[]) => void; business: SiteContent["business"] }) {
  const [editing, setEditing] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);
  const post = editing !== null ? posts[editing] : null;
  const blocks = useMemo(() => (post && preview ? parseMarkdown(post.body) : []), [post, preview]);

  const update = (p: BlogPost) => onChange(posts.map((x, i) => (i === editing ? p : x)));

  if (post) {
    return (
      <Card title={post.title || "Untitled post"}>
        <div className="mb-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-white/15 px-3 py-2 text-sm">
            ← All posts
          </button>
          <button type="button" onClick={() => setPreview((p) => !p)} className="rounded-lg bg-white/10 px-3 py-2 text-sm">
            {preview ? "Edit" : "Preview"}
          </button>
          {!post.draft && (
            <a href={`/blog/${post.slug}`} target="_blank" className="rounded-lg border border-white/15 px-3 py-2 text-sm">
              Open live post ↗
            </a>
          )}
        </div>
        {preview ? (
          <div className="rounded-2xl bg-ink p-5">
            <h1 className="font-display mb-4 text-4xl text-white">{post.title}</h1>
            <Markdown blocks={blocks} cta={{ whatsapp: `https://wa.me/${business.whatsapp}`, phone: `tel:${business.phone}` }} />
          </div>
        ) : (
          <>
            <ObjectEditor
              value={post}
              onChange={(v) => update(v)}
              fields={[
                { key: "title", label: "Title", wide: true },
                { key: "slug", label: "URL slug", help: "lowercase-with-hyphens — changing it changes the URL" },
                { key: "category", label: "Category" },
                { key: "excerpt", label: "Excerpt", type: "textarea" },
                { key: "cover", label: "Cover image", type: "image" },
                { key: "tags", label: "Tags (one per line)", type: "lines" },
                { key: "author", label: "Author" },
                { key: "draft", label: "Draft (hidden from site)", type: "bool" },
                { key: "published", label: "Published date", type: "date" },
                { key: "updated", label: "Updated date", type: "date" },
                { key: "seoTitle", label: "SEO title (≤ 60 chars)", wide: true },
                { key: "seoDescription", label: "SEO description (≤ 160 chars)", type: "textarea" },
              ]}
            />
            <div className="mt-5">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">Article body</label>
              <textarea className="field font-mono text-sm leading-relaxed" rows={24} value={post.body} onChange={(e) => update({ ...post, body: e.target.value })} />
              <details className="mt-3 rounded-xl bg-white/[.03] p-4 text-sm text-white/65">
                <summary className="cursor-pointer font-semibold text-white">Formatting & interactive blocks</summary>
                <ul className="mt-3 space-y-1.5 font-mono text-xs">
                  <li>## Heading · ### Sub-heading · **bold** · *italic* · [link](/tools)</li>
                  <li>- bullet list · 1. numbered list · &gt; quote · ![alt text](image-url)</li>
                  <li>| Col A | Col B | then |---|---| then rows → table</li>
                  <li>[[cta]] → free-trial booking card</li>
                  <li>[[quiz:Question|Option A|*Correct option|Option C|Explanation]]</li>
                  <li>[[calculator:KEY]] → keys: {CALCULATORS.map((c) => c.key).join(", ")}</li>
                </ul>
              </details>
            </div>
          </>
        )}
      </Card>
    );
  }

  return (
    <Card title="Blog posts" help="Posts with quizzes and calculators keep readers on the page longer — good for SEO.">
      <div className="space-y-2">
        {posts.map((p, i) => (
          <div key={p.slug + i} className="flex items-center gap-3 rounded-xl bg-white/[.03] px-4 py-3 ring-1 ring-white/10">
            <button type="button" className="flex-1 text-left" onClick={() => setEditing(i)}>
              <span className="block font-semibold text-white">{p.title}</span>
              <span className="text-xs text-white/50">
                /{p.slug} · {p.category} · {p.published} {p.draft && <span className="ml-1 rounded bg-yellow-500/20 px-1.5 text-yellow-200">Draft</span>}
              </span>
            </button>
            <button
              type="button"
              className="text-sm text-red-300/70 hover:text-red-300"
              onClick={() => {
                // Built-in posts come back on the next save (see mergePosts), so hide them instead.
                if (BUILTIN_POST_SLUGS.has(p.slug)) {
                  if (confirm(`Hide "${p.title}"? Built-in articles are kept as drafts so they can be restored.`))
                    onChange(posts.map((x, k) => (k === i ? { ...x, draft: true } : x)));
                } else if (confirm(`Delete "${p.title}"?`)) onChange(posts.filter((_, k) => k !== i));
              }}
            >
              {BUILTIN_POST_SLUGS.has(p.slug) ? "Hide" : "Delete"}
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          const today = new Date().toISOString().slice(0, 10);
          const title = "New article";
          let slug = slugify(title);
          while (posts.some((p) => p.slug === slug)) slug = `${slugify(title)}-${uid()}`;
          onChange([
            { slug, title, excerpt: "", category: "Workouts", tags: [], cover: "", author: business.name, published: today, updated: today, draft: true, seoTitle: "", seoDescription: "", body: "## Introduction\n\nStart writing…\n\n[[cta]]\n" },
            ...posts,
          ]);
          setEditing(0);
        }}
        className="btn-brand mt-5 rounded-xl px-4 py-2.5 text-sm font-bold"
      >
        + New post
      </button>
    </Card>
  );
}

type Order = {
  id: string;
  createdAt: string;
  razorpayPaymentId: string | null;
  status: "created" | "paid" | "failed";
  planName: string;
  duration: string;
  couple: boolean;
  amountPaise: number;
  name: string;
  phone: string;
  email: string | null;
  partnerName: string | null;
  startDate: string | null;
  referredBy: string | null;
};

function Payments() {
  const [data, setData] = useState<{ configured: boolean; orders: Order[]; error?: string } | null>(null);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    fetch("/api/admin/payments")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ configured: false, orders: [], error: "Couldn't load payments." }));
  }, []);

  if (!data) return <Loader2 className="h-6 w-6 animate-spin text-brand" />;
  const paid = data.orders.filter((o) => o.status === "paid");
  const shown = showAll ? data.orders : paid;
  const total = paid.reduce((sum, o) => sum + o.amountPaise, 0) / 100;
  const month = new Date().toISOString().slice(0, 7);
  const thisMonth = paid.filter((o) => o.createdAt.startsWith(month)).reduce((sum, o) => sum + o.amountPaise, 0) / 100;
  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <Card title="Online memberships" help="Paid through the Join online page (Razorpay). Referrals are listed so you can give both members their free month.">
      {!data.configured && (
        <p className="mb-4 rounded-xl bg-yellow-500/15 p-3 text-sm text-yellow-100">
          Online payment is off. Add RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET in Vercel → Settings → Environment Variables, then redeploy.
        </p>
      )}
      {data.error && <p className="mb-4 rounded-xl bg-red-500/15 p-3 text-sm text-red-200">{data.error}</p>}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          ["Paid members", String(paid.length)],
          ["This month", inr(thisMonth)],
          ["All time", inr(total)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white/[.04] p-3 ring-1 ring-white/10">
            <div className="text-xs text-white/50">{label}</div>
            <div className="text-lg font-bold text-white">{value}</div>
          </div>
        ))}
      </div>
      <label className="mb-3 flex items-center gap-2 text-sm text-white/60">
        <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> Show unfinished and failed attempts too
      </label>
      {shown.length === 0 ? (
        <p className="text-white/55">No {showAll ? "orders" : "payments"} yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-white/45">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Member</th>
                <th className="p-2">Plan</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Starts</th>
                <th className="p-2">Referred by</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr key={o.id} className="border-t border-white/10 align-top">
                  <td className="whitespace-nowrap p-2 text-white/60">{new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="p-2">
                    <span className="font-semibold text-white">{o.name}</span>
                    {o.partnerName && <span className="block text-xs text-white/55">+ {o.partnerName}</span>}
                    <a className="block text-xs text-brand" href={`https://wa.me/91${o.phone}`} target="_blank" rel="noreferrer">
                      {o.phone}
                    </a>
                  </td>
                  <td className="p-2 text-white/75">
                    {o.planName} · {o.duration}
                    {o.couple && " · couple"}
                  </td>
                  <td className="whitespace-nowrap p-2 font-semibold text-white">{inr(o.amountPaise / 100)}</td>
                  <td className="whitespace-nowrap p-2 text-white/65">{o.startDate ?? "—"}</td>
                  <td className="p-2 text-white/65">{o.referredBy ?? "—"}</td>
                  <td className="p-2">
                    <span className={`rounded px-1.5 py-0.5 text-xs ${o.status === "paid" ? "bg-emerald-500/20 text-emerald-200" : o.status === "failed" ? "bg-red-500/20 text-red-200" : "bg-white/10 text-white/60"}`}>
                      {o.status === "created" ? "not paid" : o.status}
                    </span>
                    {o.razorpayPaymentId && <span className="mt-1 block font-mono text-[10px] text-white/40">{o.razorpayPaymentId}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function Leads() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const load = () =>
    fetch("/api/admin/leads")
      .then((r) => r.json())
      .then((j) => setLeads(j.leads ?? []));
  useEffect(() => {
    load();
  }, []);

  const csv = () => {
    if (!leads) return;
    const rows = [["Date", "Name", "Phone", "Goal", "Message", "Source"], ...leads.map((l) => [l.createdAt, l.name, l.phone, l.goal, l.message, l.source])];
    const text = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    a.download = `enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <Card title="Free-trial enquiries" help="Submitted from the website forms. Tap WhatsApp to reply instantly.">
      {!leads ? (
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      ) : leads.length === 0 ? (
        <p className="text-white/55">No enquiries yet.</p>
      ) : (
        <>
          <button type="button" onClick={csv} className="mb-4 inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-white/45">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Goal</th>
                  <th className="p-2">Message</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-t border-white/10 align-top">
                    <td className="whitespace-nowrap p-2 text-white/60">{new Date(l.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="p-2 font-semibold text-white">{l.name}</td>
                    <td className="whitespace-nowrap p-2">
                      <a className="text-brand" href={`https://wa.me/${l.phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}`} target="_blank" rel="noreferrer">
                        {l.phone}
                      </a>
                    </td>
                    <td className="p-2 text-white/75">{l.goal}</td>
                    <td className="p-2 text-white/65">{l.message}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        className="text-xs text-red-300/70 hover:text-red-300"
                        onClick={async () => {
                          if (!confirm("Delete this enquiry?")) return;
                          await fetch(`/api/admin/leads?id=${encodeURIComponent(l.id)}`, { method: "DELETE" });
                          load();
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}

function BackupTools({ content, onImport }: { content: SiteContent; onImport: (c: SiteContent) => void }) {
  return (
    <div className="mt-4 hidden space-y-1 border-t border-white/10 pt-4 lg:block">
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-sm text-white/55 hover:bg-white/5"
        onClick={() => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: "application/json" }));
          a.download = `site-backup-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
        }}
      >
        <Download className="h-4 w-4" /> Download backup
      </button>
      <label className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-sm text-white/55 hover:bg-white/5">
        <Upload className="h-4 w-4" /> Restore backup
        <input
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              onImport(JSON.parse(await f.text()));
              alert("Backup loaded — review it, then press Save changes.");
            } catch {
              alert("That file is not a valid backup.");
            }
          }}
        />
      </label>
    </div>
  );
}
