"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { BlogPost } from "@/lib/content/types";
import { PostCard } from "@/components/home/Blocks";

export function BlogExplorer({ posts, categories }: { posts: BlogPost[]; categories: string[] }) {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [cat, setCat] = useState("All");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return posts.filter(
      (p) =>
        (cat === "All" || p.category === cat) &&
        (!needle || [p.title, p.excerpt, p.category, ...p.tags].join(" ").toLowerCase().includes(needle)),
    );
  }, [posts, q, cat]);

  return (
    <>
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categories">
          {["All", ...categories].map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={cat === c}
              onClick={() => setCat(c)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${cat === c ? "bg-brand text-white" : "border border-white/15 text-white/70 hover:text-white"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="relative block md:w-72">
          <span className="sr-only">Search articles</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search articles…" className="field pl-9" />
        </label>
      </div>
      {filtered.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <PostCard key={p.slug} post={p} index={i % 3} />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-white/60">No articles match “{q}”. Try another search.</p>
      )}
    </>
  );
}
