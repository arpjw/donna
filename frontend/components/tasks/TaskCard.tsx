"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Check, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComplianceTask, TaskStatus } from "@/lib/types";

interface TaskCardProps {
  task: ComplianceTask;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: ComplianceTask) => void;
}

const PRIORITY_BORDER: Record<string, string> = {
  high: "#B85C5C",
  medium: "#D4893A",
  low: "#7B9E87",
};

const STATUS_BADGE: Record<string, React.CSSProperties> = {
  open: { background: "#EEE9E0", border: "1px solid #D5D0C8", color: "#6B655C" },
  in_progress: { background: "#FDF4EA", border: "1px solid #E8D4BC", color: "#8B5E2F" },
  complete: { background: "#EFF4ED", border: "1px solid #C4D8BC", color: "#3A6B3A" },
  dismissed: { background: "#EEE9E0", border: "1px solid #D5D0C8", color: "#9E9890" },
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  complete: "Complete",
  dismissed: "Dismissed",
};

function dueDateColor(dateStr: string | null): string {
  if (!dateStr) return "#9E9890";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "#B85C5C";
  if (diffDays <= 3) return "#D4893A";
  return "#9E9890";
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
  const borderColor = PRIORITY_BORDER[task.priority] ?? "#E2DDD5";

  return (
    <div
      className="relative group"
      style={{
        background: "#F5F2EC",
        border: "1px solid #E2DDD5",
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 5,
        padding: 20,
      }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="font-mono uppercase tracking-widest rounded-full"
            style={{ fontSize: 9, padding: "2px 8px", letterSpacing: "0.08em", ...STATUS_BADGE[task.status] }}
          >
            {STATUS_LABELS[task.status]}
          </span>
          {task.due_date && task.status !== "complete" && (
            <span className="font-mono" style={{ fontSize: 11, color: dueDateColor(task.due_date) }}>
              {formatDueDate(task.due_date)}
            </span>
          )}
        </div>

        {/* Three-dot menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100"
            style={{ color: "#9E9890" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#6B655C")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#9E9890")}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                className="absolute right-0 top-7 z-20 rounded py-1 min-w-[140px]"
                style={{ background: "#F5F2EC", border: "1px solid #E2DDD5" }}
              >
                <button
                  onClick={() => { onEdit(task); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 font-sans text-xs transition-colors"
                  style={{ color: "#6B655C" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#1C1814")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#6B655C")}
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                {task.status !== "complete" && (
                  <button
                    onClick={() => { onStatusChange(task.id, "complete"); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 font-sans text-xs transition-colors"
                    style={{ color: "#7B9E87" }}
                  >
                    <Check className="w-3.5 h-3.5" /> Mark complete
                  </button>
                )}
                <button
                  onClick={() => { onStatusChange(task.id, "dismissed"); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 font-sans text-xs transition-colors"
                  style={{ color: "#9E9890" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#B85C5C")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#9E9890")}
                >
                  <X className="w-3.5 h-3.5" /> Dismiss
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-display leading-snug mb-1" style={{ fontSize: 18, color: "#1C1814" }}>
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="font-sans leading-relaxed line-clamp-2 mb-2" style={{ fontSize: 13, color: "#6B655C", fontWeight: 300 }}>
          {task.description}
        </p>
      )}

      {/* Linked change */}
      {source && docId && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className="font-mono" style={{ fontSize: 11, color: "#9E9890" }}>{source.name}</span>
          <span style={{ color: "#9E9890" }}>·</span>
          <Link
            href={`/document/${docId}`}
            onClick={(e) => e.stopPropagation()}
            className="font-mono transition-colors"
            style={{ fontSize: 11, color: "rgba(196,133,90,0.70)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#C4855A")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(196,133,90,0.70)")}
          >
            View document →
          </Link>
        </div>
      )}
    </div>
  );
}
