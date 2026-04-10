"use client";

import { Trash2 } from "lucide-react";
import { ANNOTATION_COLORS } from "./AnnotatableSection";
import type { DocumentAnnotation } from "@/lib/types";

interface AnnotationsPanelProps {
  annotations: DocumentAnnotation[];
  onDelete: (id: string) => void;
}

export function AnnotationsPanel({ annotations, onDelete }: AnnotationsPanelProps) {
  const sorted = [...annotations].sort((a, b) => a.char_start - b.char_start);

  return (
    <aside className="fixed top-0 right-0 h-full w-[280px] bg-doc-bg border-l border-doc-border z-40 overflow-y-auto flex flex-col">
      <div className="px-4 py-4 border-b border-doc-border">
        <h3 className="text-[11px] font-mono uppercase tracking-widest text-doc-text-secondary">
          Your notes
        </h3>
      </div>

      {sorted.length === 0 ? (
        <div className="flex-1 flex items-start px-4 pt-6">
          <p className="text-xs text-doc-text-secondary font-sans leading-relaxed">
            Select any text to add a highlight or note.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-doc-border">
          {sorted.map((ann) => (
            <li key={ann.id} className="px-4 py-3 group relative">
              {/* Color indicator + truncated text */}
              <div
                className="flex items-start gap-2 mb-1"
              >
                <div
                  className="w-0.5 shrink-0 mt-0.5 self-stretch rounded"
                  style={{ backgroundColor: ANNOTATION_COLORS[ann.color] ? `rgba(${colorRgb(ann.color)}, 0.8)` : "#555" }}
                />
                <p className="text-[11px] font-sans text-doc-text-secondary truncate flex-1">
                  {ann.selected_text}
                </p>
              </div>
              {ann.note && (
                <p className="text-xs font-sans text-doc-text leading-relaxed pl-2.5">
                  {ann.note}
                </p>
              )}
              {/* Delete button — visible on hover */}
              <button
                onClick={() => onDelete(ann.id)}
                className="absolute top-3 right-3 p-1 rounded text-[#999] hover:text-doc-accent opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete annotation"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function colorRgb(color: string): string {
  switch (color) {
    case "crimson": return "192,57,43";
    case "amber":   return "212,137,58";
    case "green":   return "90,158,111";
    default:        return "128,128,128";
  }
}
