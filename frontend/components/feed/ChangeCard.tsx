"use client";

import { useState } from "react";
import Link from "next/link";
import { ImpactBadge, ChangeTypeBadge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/lib/utils";
import type { FeedItem } from "@/lib/types";
import { Calendar, ClipboardList } from "lucide-react";
import { CreateTaskSlideOver } from "@/components/tasks/CreateTaskSlideOver";

interface ChangeCardProps {
  item: FeedItem;
}

export function ChangeCard({ item }: ChangeCardProps) {
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const { change, relevance_score, relevance_reasoning } = item;
  const doc = change.processed_document;
  const source = change.source;

  const headline = change.headline;
  const summary = doc?.plain_summary ?? "";
  const keyDates = doc?.key_dates ?? [];
  const docId = doc?.id ?? change.processed_document_id;

  return (
    <>
    <Link href={`/document/${docId}`}>
      <article className="border border-border rounded p-6 cursor-pointer transition-all duration-150 group hover:border-crimson/30 hover:bg-crimson/[0.03] relative">
        {/* Left accent bar on hover */}
        <div className="absolute left-0 top-0 h-full w-0.5 bg-crimson rounded-l opacity-0 group-hover:opacity-100 transition-opacity duration-150" />

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <ImpactBadge level={change.impact_level} />
          <ChangeTypeBadge type={change.change_type} />
          {source && (
            <span className="text-[11px] text-text-tertiary font-mono uppercase tracking-wider">
              {source.name}
            </span>
          )}
          <span className="text-[11px] text-text-tertiary font-mono ml-auto">
            {formatRelativeDate(change.created_at)}
          </span>
        </div>

        {/* Headline */}
        <h3 className="font-display text-[20px] font-semibold text-text-primary leading-tight mb-2 group-hover:text-white transition-colors">
          {headline}
        </h3>

        {/* Summary */}
        {summary && (
          <p className="text-sm text-text-secondary font-sans leading-relaxed line-clamp-3 mb-3">
            {summary}
          </p>
        )}

        {/* Key dates */}
        {keyDates.length > 0 && (
          <div className="flex items-center gap-4 mb-3">
            {keyDates.slice(0, 2).map((kd, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-text-tertiary" />
                <span className="text-[11px] text-text-tertiary font-mono">
                  {kd.label}: {kd.date}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Relevance reasoning */}
        {relevance_reasoning && relevance_reasoning !== "Public feed — no personalization applied" && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-[11px] text-text-tertiary font-sans">
              <span className="text-crimson/70 font-mono uppercase tracking-wider text-[10px]">
                Flagged because:{" "}
              </span>
              {relevance_reasoning}
            </p>
          </div>
        )}

        {/* Footer: Create task */}
        <div className="mt-3 pt-3 border-t border-border flex justify-end">
          <button
            onClick={(e) => { e.preventDefault(); setSlideOverOpen(true); }}
            className="flex items-center gap-1.5 text-[11px] text-text-tertiary hover:text-crimson font-sans transition-colors"
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
