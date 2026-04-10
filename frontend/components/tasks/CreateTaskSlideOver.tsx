"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { tasksApi } from "@/lib/api";
import type { FeedItem, ProcessedDocument, TaskPriority } from "@/lib/types";

interface CreateTaskSlideOverProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  // Pre-population source: either a feed item or a processed doc
  feedItem?: FeedItem;
  doc?: ProcessedDocument;
}

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-2 bg-card border border-impact-low/30 text-impact-low px-4 py-3 rounded text-sm font-sans shadow-lg">
      <Check className="w-4 h-4 shrink-0" />
      {message}
    </div>
  );
}

export function CreateTaskSlideOver({
  open,
  onClose,
  onCreated,
  feedItem,
  doc,
}: CreateTaskSlideOverProps) {
  const { getToken } = useAuth();

  // Derive pre-populated values from the source
  const change = feedItem?.change;
  const processedDoc = change?.processed_document ?? doc;

  const defaultTitle = change?.headline ?? doc?.headline ?? doc?.raw_title ?? "";
  const defaultDesc = processedDoc?.recommended_actions ?? "";
  const defaultPriority: TaskPriority =
    (change?.impact_level as TaskPriority) ??
    (doc?.impact_level as TaskPriority) ??
    "medium";

  // Find comment deadline from key_dates
  const commentDeadline = processedDoc?.key_dates?.find(
    (kd) => kd.label?.toLowerCase().includes("comment")
  )?.date ?? "";

  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDesc);
  const [priority, setPriority] = useState<TaskPriority>(defaultPriority);
  const [dueDate, setDueDate] = useState(commentDeadline);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  // Reset and re-seed when the slide-over opens with new data
  useEffect(() => {
    if (open) {
      setTitle(change?.headline ?? doc?.headline ?? doc?.raw_title ?? "");
      setDescription(processedDoc?.recommended_actions ?? "");
      setPriority(
        (change?.impact_level as TaskPriority) ??
        (doc?.impact_level as TaskPriority) ??
        "medium"
      );
      const cd = processedDoc?.key_dates?.find(
        (kd) => kd.label?.toLowerCase().includes("comment")
      )?.date ?? "";
      setDueDate(cd);
      setError(null);
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      await tasksApi.create(
        {
          regulatory_change_id: change?.id ?? undefined,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          due_date: dueDate || undefined,
        },
        token ?? undefined
      );
      setToast(true);
      onCreated?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create task.");
    } finally {
      setSaving(false);
    }
  };

  const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
    { value: "high", label: "High", color: "text-impact-high border-impact-high/30" },
    { value: "medium", label: "Medium", color: "text-impact-medium border-impact-medium/30" },
    { value: "low", label: "Low", color: "text-impact-low border-impact-low/30" },
  ];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[90] bg-black/40"
          onClick={onClose}
        />
      )}

      {/* Slide-over panel */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full z-[100] w-[320px] bg-[#161616] border-l border-[#262626] flex flex-col transition-transform duration-200 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#262626]">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Create task
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-text-tertiary hover:text-text-secondary hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-text-tertiary mb-1.5">
              Title
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full bg-[#111111] border border-[#262626] rounded px-3 py-2 text-sm font-sans text-text-primary placeholder-text-tertiary focus:outline-none focus:border-crimson/50 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-text-tertiary mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What needs to be done?"
              rows={4}
              className="w-full bg-[#111111] border border-[#262626] rounded px-3 py-2 text-sm font-sans text-text-primary placeholder-text-tertiary focus:outline-none focus:border-crimson/50 transition-colors resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-text-tertiary mb-1.5">
              Priority
            </label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => setPriority(value)}
                  className={cn(
                    "flex-1 py-1.5 rounded border text-[11px] font-mono uppercase tracking-wider transition-colors",
                    priority === value
                      ? cn(color, "bg-white/5")
                      : "text-text-tertiary border-[#262626] hover:border-white/20"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-text-tertiary mb-1.5">
              Due date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-[#111111] border border-[#262626] rounded px-3 py-2 text-sm font-mono text-text-primary focus:outline-none focus:border-crimson/50 transition-colors"
            />
          </div>

          {/* Linked change */}
          {change && (
            <div className="pt-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary mb-1">
                Linked to
              </p>
              <p className="text-xs font-sans text-text-secondary line-clamp-2">
                {change.headline}
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-impact-high font-sans">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#262626]">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-crimson hover:bg-crimson/90 disabled:opacity-50 text-white rounded py-2.5 text-sm font-sans font-medium transition-colors"
          >
            {saving ? "Creating..." : "Create task"}
          </button>
        </div>
      </aside>

      {toast && (
        <Toast message="Task created" onDismiss={() => setToast(false)} />
      )}
    </>
  );
}
