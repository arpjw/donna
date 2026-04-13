"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { calendarApi } from "@/lib/api";
import type { CalendarEvent, CalendarEventCreateRequest, CalendarEventType } from "@/lib/types";
import Link from "next/link";

const EVENT_TYPE_CONFIG: Record<string, { bg: string; border: string; text: string; label: string }> = {
  comment_deadline: { bg: "#FAF0EC", border: "#E8C4BC", text: "#8B3A2F", label: "Comment Deadline" },
  effective_date:   { bg: "#EFF4ED", border: "#C4D8BC", text: "#3A6B3A", label: "Effective Date" },
  compliance_deadline: { bg: "#FDF4EA", border: "#E8D4BC", text: "#8B5E2F", label: "Compliance Deadline" },
  filing_deadline:  { bg: "#FDF4EA", border: "#E8D4BC", text: "#8B5E2F", label: "Filing Deadline" },
  review_date:      { bg: "#EEE9E0", border: "#D5D0C8", text: "#6B655C", label: "Review Date" },
  key_date:         { bg: "#EEE9E0", border: "#D5D0C8", text: "#6B655C", label: "Key Date" },
  custom:           { bg: "#EDF0F5", border: "#C4D0DC", text: "#4A6A8B", label: "Custom" },
  manual:           { bg: "#EDF0F5", border: "#C4D0DC", text: "#4A6A8B", label: "Manual" },
};

function groupByMonth(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const key = ev.date.slice(0, 7);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return map;
}

