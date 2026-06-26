export default function LeaderboardLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 md:px-8 py-6 font-sans select-none">
      <div className="bg-surface/50 border border-border/10 rounded-[20px] overflow-hidden">
        {/* Header skeleton */}
        <div className="px-6 py-5 border-b border-border/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-6 w-36 bg-surface-secondary rounded-md" />
              <div className="h-4 w-72 bg-surface-secondary rounded-md" />
            </div>
            <div className="h-9 w-[260px] bg-surface-secondary rounded-lg" />
          </div>
        </div>

        {/* Row skeletons */}
        <div className="py-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-6 py-3 border-b border-border/5 last:border-b-0"
            >
              {/* Rank */}
              <div className="w-8 h-8 rounded-full bg-surface-secondary shrink-0" />
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-surface-secondary shrink-0" />
              {/* Name + username */}
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-28 bg-surface-secondary rounded-md" />
                <div className="h-3 w-20 bg-surface-secondary rounded-md" />
              </div>
              {/* Stats */}
              <div className="text-right space-y-1.5">
                <div className="h-4 w-16 bg-surface-secondary rounded-md ml-auto" />
                <div className="h-3 w-12 bg-surface-secondary rounded-md ml-auto" />
              </div>
              {/* Action button */}
              <div className="w-7 h-7 rounded-full bg-surface-secondary shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
