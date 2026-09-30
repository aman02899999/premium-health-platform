"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-5xl text-white">Something went wrong</h1>
      <p className="mt-3 text-white/60">Please try again, or call us directly.</p>
      <button type="button" onClick={reset} className="btn-gold mt-8 rounded-full px-6 py-3 font-bold">
        Try again
      </button>
    </main>
  );
}
