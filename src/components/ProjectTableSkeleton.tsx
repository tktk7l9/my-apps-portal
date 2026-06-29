export function ProjectTableSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {/* Category + search row */}
      <div className="flex flex-wrap items-center gap-2">
        {[56, 60, 76, 60, 56].map((w, i) => (
          <div key={i} className="h-6 rounded-md bg-white/8" style={{ width: w }} />
        ))}
        <div className="ml-auto h-6 w-44 rounded-md bg-white/8" />
      </div>
      {/* Tech filter row */}
      <div className="flex flex-wrap gap-1.5">
        {[52, 48, 64, 80, 40, 96, 72, 64, 104].map((w, i) => (
          <div key={i} className="h-5 rounded-md bg-white/5" style={{ width: w }} />
        ))}
      </div>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-white/8">
        <div className="border-b border-white/8 bg-white/3 px-4 py-3">
          <div className="flex gap-16">
            {[120, 80, 140, 100, 120, 80].map((w, i) => (
              <div key={i} className="h-3 rounded bg-white/10" style={{ width: w }} />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`flex gap-12 px-4 py-4 ${i < 4 ? "border-b border-white/5" : ""}`}
          >
            <div className="w-52 shrink-0 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-white/10" />
                <div className="h-4 w-32 rounded bg-white/10" />
              </div>
              <div className="h-3 w-44 rounded bg-white/5" />
            </div>
            <div className="w-20 shrink-0">
              <div className="h-5 w-20 rounded-full bg-white/10" />
            </div>
            <div className="w-32 shrink-0 space-y-2">
              <div className="h-3 w-28 rounded bg-white/10" />
              <div className="h-3 w-24 rounded bg-white/10" />
            </div>
            <div className="w-24 shrink-0 space-y-1.5">
              <div className="h-3 w-20 rounded bg-white/5" />
              <div className="h-3 w-20 rounded bg-white/5" />
            </div>
            <div className="w-24 shrink-0">
              <div className="h-5 w-16 rounded-md bg-white/10" />
            </div>
            <div className="w-20 shrink-0 space-y-2">
              <div className="h-3 w-10 rounded bg-white/10" />
              <div className="h-5 w-14 rounded-md bg-white/10" />
            </div>
          </div>
        ))}
      </div>
      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-white/8 bg-white/2 p-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-white/10" />
              <div className="h-4 w-36 rounded bg-white/10" />
            </div>
            <div className="h-3 w-full rounded bg-white/5" />
            <div className="flex gap-2">
              <div className="h-5 w-20 rounded-full bg-white/10" />
              <div className="h-5 w-16 rounded-md bg-white/10" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-32 rounded bg-white/10" />
              <div className="h-3 w-28 rounded bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
