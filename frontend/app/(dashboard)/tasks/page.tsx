"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { tasksApi } from "@/lib/api";
import type { ComplianceTask, TaskStats, TaskStatus, TaskPriority } from "@/lib/types";
import { TaskCard } from "@/components/tasks/TaskCard";
import { CardSkeleton } from "@/components/ui/skeleton";

type StatusFilter = "all" | "open" | "in_progress" | "complete";
type PriorityFilter = "all" | "high" | "medium" | "low";
type DueFilter = "all" | "this_week" | "this_month" | "overdue";

export default function TasksPage() {
  const { getToken } = useAuth();

  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [dueFilter, setDueFilter] = useState<DueFilter>("all");

  const [editTask, setEditTask] = useState<ComplianceTask | null>(null);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const today = new Date();

      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (priorityFilter !== "all") params.priority = priorityFilter;
      if (dueFilter === "overdue") {
        params.due_before = today.toISOString().split("T")[0];
        params.status = "open"; // overdue only applies to open/in_progress
      } else if (dueFilter === "this_week") {
        const end = new Date(today);
        end.setDate(end.getDate() + 7);
        params.due_before = end.toISOString().split("T")[0];
        params.due_after = today.toISOString().split("T")[0];
      } else if (dueFilter === "this_month") {
        const end = new Date(today);
        end.setDate(end.getDate() + 30);
        params.due_before = end.toISOString().split("T")[0];
        params.due_after = today.toISOString().split("T")[0];
      }

      const [tasksResult, statsResult] = await Promise.all([
        tasksApi.list(params, token ?? undefined),
        tasksApi.stats(token ?? undefined),
      ]);
      setTasks(tasksResult.items);
      setStats(statsResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [getToken, statusFilter, priorityFilter, dueFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      const token = await getToken();
      await tasksApi.update(id, { status }, token ?? undefined);
      // Remove dismissed tasks from list immediately; refresh stats
      if (status === "dismissed") {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      } else {
        setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
      }
      const statsResult = await tasksApi.stats(token ?? undefined);
      setStats(statsResult);
    } catch {
      // silent fail — user will see stale state but no crash
    }
  };

  return (
    <div className="max-w-[860px] mx-auto px-8 py-8">
      <div className="border-b border-border pb-5 mb-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary">
          Tasks
        </h1>
        <p className="text-sm text-text-secondary font-sans mt-1">
          Track compliance actions from regulatory changes
        </p>
      </div>

      <div className="flex gap-6">
        {/* Left column: stats + filters (340px) */}
        <aside className="w-[340px] shrink-0 space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatChip label="Open" value={stats?.open ?? 0} color="text-text-primary" />
            <StatChip label="In Progress" value={stats?.in_progress ?? 0} color="text-impact-medium" />
            <StatChip label="Complete" value={stats?.complete ?? 0} color="text-impact-low" />
            <StatChip label="Overdue" value={stats?.overdue ?? 0} color="text-impact-high" />
          </div>

          {/* Status filter */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary mb-2">
              Status
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "open", "in_progress", "complete"] as StatusFilter[]).map((s) => (
                <FilterPill
                  key={s}
                  label={s === "all" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
                  active={statusFilter === s}
                  onClick={() => setStatusFilter(s)}
                />
              ))}
            </div>
          </div>

          {/* Priority filter */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary mb-2">
              Priority
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "high", "medium", "low"] as PriorityFilter[]).map((p) => (
                <FilterPill
                  key={p}
                  label={p.charAt(0).toUpperCase() + p.slice(1)}
                  active={priorityFilter === p}
                  onClick={() => setPriorityFilter(p)}
                />
              ))}
            </div>
          </div>

          {/* Due date filter */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary mb-2">
              Due date
            </p>
            <div className="flex flex-wrap gap-1.5">
              {([
                ["all", "All"],
                ["this_week", "This week"],
                ["this_month", "This month"],
                ["overdue", "Overdue"],
              ] as [DueFilter, string][]).map(([value, label]) => (
                <FilterPill
                  key={value}
                  label={label}
                  active={dueFilter === value}
                  onClick={() => setDueFilter(value)}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Right column: task list */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : error ? (
            <p className="text-sm text-text-secondary font-sans">{error}</p>
          ) : tasks.length === 0 ? (
            <div className="border border-border rounded p-12 text-center">
              <ClipboardList className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
              <p className="font-display text-xl text-text-primary mb-2">No tasks yet</p>
              <p className="text-sm text-text-secondary font-sans max-w-sm mx-auto">
                Create one from any regulatory change in your feed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onEdit={setEditTask}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inline edit panel */}
      {editTask && (
        <EditTaskPanel
          task={editTask}
          onClose={() => setEditTask(null)}
          onSaved={() => { setEditTask(null); load(); }}
        />
      )}
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card border border-border rounded p-3">
      <p className={cn("font-mono text-2xl font-semibold", color)}>{value}</p>
      <p className="text-[11px] text-text-tertiary font-sans mt-0.5">{label}</p>
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded text-[11px] font-mono uppercase tracking-wider border transition-colors",
        active
          ? "bg-crimson/10 text-crimson border-crimson/30"
          : "text-text-tertiary border-border hover:text-text-secondary hover:border-white/20"
      )}
    >
      {label}
    </button>
  );
}

function EditTaskPanel({
  task,
  onClose,
  onSaved,
}: {
  task: ComplianceTask;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { getToken } = useAuth();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    try {
      const token = await getToken();
      await tasksApi.update(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
      }, token ?? undefined);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/40" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-full z-[100] w-[320px] bg-[#161616] border-l border-[#262626] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#262626]">
          <h2 className="font-display text-lg font-semibold text-text-primary">Edit task</h2>
          <button onClick={onClose} className="p-1.5 rounded text-text-tertiary hover:text-text-secondary hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-text-tertiary mb-1.5">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-[#111111] border border-[#262626] rounded px-3 py-2 text-sm font-sans text-text-primary focus:outline-none focus:border-crimson/50 transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-text-tertiary mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full bg-[#111111] border border-[#262626] rounded px-3 py-2 text-sm font-sans text-text-primary focus:outline-none focus:border-crimson/50 transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-text-tertiary mb-1.5">Priority</label>
            <div className="flex gap-2">
              {(["high", "medium", "low"] as TaskPriority[]).map((p) => (
                <button key={p} onClick={() => setPriority(p)} className={cn("flex-1 py-1.5 rounded border text-[11px] font-mono uppercase tracking-wider transition-colors", priority === p ? "bg-white/5 text-text-primary border-white/20" : "text-text-tertiary border-[#262626] hover:border-white/20")}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-text-tertiary mb-1.5">Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-[#111111] border border-[#262626] rounded px-3 py-2 text-sm font-mono text-text-primary focus:outline-none focus:border-crimson/50 transition-colors" />
          </div>
          {error && <p className="text-xs text-impact-high font-sans">{error}</p>}
        </div>
        <div className="px-5 py-4 border-t border-[#262626]">
          <button onClick={save} disabled={saving} className="w-full bg-crimson hover:bg-crimson/90 disabled:opacity-50 text-white rounded py-2.5 text-sm font-sans font-medium transition-colors">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </aside>
    </>
  );
}
