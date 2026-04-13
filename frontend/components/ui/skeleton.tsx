import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded skeleton", className)}
    />
  );
}

export function CardSkeleton() {
  return (
    <div
      className="rounded p-6 space-y-3"
      style={{ background: "#F5F2EC", border: "1px solid #E2DDD5" }}
    >
      <div className="flex gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
