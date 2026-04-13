"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnnotationColor } from "@/lib/types";

interface PendingSelection {
  selectedText: string;
  charStart: number;
  charEnd: number;
  rect: DOMRect;
}

interface AnnotationToolbarProps {
  pending: PendingSelection;
  onSave: (color: AnnotationColor, note: string) => Promise<void>;
  onDismiss: () => void;
}

const COLOR_OPTIONS: { value: AnnotationColor; bg: string; border: string }[] = [
  { value: "crimson", bg: "rgba(196,133,90,0.45)", border: "rgba(196,133,90,0.8)" },
  { value: "amber",   bg: "rgba(212,137,58,0.45)", border: "rgba(212,137,58,0.8)" },
  { value: "green",   bg: "rgba(123,158,135,0.45)", border: "rgba(123,158,135,0.8)" },
];

export function AnnotationToolbar({ pending, onSave, onDismiss }: AnnotationToolbarProps) {
  const [color, setColor] = useState<AnnotationColor>("crimson");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Position toolbar centered above the selection rectangle
  const toolbarWidth = 280;
  const toolbarHeight = 80; // approximate

  const left = Math.max(8,
    Math.min(
      pending.rect.left + pending.rect.width / 2 - toolbarWidth / 2,
      window.innerWidth - toolbarWidth - 8
    )
  );
  const top = Math.max(8, pending.rect.top - toolbarHeight - 10);

  // Dismiss on outside click, but don't dismiss on mousedown inside toolbar
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        onDismiss();
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [onDismiss]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(color, note.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={toolbarRef}
      style={{ position: "fixed", top, left, width: toolbarWidth, zIndex: 150, background: "#F5F2EC", border: "1px solid #E2DDD5", borderRadius: 5, boxShadow: "0 4px 24px rgba(28,24,20,0.12)", padding: 12 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Color + note row */}
      <div className="flex items-center gap-2 mb-2">
        {/* Color dots */}
        <div className="flex items-center gap-1.5">
          {COLOR_OPTIONS.map(({ value, bg, border }) => (
            <button
              key={value}
              onClick={() => setColor(value)}
              style={{ backgroundColor: bg, borderColor: border }}
              className={cn(
                "w-5 h-5 rounded-full border-2 transition-transform",
                color === value ? "scale-125" : "scale-100"
              )}
              title={value}
            />
          ))}
        </div>

        {/* Note input */}
        <input
          autoFocus
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onDismiss(); }}
          placeholder="Add a note..."
          className="flex-1 bg-transparent border-b text-xs font-sans focus:outline-none py-0.5 transition-colors"
          style={{ borderColor: "#D5D0C8", color: "#1C1814" }}
        />

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="p-1 rounded disabled:opacity-50 transition-colors"
          style={{ color: "#7B9E87" }}
          title="Save highlight"
        >
          <Check className="w-3.5 h-3.5" />
        </button>

        {/* Close */}
        <button
          onClick={onDismiss}
          className="p-1 rounded transition-colors"
          style={{ color: "#9E9890" }}
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Preview of selected text */}
      <p className="font-mono truncate" style={{ fontSize: 10, color: "#9E9890" }}>
        "{pending.selectedText.slice(0, 60)}{pending.selectedText.length > 60 ? "…" : ""}"
      </p>
    </div>
  );
}
