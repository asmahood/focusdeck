export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-md border border-neutral-800 bg-neutral-800 p-3">
      <div className="flex flex-col gap-2">
        {/* Status Badge */}
        <div className="h-5 w-16 rounded-md bg-neutral-700" />

        {/* Title - Two lines */}
        <div className="space-y-1">
          <div className="h-4 w-full rounded bg-neutral-700" />
          <div className="h-4 w-3/4 rounded bg-neutral-700" />
        </div>

        {/* Repository */}
        <div className="h-3 w-32 rounded bg-neutral-700" />

        {/* Metadata */}
        <div className="h-3 w-24 rounded bg-neutral-700" />
      </div>
    </div>
  );
}
