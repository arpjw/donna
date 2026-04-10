"use client";

import { cn } from "@/lib/utils";

type ImpactFilter = "all" | "high" | "medium" | "low";

interface FeedHeaderProps {
  total: number;
  impactFilter: ImpactFilter;
  onImpactChange: (f: ImpactFilter) => void;
  lastUpdated?: string;
}

const FILTERS: { value: ImpactFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function FeedHeader({
  total,
  impactFilter,
  onImpactChange,
  lastUpdated,
}: FeedHeaderProps) {
  return (
    <div className="border-b border-border px-8 py-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-text-primary tracking-tight">
            Your regulatory feed
          </h1>
          {lastUpdated && (
            <p className="text-xs text-text-tertiary font-mono mt-1">
              {total} changes · last updated {lastUpdated}
            </p>
          )}
        </div>
      </div>

      {/* Impact filter tabs */}
      <div className="flex gap-1">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onImpactChange(value)}
            className={cn(
              "px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors",
              impactFilter === value
                ? "bg-crimson/10 text-crimson border border-crimson/20"
                : "text-text-tertiary hover:text-text-secondary hover:bg-white/5"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
