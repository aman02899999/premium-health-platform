"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Something didn&apos;t load</h1>
      <p className="mt-2 text-stone-600 dark:text-stone-300">A network hiccup — your health content is safe. Please try again.</p>
      <button onClick={reset} className="mt-6 rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-600">Try again</button>
    </div>
  );
}
