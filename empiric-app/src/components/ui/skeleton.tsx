export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Carregando">
      <Skeleton className="mb-3 h-4 w-32" />
      <Skeleton className="mb-10 h-12 w-80 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
