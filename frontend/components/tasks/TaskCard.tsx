"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Check, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ComplianceTask, TaskStatus } from "@/lib/types";

interface TaskCardProps {
  task: ComplianceTask;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: ComplianceTask) => void;
}

const PRIORITY_BORDER: Record<string, string> = {
  high: "border-l-crimson",
  medium: "border-l-impact-medium",
  low: "border-l-impact-low",
};

const STATUS_BADGE: Record<string, string> = {
  open: "bg-white/5 text-text-secondary border-border",
  in_progress: "bg-impact-medium/10 text-impact-medium border-impact-medium/20",
  complete: "bg-impact-low/10 text-impact-low border-impact-low/20",
  dismissed: "bg-white/5 text-text-tertiary border-border",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  complete: "Complete",
  dismissed: "Dismissed",
};

function dueDateColor(dateStr: string | null): string {
  if (!dateStr) return "text-text-tertiary";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "text-impact-high";
  if (diffDays <= 3) return "text-impact-medium";
  return "text-text-tertiary";
}

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `Overdue (${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export function TaskCard({ task, onStatusChange, onEdit }: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const source = task.change?.source;
  const docId = task.change?.processed_document_id;

  return (
    <div
      className={cn(
        "border border-border border-l-4 rounded p-5 relative group",
        PRIORITY_BORDER[task.priority] ?? "border-l-border"
      )}
    >
      {/* Top row: status badge + due date + menu */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge className={STATUS_BADGE[task.status]}>
            {STATUS_LABELS[task.status]}
          </Badge>
          {task.due_date && task.status !== "complete" && (
            <span className={cn("text-[11px] font-mono", dueDateColor(task.due_date))}>
              {formatDueDate(task.due_date)}
            </span>
          )}
        </div>

        {/* Three-dot menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded text-text-tertiary hover:text-text-secondary hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-7 z-20 bg-card border border-border rounded shadow-lg py-1 min-w-[140px]">
                <button
                  onClick={() => { onEdit(task); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-white/5 font-sans transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                {task.status !== "complete" && (
                  <button
                    onClick={() => { onStatusChange(task.id, "complete"); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-impact-low hover:bg-white/5 font-sans transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Mark complete
                  </button>
                )}
                <button
                  onClick={() => { onStatusChange(task.id, "dismissed"); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-text-tertiary hover:text-impact-high hover:bg-white/5 font-sans transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Dismiss
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-display text-[18px] font-semibold text-text-primary leading-snug mb-1">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-text-secondary font-sans leading-relaxed line-clamp-2 mb-2">
          {task.description}
        </p>
      )}

      {/* Linked change */}
      {source && docId && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-[11px] text-text-tertiary font-mono">{source.name}</span>
          <span className="text-text-tertiary">·</span>
          <Link
            href={`/document/${docId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] text-crimson/70 hover:text-crimson font-mono transition-colors"
          >
            View document →
          </Link>
        </div>
      )}
    </div>
  );
}
