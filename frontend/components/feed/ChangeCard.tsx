"use client";

import { useState } from "react";
import Link from "next/link";
import { ImpactBadge, ChangeTypeBadge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/lib/utils";
import type { FeedItem } from "@/lib/types";
import { ClipboardList } from "lucide-react";
import { CreateTaskSlideOver } from "@/components/tasks/CreateTaskSlideOver";

interface ChangeCardProps {
  item: FeedItem;
}

const IMPACT_BORDER: Record<string, string> = {
  high: "#B85C5C",
  medium: "#D4893A",
  low: "#7B9E87",
};

export function ChangeCard({ item }: ChangeCardProps) {
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const { change, relevance_score, relevance_reasoning } = item;
  const doc = change.processed_document;
  const source = change.source;

  const headline = change.headline;
  const summary = doc?.plain_summary ?? "";
  const keyDates = doc?.key_dates ?? [];
  const docId = doc?.id ?? change.processed_document_id;

  const borderColor = IMPACT_BORDER[change.impact_level] ?? "#D5D0C8";

  return (
    <>
      <Link href={`/document/${docId}`}>
        <article
          className="cursor-pointer transition-all duration-150 group relative"
          style={{ background: "#F5F2EC", padding: "20px 28px" }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "#FAF8F4";
            el.style.borderLeft = `3px solid ${borderColor}`;
            el.style.paddingLeft = "25px";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "#F5F2EC";
            el.style.borderLeft = "";
            el.style.paddingLeft = "28px";
          }}
        >
          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <ImpactBadge level={change.impact_level} />
            <ChangeTypeBadge type={change.change_type} />
            {source && (
              <span
                className="font-mono uppercase tracking-wider"
                style={{ fontSize: 10, color: "#9E9890" }}
              >
                {source.name}
              </span>
            )}
            <span
              className="font-mono ml-auto"
              style={{ fontSize: 10, color: "#9E9890" }}
            >
              {formatRelativeDate(change.created_at)}
            </span>
          </div>

          {/* Headline */}
          <h3
            className="font-display leading-tight mb-2"
            style={{ fontSize: 18, color: "#1C1814", fontWeight: 400 }}
          >
            {headline}
          </h3>

          {/* Summary */}
          {summary && (
            <p
              className="font-sans leading-relaxed line-clamp-3 mb-3"
              style={{ fontSize: 12.5, color: "#6B655C", fontWeight: 300 }}
            >
              {summary}
            </p>
          )}

          {/* Key dates */}
          {keyDates.length > 0 && (
            <div className="flex items-center gap-4 mb-3">
              {keyDates.slice(0, 2).map((kd, i) => (
                <span
                  key={i}
                  className="font-mono px-1.5 py-0.5 rounded"
                  style={{
                    fontSize: 8.5,
                    background: "#FAF0EC",
                    border: "1px solid #E8C4BC",
                    color: "#8B3A2F",
                    letterSpacing: "0.05em",
                  }}
                >
                  {kd.label}: {kd.date}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div
            className="mt-3 pt-3 flex items-center justify-between"
            style={{ borderTop: "1px solid #E2DDD5" }}
          >
            {/* Flagged label */}
            {relevance_reasoning &&
            relevance_reasoning !== "Public feed — no personalization applied" ? (
              <p style={{ fontSize: 11, color: "#9E9890" }} className="font-sans line-clamp-1 flex-1 mr-4">
                <span
                  className="font-mono uppercase"
                  style={{ fontSize: 8.5, color: "#C4855A", letterSpacing: "0.08em" }}
                >
                  FLAGGED:{" "}
                </span>
                {relevance_reasoning}
              </p>
            ) : (
              <span />
            )}

            {/* Create task */}
            <button
              onClick={(e) => {
                e.preventDefault();
                setSlideOverOpen(true);
              }}
              className="flex items-center gap-1.5 font-sans transition-colors shrink-0"
              style={{ fontSize: 11, color: "#9E9890" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#C4855A")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#9E9890")}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Create task
            </button>
          </div>
        </article>
      </Link>
      <CreateTaskSlideOver
        open={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        feedItem={item}
      />
    </>
  );
}
