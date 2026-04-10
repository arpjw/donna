"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { digestsApi } from "@/lib/api";
import type { Digest } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { CardSkeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";
import Link from "next/link";

export default function DigestsPage() {
  const { getToken } = useAuth();
  const [digests, setDigests] = useState<Digest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = await getToken();
        const result = await digestsApi.list(token ?? undefined);
        setDigests(result.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load digests");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [getToken]);

  return (
    <div className="max-w-[860px] mx-auto px-8 py-8">
      <div className="border-b border-border pb-5 mb-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary">
          Digests
        </h1>
        <p className="text-sm text-text-secondary font-sans mt-1">
          Your weekly regulatory briefings
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <p className="text-text-secondary text-sm font-sans">{error}</p>
      ) : digests.length === 0 ? (
        <div className="border border-border rounded p-12 text-center">
          <BookOpen className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <p className="font-display text-xl text-text-primary mb-2">
            No digests yet
          </p>
          <p className="text-sm text-text-secondary font-sans max-w-sm mx-auto">
            Your first weekly digest will be assembled and sent on Monday at 8am.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {digests.map((digest) => (
            <Link key={digest.id} href={`/digests/${digest.id}`}>
              <div className="border border-border rounded p-5 hover:border-white/20 hover:bg-white/[0.02] transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider">
                    {formatDate(digest.period_start)} — {formatDate(digest.period_end)}
                  </span>
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${
                    digest.status === "sent" ? "text-impact-low" : "text-text-tertiary"
                  }`}>
                    {digest.status}
                  </span>
                </div>
                <p className="font-display text-lg font-semibold text-text-primary group-hover:text-white transition-colors">
                  {digest.headline}
                </p>
                <p className="text-xs text-text-tertiary font-mono mt-1">
                  {digest.change_ids.length} changes included
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
