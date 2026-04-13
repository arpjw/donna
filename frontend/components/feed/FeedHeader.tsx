"use client";

import { cn } from "@/lib/utils";

type ImpactFilter = "all" | "high" | "medium" | "low";

interface FeedHeaderProps {
  total: number;
  impactFilter: ImpactFilter;
  onImpactChange: (f: ImpactFilter) => void;
  lastUpdated?: string;
}

const FILTERS: { value: ImpactFilter; label: string; activeStyle: React.CSSProperties }[] = [
  {
    value: "all",
    label: "All",
    activeStyle: { background: "#1C1814", color: "#F5F2EC", border: "1px solid #1C1814" },
  },
  {
    value: "high",
    label: "High",
    activeStyle: { background: "#FAF0EC", border: "1px solid #E8C4BC", color: "#8B3A2F" },
  },
  {
    value: "medium",
    label: "Medium",
    activeStyle: { background: "#FDF4EA", border: "1px solid #E8D4BC", color: "#8B5E2F" },
  },
  {
    value: "low",
    label: "Low",
    activeStyle: { background: "#EFF4ED", border: "1px solid #C4D8BC", color: "#3A6B3A" },
  },
];

export function FeedHeader({
  total,
  impactFilter,
  onImpactChange,
  lastUpdated,
}: FeedHeaderProps) {
  return (
    <div
      className="px-8 py-5"
      style={{ borderBottom: "1px solid #DDD8D0" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1
            className="font-display"
            style={{ fontSize: 26, color: "#1C1814" }}
          >
            Your regulatory feed
          </h1>
          {lastUpdated && (
            <p
              className="font-mono mt-1"
              style={{ fontSize: 10.5, color: "#9E9890" }}
            >
              {total} changes · last updated {lastUpdated}
            </p>
          )}
        </div>
      </div>

      {/* Impact filter pills */}
      <div className="flex gap-1.5">
        {FILTERS.map(({ value, label, activeStyle }) => (
          <button
            key={value}
            onClick={() => onImpactChange(value)}
            className="font-mono uppercase rounded transition-colors"
            style={{
              fontSize: 9.5,
              letterSpacing: "0.06em",
              padding: "4px 10px",
              ...(impactFilter === value
                ? activeStyle
                : {
                    color: "#9E9890",
                    border: "1px solid #E2DDD5",
                    background: "transparent",
                  }),
            }}
            onMouseEnter={(e) => {
              if (impactFilter !== value) {
                (e.currentTarget as HTMLButtonElement).style.color = "#6B655C";
              }
            }}
            onMouseLeave={(e) => {
              if (impactFilter !== value) {
                (e.currentTarget as HTMLButtonElement).style.color = "#9E9890";
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
