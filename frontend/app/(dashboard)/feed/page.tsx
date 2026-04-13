"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { ChangeCard } from "@/components/feed/ChangeCard";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { CardSkeleton } from "@/components/ui/skeleton";
import { changesApi } from "@/lib/api";
import type { FeedItem } from "@/lib/types";
import { formatRelativeDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ImpactFilter = "all" | "high" | "medium" | "low";

export default function FeedPage() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [lastUpdated] = useState(formatRelativeDate(new Date().toISOString()));

  const fetchFeed = useCallback(
    async (impact: ImpactFilter, p: number, append = false) => {
      try {
        setLoading(true);
        setError(null);
        const token = await getToken();
        const result = await changesApi.list(
          {
            page: p,
            page_size: 20,
            ...(impact !== "all" ? { impact_level: impact } : {}),
          },
          token ?? undefined
        );
        setItems((prev) => (append ? [...prev, ...result.items] : result.items));
        setHasMore(result.has_more);
        setTotal(result.total);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load feed");
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  useEffect(() => {
    setPage(1);
    fetchFeed(impactFilter, 1, false);
  }, [impactFilter, fetchFeed]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchFeed(impactFilter, next, true);
  };

  return (
    <div className="max-w-[860px] mx-auto px-0">
      <FeedHeader
        total={total}
        impactFilter={impactFilter}
        onImpactChange={(f) => setImpactFilter(f)}
        lastUpdated={lastUpdated}
      />

      {/* Feed area — #DDD8D0 background with 1px gaps between cards */}
      <div
        className="py-0"
        style={{ background: "#DDD8D0", display: "flex", flexDirection: "column", gap: 1 }}
      >
        {loading && items.length === 0 ? (
          <div style={{ background: "#F5F2EC", display: "flex", flexDirection: "column", gap: 1 }}>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : error ? (
          <div
            className="p-8 text-center"
            style={{ background: "#F5F2EC" }}
          >
            <p className="font-sans text-sm" style={{ color: "#6B655C" }}>{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={() => fetchFeed(impactFilter, 1)}
            >
              Try again
            </Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {items.map((item) => (
              <ChangeCard key={item.change.id} item={item} />
            ))}
            {hasMore && (
              <div className="py-6 flex justify-center" style={{ background: "#F5F2EC" }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="p-12 text-center"
      style={{ background: "#F5F2EC" }}
    >
      <p className="font-display text-xl mb-2" style={{ color: "#1C1814" }}>
        Your regulatory feed is empty.
      </p>
      <p className="font-sans text-sm max-w-sm mx-auto" style={{ color: "#6B655C", fontWeight: 300 }}>
        Donna is monitoring sources and will surface relevant changes as they are published.
      </p>
    </div>
  );
}
