"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { tasksApi } from "@/lib/api";
import type { FeedItem, ProcessedDocument, TaskPriority } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useTaskStats } from "@/lib/task-stats-context";

interface CreateTaskSlideOverProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  feedItem?: FeedItem;
  doc?: ProcessedDocument;
}

export function CreateTaskSlideOver({
  open,
  onClose,
  onCreated,
  feedItem,
  doc,
}: CreateTaskSlideOverProps) {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const { triggerRefresh } = useTaskStats();

  const change = feedItem?.change;
  const processedDoc = change?.processed_document ?? doc;

  const defaultTitle = change?.headline ?? doc?.headline ?? doc?.raw_title ?? "";
  const defaultDesc = processedDoc?.recommended_actions ?? "";
  const defaultPriority: TaskPriority =
    (change?.impact_level as TaskPriority) ??
    (doc?.impact_level as TaskPriority) ??
    "medium";

  const commentDeadline = processedDoc?.key_dates?.find(
    (kd) => kd.label?.toLowerCase().includes("comment")
  )?.date ?? "";

  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDesc);
  const [priority, setPriority] = useState<TaskPriority>(defaultPriority);
  const [dueDate, setDueDate] = useState(commentDeadline);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);

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
      toast("Task created");
      triggerRefresh();
      onCreated?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create task.");
    } finally {
      setSaving(false);
    }
  };

  const PRIORITY_OPTIONS: { value: TaskPriority; label: string; activeStyle: React.CSSProperties }[] = [
    { value: "high", label: "High", activeStyle: { background: "rgba(184,92,92,0.10)", border: "1px solid rgba(184,92,92,0.30)", color: "#B85C5C" } },
    { value: "medium", label: "Medium", activeStyle: { background: "rgba(212,137,58,0.10)", border: "1px solid rgba(212,137,58,0.30)", color: "#D4893A" } },
    { value: "low", label: "Low", activeStyle: { background: "rgba(123,158,135,0.10)", border: "1px solid rgba(123,158,135,0.30)", color: "#7B9E87" } },
  ];

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[90] bg-black/30" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed top-0 right-0 h-full z-[100] w-full sm:w-[320px] flex flex-col transition-transform duration-200 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        style={{ background: "#1C1814", borderLeft: "1px solid #2A2420" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid #2A2420" }}
        >
          <h2 className="font-display text-lg" style={{ color: "#D4CFC7" }}>
            Create task
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded transition-colors"
            style={{ color: "#4A453F" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#8A837A")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#4A453F")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div>
            <label className="block font-mono uppercase tracking-widest mb-1.5" style={{ fontSize: 10, color: "#4A453F" }}>
              Title
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="input-dark"
            />
          </div>

          <div>
            <label className="block font-mono uppercase tracking-widest mb-1.5" style={{ fontSize: 10, color: "#4A453F" }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What needs to be done?"
              rows={4}
              className="input-dark"
              style={{ resize: "none" }}
            />
          </div>

          <div>
            <label className="block font-mono uppercase tracking-widest mb-1.5" style={{ fontSize: 10, color: "#4A453F" }}>
              Priority
            </label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map(({ value, label, activeStyle }) => (
                <button
                  key={value}
                  onClick={() => setPriority(value)}
                  className="flex-1 py-1.5 rounded font-mono uppercase tracking-wider transition-colors"
                  style={{
                    fontSize: 11,
                    ...(priority === value
                      ? activeStyle
                      : { color: "#4A453F", border: "1px solid #2A2420" }),
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-mono uppercase tracking-widest mb-1.5" style={{ fontSize: 10, color: "#4A453F" }}>
              Due date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input-dark font-mono"
            />
          </div>

          {change && (
            <div className="pt-1">
              <p className="font-mono uppercase tracking-widest mb-1" style={{ fontSize: 10, color: "#4A453F" }}>
                Linked to
              </p>
              <p className="font-sans text-xs line-clamp-2" style={{ color: "#8A837A" }}>
                {change.headline}
              </p>
            </div>
          )}

          {error && (
            <p className="font-sans text-xs" style={{ color: "#B85C5C" }}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4"
          style={{ borderTop: "1px solid #2A2420" }}
        >
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full rounded py-2.5 font-sans font-medium text-sm text-white transition-colors disabled:opacity-50"
            style={{ background: "#C4855A" }}
            onMouseEnter={(e) => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = "#B5764B"; }}
            onMouseLeave={(e) => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = "#C4855A"; }}
          >
            {saving ? "Creating..." : "Create task"}
          </button>
        </div>
      </aside>
    </>
  );
}
