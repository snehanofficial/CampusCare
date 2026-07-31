export function PageSkeleton() {
  return (
    <div className="space-y-6 w-full animate-pulse p-1">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border/40">
        <div className="space-y-2 w-1/3">
          <div className="h-8 rounded bg-muted w-3/4" />
          <div className="h-4 rounded bg-muted w-1/2" />
        </div>
        <div className="h-10 rounded bg-muted w-24 sm:w-32" />
      </div>

      {/* Grid Content Skeletons */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-muted border border-border/40" />
        ))}
      </div>

      {/* Main Panel Skeletons */}
      <div className="rounded-lg border border-border bg-card p-6 min-h-[300px] space-y-4">
        <div className="h-5 rounded bg-muted w-1/4" />
        <div className="h-4 rounded bg-muted w-full" />
        <div className="h-4 rounded bg-muted w-5/6" />
        <div className="h-4 rounded bg-muted w-4/5" />
      </div>
    </div>
  );
}
export default PageSkeleton;
