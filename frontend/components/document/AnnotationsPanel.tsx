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
    <aside
      className="fixed top-0 right-0 h-full w-[280px] z-40 overflow-y-auto flex flex-col"
      style={{ background: "#F5F2EC", borderLeft: "1px solid #E2DDD5" }}
    >
      <div className="px-4 py-4" style={{ borderBottom: "1px solid #E2DDD5" }}>
        <h3 className="font-mono uppercase tracking-widest" style={{ fontSize: 11, color: "#9E9890" }}>
          Your notes
        </h3>
      </div>

      {sorted.length === 0 ? (
        <div className="flex-1 flex items-start px-4 pt-6">
          <p className="font-sans text-xs leading-relaxed" style={{ color: "#9E9890", fontWeight: 300 }}>
            Select any text to add a highlight or note.
          </p>
        </div>
      ) : (
        <ul>
          {sorted.map((ann) => (
            <li
              key={ann.id}
              className="px-4 py-3 group relative"
              style={{ borderBottom: "1px solid #E2DDD5" }}
            >
              <div className="flex items-start gap-2 mb-1">
                <div
                  className="w-0.5 shrink-0 mt-0.5 self-stretch rounded"
                  style={{ backgroundColor: ANNOTATION_COLORS[ann.color] ?? "#C4855A" }}
                />
                <p className="font-sans truncate flex-1" style={{ fontSize: 11, color: "#6B655C" }}>
                  {ann.selected_text}
                </p>
              </div>
              {ann.note && (
                <p className="font-sans text-xs leading-relaxed pl-2.5" style={{ color: "#1C1814", fontWeight: 300 }}>
                  {ann.note}
                </p>
              )}
              <button
                onClick={() => onDelete(ann.id)}
                className="absolute top-3 right-3 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "#9E9890" }}
                title="Delete annotation"
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#B85C5C")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#9E9890")}
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
