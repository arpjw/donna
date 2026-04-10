"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Calendar, Plus, Trash2, ExternalLink } from "lucide-react";
import { calendarApi } from "@/lib/api";
import type { CalendarEvent, CalendarEventCreateRequest } from "@/lib/types";
import Link from "next/link";

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  comment_deadline: { bg: "bg-[rgba(192,57,43,0.15)]", text: "text-[#C0392B]", label: "Comment Deadline" },
  effective_date:   { bg: "bg-[rgba(90,158,111,0.15)]", text: "text-[#5A9E6F]", label: "Effective Date" },
  compliance_deadline: { bg: "bg-[rgba(212,137,58,0.15)]", text: "text-[#D4893A]", label: "Compliance Deadline" },
  key_date:         { bg: "bg-[rgba(115,115,115,0.15)]", text: "text-[#737373]", label: "Key Date" },
  manual:           { bg: "bg-[rgba(192,57,43,0.10)]", text: "text-[#F0EEE9]", label: "Manual" },
};

function groupByMonth(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const key = ev.date.slice(0, 7); // YYYY-MM
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return map;
}

function formatMonthHeading(yyyyMM: string): string {
  const [year, month] = yyyyMM.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatEventDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

interface AddEventFormProps {
  onSave: (data: CalendarEventCreateRequest) => Promise<void>;
  onCancel: () => void;
}

function AddEventForm({ onSave, onCancel }: AddEventFormProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<"manual" | "key_date">("manual");
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
    <form onSubmit={handleSubmit} className="bg-[#161616] border border-[#262626] rounded p-4 mb-6">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#737373] mb-3">New Event</p>
      <div className="space-y-3">
        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          className="w-full bg-[#111111] border border-[#262626] rounded px-3 py-2 text-sm text-[#F0EEE9] placeholder-[#404040] focus:outline-none focus:border-[#444] font-sans"
          required
        />
        <div className="flex gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 bg-[#111111] border border-[#262626] rounded px-3 py-2 text-sm text-[#F0EEE9] focus:outline-none focus:border-[#444] font-mono"
            required
          />
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as "manual" | "key_date")}
            className="bg-[#111111] border border-[#262626] rounded px-3 py-2 text-sm text-[#737373] focus:outline-none focus:border-[#444] font-mono"
          >
            <option value="manual">Manual</option>
            <option value="key_date">Key Date</option>
            <option value="compliance_deadline">Compliance Deadline</option>
          </select>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          className="w-full bg-[#111111] border border-[#262626] rounded px-3 py-2 text-sm text-[#737373] placeholder-[#404040] focus:outline-none focus:border-[#444] font-sans resize-none"
        />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button
          type="submit"
          disabled={saving || !title.trim() || !date}
          className="px-4 py-1.5 bg-[#C0392B] text-[#F0EEE9] text-[11px] font-mono uppercase tracking-wider rounded hover:bg-[#A93226] disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Add event"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 text-[#737373] text-[11px] font-mono uppercase tracking-wider hover:text-[#F0EEE9] transition-colors"
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

  const upcoming = events.filter((e) => e.date >= new Date().toISOString().slice(0, 10)).length;
  const past = events.length - upcoming;

  return (
    <div className="max-w-[860px] mx-auto px-12 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-[#737373]" />
            <h1 className="font-display text-2xl font-semibold text-[#F0EEE9]">
              Compliance Calendar
            </h1>
          </div>
          <p className="text-xs text-[#737373] font-sans">
            Key dates from your regulatory feed, plus manual reminders.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C0392B] text-[#F0EEE9] text-[11px] font-mono uppercase tracking-wider rounded hover:bg-[#A93226] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#161616] border border-[#262626] rounded p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#737373] mb-1">Upcoming</p>
          <p className="font-mono text-2xl text-[#F0EEE9]">{upcoming}</p>
        </div>
        <div className="bg-[#161616] border border-[#262626] rounded p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#737373] mb-1">Past / Total</p>
          <p className="font-mono text-2xl text-[#F0EEE9]">{past} <span className="text-[#404040] text-lg">/ {events.length}</span></p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6">
        {[
          { key: "all", label: "All" },
          { key: "comment_deadline", label: "Comment Deadlines" },
          { key: "effective_date", label: "Effective Dates" },
          { key: "compliance_deadline", label: "Compliance" },
          { key: "manual", label: "Manual" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterType(key)}
            className={`px-3 py-1 rounded text-[11px] font-mono uppercase tracking-wider transition-colors ${
              filterType === key
                ? "bg-[#C0392B] text-[#F0EEE9]"
                : "text-[#737373] hover:text-[#F0EEE9] border border-[#262626]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Add event form */}
      {showAdd && (
        <AddEventForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i}>
              <div className="w-32 h-4 bg-[#1E1E1E] rounded mb-3 animate-pulse" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-14 bg-[#161616] rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calendar className="w-10 h-10 text-[#262626] mb-4" />
          <p className="text-[#737373] font-sans text-sm mb-1">No calendar events yet</p>
          <p className="text-[#404040] font-sans text-xs">
            Key dates from your regulatory feed will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {months.map((month) => {
            const monthEvents = grouped.get(month)!;
            const today = new Date().toISOString().slice(0, 10);
            return (
              <section key={month}>
                <h2 className="font-mono text-[11px] uppercase tracking-widest text-[#737373] mb-3 pb-2 border-b border-[#1A1A1A]">
                  {formatMonthHeading(month)}
                </h2>
                <div className="space-y-2">
                  {monthEvents.map((ev) => {
                    const isPast = ev.date < today;
                    const isToday = ev.date === today;
                    const typeStyle = EVENT_TYPE_COLORS[ev.event_type] ?? EVENT_TYPE_COLORS.key_date;

                    return (
                      <div
                        key={ev.id}
                        className={`flex items-start gap-4 p-3 rounded border transition-colors group ${
                          isToday
                            ? "border-[#C0392B]/40 bg-[rgba(192,57,43,0.05)]"
                            : isPast
                            ? "border-[#1A1A1A] opacity-60"
                            : "border-[#262626] hover:border-[#333]"
                        }`}
                      >
                        {/* Date column */}
                        <div className="shrink-0 w-16 text-center">
                          <p className={`font-mono text-xs ${isToday ? "text-[#C0392B]" : "text-[#737373]"}`}>
                            {new Date(ev.date + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}
                          </p>
                          <p className={`font-mono text-xl font-semibold leading-tight ${isToday ? "text-[#C0392B]" : "text-[#F0EEE9]"}`}>
                            {ev.date.slice(8)}
                          </p>
                          <p className={`font-mono text-[10px] ${isToday ? "text-[#C0392B]" : "text-[#404040]"}`}>
                            {isToday ? "TODAY" : new Date(ev.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                          </p>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${typeStyle.bg} ${typeStyle.text}`}>
                              {typeStyle.label}
                            </span>
                            {ev.is_user_created && (
                              <span className="text-[10px] font-mono text-[#404040]">Manual</span>
                            )}
                          </div>
                          <p className="text-sm font-sans text-[#F0EEE9] leading-snug truncate">
                            {ev.title}
                          </p>
                          {ev.description && (
                            <p className="text-xs font-sans text-[#737373] mt-0.5 line-clamp-2">
                              {ev.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {ev.regulatory_change_id && ev.change?.processed_document_id && (
                            <Link
                              href={`/document/${ev.change.processed_document_id}`}
                              className="p-1.5 rounded hover:bg-[#262626] text-[#737373] hover:text-[#F0EEE9] transition-colors"
                              title="View document"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          {ev.is_user_created && (
                            <button
                              onClick={() => handleDelete(ev.id)}
                              className="p-1.5 rounded hover:bg-[#262626] text-[#737373] hover:text-[#C0392B] transition-colors"
                              title="Delete event"
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