function formatMonthHeading(yyyyMM: string): string {
  const [year, month] = yyyyMM.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

interface AddEventFormProps {
  onSave: (data: CalendarEventCreateRequest) => Promise<void>;
  onCancel: () => void;
}

function AddEventForm({ onSave, onCancel }: AddEventFormProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<CalendarEventType>("custom");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSaving(true);
    try {
      await onSave({ title: title.trim(), date, description: description.trim() || undefined, event_type: eventType });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded p-4 mb-6"
      style={{ background: "#EEE9E0", border: "1px solid #E2DDD5" }}
    >
      <p className="font-mono uppercase tracking-widest mb-3" style={{ fontSize: 10, color: "#9E9890" }}>New Event</p>
      <div className="space-y-3">
        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          className="input-base w-full"
          required
        />
        <div className="flex gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 input-base font-mono"
            required
          />
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as CalendarEventType)}
            className="input-base font-mono"
          >
            <option value="custom">Custom</option>
            <option value="comment_deadline">Comment Deadline</option>
            <option value="effective_date">Effective Date</option>
            <option value="filing_deadline">Filing Deadline</option>
          </select>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          className="input-base w-full"
          style={{ resize: "none" }}
        />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button
          type="submit"
          disabled={saving || !title.trim() || !date}
          className="px-4 py-1.5 text-white font-mono uppercase tracking-wider rounded disabled:opacity-50 transition-colors"
          style={{ fontSize: 11, background: "#C4855A" }}
        >
          {saving ? "Saving…" : "Add event"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 font-mono uppercase tracking-wider transition-colors"
          style={{ fontSize: 11, color: "#9E9890" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function CalendarPage() {
  const { getToken } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  const loadEvents = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const data = await calendarApi.list(
        filterType !== "all" ? { event_type: filterType } : {},
        token
      );
      setEvents(data);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [getToken, filterType]);

  useEffect(() => { setLoading(true); loadEvents(); }, [loadEvents]);

  const handleAdd = async (data: CalendarEventCreateRequest) => {
    const token = await getToken();
    if (!token) return;
    const created = await calendarApi.create(data, token);
    setEvents((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
    setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    const token = await getToken();
    if (!token) return;
    try {
      await calendarApi.delete(id, token);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // silent
    }
  };

  const grouped = groupByMonth(events);
  const months = Array.from(grouped.keys()).sort();
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => e.date >= today).length;
  const past = events.length - upcoming;

  const filterTabs = [
    { key: "all", label: "All" },
    { key: "comment_deadline", label: "Comment" },
    { key: "effective_date", label: "Effective" },
    { key: "filing_deadline", label: "Filing" },
    { key: "custom", label: "Custom" },
  ];

  return (
    <div className="max-w-[860px] mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display" style={{ fontSize: 26, color: "#1C1814" }}>
            Compliance Calendar
          </h1>
          <p className="font-sans text-sm mt-1" style={{ color: "#6B655C", fontWeight: 300 }}>
            Key dates from your regulatory feed, plus manual reminders.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-white rounded transition-colors"
          style={{ fontSize: 11, padding: "6px 14px", background: "#C4855A", fontFamily: "var(--font-dm-mono)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#B5764B")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#C4855A")}
        >
          <Plus className="w-3.5 h-3.5" />
          Add event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded p-4" style={{ background: "#EEE9E0", border: "1px solid #E2DDD5" }}>
          <p className="font-mono uppercase tracking-widest mb-1" style={{ fontSize: 10, color: "#9E9890" }}>Upcoming</p>
          <p className="font-mono text-2xl" style={{ color: "#1C1814" }}>{upcoming}</p>
        </div>
        <div className="rounded p-4" style={{ background: "#EEE9E0", border: "1px solid #E2DDD5" }}>
          <p className="font-mono uppercase tracking-widest mb-1" style={{ fontSize: 10, color: "#9E9890" }}>Past / Total</p>
          <p className="font-mono text-2xl" style={{ color: "#1C1814" }}>
            {past}{" "}
            <span style={{ color: "#B5AFA5", fontSize: 18 }}>/ {events.length}</span>
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 mb-6">
        {filterTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterType(key)}
            className="rounded font-mono uppercase tracking-wider transition-colors"
            style={{
              fontSize: 10,
              padding: "4px 10px",
              ...(filterType === key
                ? { background: "#1C1814", color: "#F5F2EC", border: "1px solid #1C1814" }
                : { color: "#9E9890", border: "1px solid #E2DDD5" }),
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Add event form */}
      {showAdd && <AddEventForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />}

      {/* Content */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i}>
              <div className="w-32 h-4 skeleton rounded mb-3" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-14 skeleton rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="font-display text-xl mb-2" style={{ color: "#1C1814" }}>
            No upcoming regulatory dates.
          </p>
          <p className="font-sans text-sm max-w-sm mx-auto" style={{ color: "#6B655C", fontWeight: 300 }}>
            Donna will automatically populate this calendar as new documents are processed.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {months.map((month) => {
            const monthEvents = grouped.get(month)!;
            return (
              <section key={month}>
                <h2
                  className="font-mono uppercase tracking-widest mb-3 pb-2"
                  style={{ fontSize: 11, color: "#9E9890", borderBottom: "1px solid #E2DDD5" }}
                >
                  {formatMonthHeading(month)}
                </h2>
                <div className="space-y-2">
                  {monthEvents.map((ev) => {
                    const isPast = ev.date < today;
                    const isToday = ev.date === today;
                    const cfg = EVENT_TYPE_CONFIG[ev.event_type] ?? EVENT_TYPE_CONFIG.key_date;

                    return (
                      <div
                        key={ev.id}
                        className="flex items-start gap-4 p-3 rounded transition-colors group"
                        style={{
                          border: isToday
                            ? "1px solid rgba(196,133,90,0.40)"
                            : isPast
                            ? "1px solid #E2DDD5"
                            : "1px solid #E2DDD5",
                          background: isToday ? "rgba(196,133,90,0.04)" : "#F5F2EC",
                          opacity: isPast && !isToday ? 0.6 : 1,
                        }}
                      >
                        {/* Date column */}
                        <div className="shrink-0 w-16 text-center">
                          <p className="font-mono text-xs" style={{ color: isToday ? "#C4855A" : "#9E9890" }}>
                            {new Date(ev.date + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}
                          </p>
                          <p
                            className="font-mono text-xl font-semibold leading-tight"
                            style={{ color: isToday ? "#C4855A" : "#1C1814" }}
                          >
                            {ev.date.slice(8)}
                          </p>
                          <p className="font-mono" style={{ fontSize: 10, color: isToday ? "#C4855A" : "#B5AFA5" }}>
                            {isToday ? "TODAY" : new Date(ev.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                          </p>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className="font-mono uppercase tracking-wider rounded"
                              style={{
                                fontSize: 9,
                                padding: "2px 6px",
                                background: cfg.bg,
                                border: `1px solid ${cfg.border}`,
                                color: cfg.text,
                              }}
                            >
                              {cfg.label}
                            </span>
                            {ev.is_user_created && (
                              <span className="font-mono" style={{ fontSize: 9, color: "#B5AFA5" }}>Custom</span>
                            )}
                          </div>
                          <p className="font-sans text-sm leading-snug truncate" style={{ color: "#1C1814" }}>
                            {ev.title}
                          </p>
                          {ev.description && (
                            <p className="font-sans text-xs mt-0.5 line-clamp-2" style={{ color: "#6B655C", fontWeight: 300 }}>
                              {ev.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {ev.regulatory_change_id && ev.change?.processed_document_id && (
                            <Link
                              href={`/document/${ev.change.processed_document_id}`}
                              className="p-1.5 rounded transition-colors"
                              style={{ color: "#9E9890" }}
                              title="View document"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          {ev.is_user_created && (
                            <button
                              onClick={() => handleDelete(ev.id)}
                              className="p-1.5 rounded transition-colors"
                              style={{ color: "#9E9890" }}
                              title="Delete event"
                              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#B85C5C")}
                              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#9E9890")}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
