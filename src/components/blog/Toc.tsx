"use client";

import { useEffect, useState } from "react";

export function Toc({ items }: { items: { id: string; text: string; level: number }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-90px 0px -65% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  if (items.length < 2) return null;
  return (
    <nav aria-label="Table of contents" className="glass rounded-2xl p-5">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gold">On this page</p>
      <ol className="space-y-1.5 text-sm">
        {items.map((i) => (
          <li key={i.id} className={i.level === 3 ? "pl-4" : ""}>
            <a
              href={`#${i.id}`}
              className={`block border-l-2 py-0.5 pl-3 transition-colors ${active === i.id ? "border-gold text-white" : "border-transparent text-white/55 hover:text-white"}`}
            >
              {i.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
