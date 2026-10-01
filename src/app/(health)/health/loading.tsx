export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16" aria-label="Loading">
      <div className="h-8 w-64 animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800" />
      <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-stone-200/70 dark:bg-stone-800/70" />
        ))}
      </div>
    </div>
  );
}
