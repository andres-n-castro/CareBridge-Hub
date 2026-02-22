import { Skeleton } from "../../../components/ui/skeleton";

export function StatusCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden w-full max-w-3xl mx-auto p-8 space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col items-center space-y-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2 flex flex-col items-center w-full">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Stepper Skeleton */}
      <div className="flex justify-between w-full pt-4 pb-6 px-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Progress Bar Skeleton */}
      <div className="space-y-2 w-full">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Buttons Skeleton */}
      <div className="flex justify-center pt-4">
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>
    </div>
  );
}
