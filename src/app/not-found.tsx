import Link from "next/link";
import { CrownMark } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <CrownMark className="float-slow h-20 w-20" />
      <h1 className="font-display mt-8 text-7xl text-gold-gradient">404</h1>
      <p className="mt-3 text-xl text-white">This rep doesn&apos;t exist.</p>
      <p className="mt-2 text-white/60">The page you were looking for has moved or never existed.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn-gold rounded-full px-6 py-3 font-bold">
          Back to home
        </Link>
        <Link href="/blog" className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white">
          Read the blog
        </Link>
      </div>
    </main>
  );
}
