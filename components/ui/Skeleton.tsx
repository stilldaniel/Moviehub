import { cn } from "@/lib/utils";

// Placeholder shown while a horizontal row of posters loads; matches MovieCard's row sizes
export function PosterRowSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-hidden pt-3 pb-6 -mt-3 -mb-4" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shrink-0 w-40 sm:w-48 md:w-56 aspect-2/3 rounded-xl bg-surface-raised animate-pulse" />
      ))}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div aria-hidden className={cn("rounded-md bg-surface-raised animate-pulse", className)} />;
}
