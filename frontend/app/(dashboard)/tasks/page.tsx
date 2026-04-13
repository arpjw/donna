"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { ClipboardList, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { tasksApi } from "@/lib/api";
import type { ComplianceTask, TaskStats, TaskStatus, TaskPriority } from "@/lib/types";
import { TaskCard } from "@/components/tasks/TaskCard";
import { useTaskStats } from "@/lib/task-stats-context";

type StatusFilter = "all" | "open" | "in_progress" | "complete";
type PriorityFilter = "all" | "high" | "medium" | "low";
type DueFilter = "all" | "this_week" | "this_month" | "overdue";

export default function TasksPage() {
  const { getToken } = useAuth();
  const { triggerRefresh } = useTaskStats();

  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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
        params.status = "open";
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
      if (status === "dismissed") {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      } else {
        setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
      }
      const statsResult = await tasksApi.stats(token ?? undefined);
      setStats(statsResult);
      triggerRefresh();
    } catch {
      // silent fail
    }
  };

  const filterPanel = (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {loading ? (
          <>
            {[1,2,3,4].map((i) => (
              <div key={i} className="rounded p-3 skeleton" style={{ height: 64 }} />
            ))}
          </>
        ) : (
          <>
            <StatChip label="Open" value={stats?.open ?? 0} color="#1C1814" />
            <StatChip label="In Progress" value={stats?.in_progress ?? 0} color="#D4893A" />
            <StatChip label="Complete" value={stats?.complete ?? 0} color="#7B9E87" />
            <StatChip label="Overdue" value={stats?.overdue ?? 0} color="#B85C5C" />
          </>
        )}
      </div>

      {/* Status filter */}
      <div>
        <p className="font-mono uppercase tracking-widest mb-2" style={{ fontSize: 10, color: "#9E9890" }}>
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
        <p className="font-mono uppercase tracking-widest mb-2" style={{ fontSize: 10, color: "#9E9890" }}>
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
        <p className="font-mono uppercase tracking-widest mb-2" style={{ fontSize: 10, color: "#9E9890" }}>
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
    </div>
  );

  return (
    <div className="max-w-[860px] mx-auto px-4 sm:px-8 py-8">
      <div className="pb-5 mb-8" style={{ borderBottom: "1px solid #E2DDD5" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display" style={{ fontSize: 26, color: "#1C1814" }}>
              Tasks
            </h1>
            <p className="font-sans text-sm mt-1" style={{ color: "#6B655C", fontWeight: 300 }}>
              Track compliance actions from regulatory changes
            </p>
          </div>
          <button
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded font-mono transition-colors"
            style={{ fontSize: 11, border: "1px solid #E2DDD5", color: "#6B655C" }}
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left column — desktop */}
        <aside className="hidden md:block w-[340px] shrink-0">
          {filterPanel}
        </aside>

        {/* Right column: task list */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => (
                <div key={i} className="rounded p-6 space-y-3 skeleton" style={{ height: 120 }} />
              ))}
            </div>
          ) : error ? (
            <p className="font-sans text-sm" style={{ color: "#6B655C" }}>{error}</p>
          ) : tasks.length === 0 ? (
            <div
              className="rounded p-12 text-center"
              style={{ border: "1px solid #E2DDD5", background: "#F5F2EC" }}
            >
              <ClipboardList className="w-8 h-8 mx-auto mb-3" style={{ color: "#D5D0C8" }} />
              <p className="font-display text-xl mb-2" style={{ color: "#1C1814" }}>No tasks yet.</p>
              <p className="font-sans text-sm max-w-sm mx-auto" style={{ color: "#6B655C", fontWeight: 300 }}>
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

      {/* Mobile filters */}
      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-lg px-5 py-5 md:hidden max-h-[80vh] overflow-y-auto"
            style={{ background: "#F5F2EC", borderTop: "1px solid #E2DDD5" }}
          >
            <div className="flex items-center justify-between mb-5">
              <p className="font-mono uppercase tracking-widest" style={{ fontSize: 10, color: "#9E9890" }}>
                Filters
              </p>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1.5 rounded transition-colors"
                style={{ color: "#9E9890" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {filterPanel}
            <div className="mt-6">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full text-white rounded py-2.5 font-sans font-medium text-sm transition-colors"
                style={{ background: "#C4855A" }}
              >
                Apply filters
              </button>
            </div>
          </div>
        </>
      )}

      {editTask && (
        <EditTaskPanel
          task={editTask}
          onClose={() => setEditTask(null)}
          onSaved={() => { setEditTask(null); load(); triggerRefresh(); }}
        />
      )}
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded p-3"
      style={{ background: "#EEE9E0", border: "1px solid #E2DDD5" }}
    >
      <p className="font-mono text-2xl font-semibold" style={{ color }}>{value}</p>
      <p className="font-sans mt-0.5" style={{ fontSize: 11, color: "#9E9890" }}>{label}</p>
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded font-mono uppercase tracking-wider transition-colors"
      style={{
        fontSize: 11,
        padding: "4px 10px",
        ...(active
          ? { background: "#1C1814", color: "#F5F2EC", border: "1px solid #1C1814" }
          : { color: "#9E9890", border: "1px solid #E2DDD5" }),
      }}
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
      <div className="fixed inset-0 z-[90] bg-black/30" onClick={onClose} />
      <aside
        className="fixed top-0 right-0 h-full z-[100] w-full sm:w-[320px] flex flex-col"
        style={{ background: "#1C1814", borderLeft: "1px solid #2A2420" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid #2A2420" }}
        >
          <h2 className="font-display text-lg" style={{ color: "#D4CFC7" }}>Edit task</h2>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: "#4A453F" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <div>
            <label className="block font-mono uppercase tracking-widest mb-1.5" style={{ fontSize: 10, color: "#4A453F" }}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-dark" />
          </div>
          <div>
            <label className="block font-mono uppercase tracking-widest mb-1.5" style={{ fontSize: 10, color: "#4A453F" }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="input-dark" style={{ resize: "none" }} />
          </div>
          <div>
            <label className="block font-mono uppercase tracking-widest mb-1.5" style={{ fontSize: 10, color: "#4A453F" }}>Priority</label>
            <div className="flex gap-2">
              {(["high", "medium", "low"] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className="flex-1 py-1.5 rounded font-mono uppercase tracking-wider"
                  style={{
                    fontSize: 11,
                    ...(priority === p
                      ? { background: "rgba(255,255,255,0.05)", color: "#D4CFC7", border: "1px solid rgba(255,255,255,0.15)" }
                      : { color: "#4A453F", border: "1px solid #2A2420" }),
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-mono uppercase tracking-widest mb-1.5" style={{ fontSize: 10, color: "#4A453F" }}>Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-dark font-mono" />
          </div>
          {error && <p className="font-sans text-xs" style={{ color: "#B85C5C" }}>{error}</p>}
        </div>
        <div className="px-5 py-4" style={{ borderTop: "1px solid #2A2420" }}>
          <button
            onClick={save}
            disabled={saving}
            className="w-full text-white rounded py-2.5 font-sans font-medium text-sm disabled:opacity-50"
            style={{ background: "#C4855A" }}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </aside>
    </>
  );
}
