import Link from "next/link";
import { User, ShieldCheck } from "lucide-react";

export function AuthorBox({ author, role, reviewer }: { author: string; role?: string; reviewer?: string }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-black">
          {author.charAt(0)}
        </div>
        <div>
          <p className="flex items-center gap-2 text-sm font-bold"><User className="h-4 w-4 text-emerald-600" /> {author}</p>
          <p className="text-xs text-stone-500">{role || "BHG Editorial Team · Evidence-reviewed health writers"}</p>
          {reviewer && <p className="flex items-center gap-1 text-xs text-stone-500"><ShieldCheck className="h-3 w-3 text-emerald-600" /> Reviewed by {reviewer}</p>}
        </div>
      </div>
      <div className="mt-3 flex gap-2 text-xs">
        <Link href="/about" className="rounded-full bg-stone-100 px-3 py-1 font-bold hover:bg-emerald-100 dark:bg-stone-800">About us</Link>
        <Link href="/blog/author" className="rounded-full bg-stone-100 px-3 py-1 font-bold hover:bg-emerald-100 dark:bg-stone-800">All authors</Link>
      </div>
    </div>
  );
}

export function AuthorList() {
  const authors = [
    { name: "BHG Editorial Team", role: "Evidence-reviewed health writers", articles: 12 },
    { name: "BHG Newsroom", role: "Daily medical briefings", articles: 13 },
    { name: "Dr. Placeholder", role: "Medical review pending — placeholder", articles: 0 },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {authors.map((a) => (
        <div key={a.name} className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
          <p className="font-bold">{a.name}</p>
          <p className="text-xs text-stone-500">{a.role}</p>
          <p className="mt-1 text-xs font-bold text-emerald-700">{a.articles} articles</p>
        </div>
      ))}
    </div>
  );
}
