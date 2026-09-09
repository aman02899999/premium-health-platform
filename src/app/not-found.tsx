import Link from "next/link";
import { Search, Home, Stethoscope } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="text-7xl font-black text-emerald-800/10 dark:text-emerald-200/10">404</p>
      <h1 className="font-display -mt-6 text-3xl font-bold">This health topic isn&apos;t here (yet)</h1>
      <p className="mt-2 text-stone-600 dark:text-stone-300">The page moved, or we&apos;re still writing it with medical review. Try search or start from our core guides.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/" className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600"><Home className="h-4 w-4" /> Home</Link>
        <Link href="/search" className="flex items-center gap-1.5 rounded-xl border border-stone-300 px-5 py-2.5 text-sm font-bold hover:border-emerald-400 dark:border-stone-700"><Search className="h-4 w-4" /> Search</Link>
        <Link href="/diseases" className="flex items-center gap-1.5 rounded-xl border border-stone-300 px-5 py-2.5 text-sm font-bold hover:border-emerald-400 dark:border-stone-700"><Stethoscope className="h-4 w-4" /> Diseases</Link>
      </div>
    </div>
  );
}
