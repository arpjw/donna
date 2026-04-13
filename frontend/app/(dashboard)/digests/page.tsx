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
      <div className="pb-5 mb-8" style={{ borderBottom: "1px solid #E2DDD5" }}>
        <h1 className="font-display" style={{ fontSize: 26, color: "#1C1814" }}>
          Digests
        </h1>
        <p className="font-sans text-sm mt-1" style={{ color: "#6B655C", fontWeight: 300 }}>
          Your weekly regulatory briefings
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <p className="font-sans text-sm" style={{ color: "#6B655C" }}>{error}</p>
      ) : digests.length === 0 ? (
        <div
          className="rounded p-12 text-center"
          style={{ border: "1px solid #E2DDD5" }}
        >
          <BookOpen className="w-8 h-8 mx-auto mb-3" style={{ color: "#D5D0C8" }} />
          <p className="font-display text-xl mb-2" style={{ color: "#1C1814" }}>
            No digests yet.
          </p>
          <p className="font-sans text-sm max-w-sm mx-auto" style={{ color: "#6B655C", fontWeight: 300 }}>
            Your first digest will be sent on your scheduled day.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {digests.map((digest) => (
            <Link key={digest.id} href={`/digests/${digest.id}`}>
              <div
                className="rounded p-5 cursor-pointer transition-colors group"
                style={{ background: "#F5F2EC", border: "1px solid #E2DDD5" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(196,133,90,0.30)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#E2DDD5";
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono uppercase tracking-wider" style={{ fontSize: 10, color: "#9E9890" }}>
                    {formatDate(digest.period_start)} — {formatDate(digest.period_end)}
                  </span>
                  <span
                    className="font-mono uppercase tracking-wider"
                    style={{
                      fontSize: 10,
                      color: digest.status === "sent" ? "#7B9E87" : "#9E9890",
                    }}
                  >
                    {digest.status}
                  </span>
                </div>
                <p className="font-display text-lg" style={{ color: "#1C1814" }}>
                  {digest.headline}
                </p>
                <p className="font-mono mt-1" style={{ fontSize: 11, color: "#9E9890" }}>
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
