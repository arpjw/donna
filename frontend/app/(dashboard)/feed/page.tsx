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

      <div className="px-8 py-6 space-y-4">
        {loading && items.length === 0 ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : error ? (
          <div className="border border-border rounded p-8 text-center">
            <p className="text-text-secondary font-sans text-sm">{error}</p>
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
              <div className="pt-4 pb-8 flex justify-center">
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
    <div className="border border-border rounded p-12 text-center mt-4">
      <p className="font-display text-xl text-text-primary mb-2">
        Your regulatory feed is empty.
      </p>
      <p className="text-sm text-text-secondary font-sans max-w-sm mx-auto">
        Donna is monitoring sources and will surface relevant changes as they are published.
      </p>
    </div>
  );
}
