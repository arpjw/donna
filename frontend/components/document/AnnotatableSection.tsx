"use client";

import { useRef } from "react";
import type { DocumentAnnotation } from "@/lib/types";

export const ANNOTATION_COLORS: Record<string, string> = {
  crimson: "rgba(196, 133, 90, 0.25)",
  amber: "rgba(212, 137, 58, 0.25)",
  green: "rgba(123, 158, 135, 0.25)",
};

interface SelectionInfo {
  selectedText: string;
  charStart: number;
  charEnd: number;
  rect: DOMRect;
}

interface AnnotatableSectionProps {
  text: string;
  /** Where this section's text begins in the combined document text. */
  globalOffset: number;
  annotations: DocumentAnnotation[];
  className?: string;
  style?: React.CSSProperties;
  onSelectionReady: (info: SelectionInfo) => void;
}

/** Walk text nodes in a DOM tree to convert a node+offset pair into a character offset. */
function getCharOffset(container: Element, targetNode: Node, targetOffset: number): number {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let total = 0;
  let node = walker.nextNode();
  while (node) {
    if (node === targetNode) return total + targetOffset;
    total += node.textContent?.length ?? 0;
    node = walker.nextNode();
  }
  return total + targetOffset;
}

type Segment = { text: string; annotation: DocumentAnnotation | null };

/** Split section text into plain/highlighted segments. */
function buildSegments(
  text: string,
  annotations: DocumentAnnotation[],
  globalOffset: number
): Segment[] {
  const local = annotations
    .map((a) => ({
      ...a,
      start: a.char_start - globalOffset,
      end: a.char_end - globalOffset,
    }))
    .filter((a) => a.end > 0 && a.start < text.length)
    .map((a) => ({ ...a, start: Math.max(0, a.start), end: Math.min(text.length, a.end) }))
    .sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let pos = 0;
  for (const ann of local) {
    if (ann.start > pos) {
      segments.push({ text: text.slice(pos, ann.start), annotation: null });
    }
    if (ann.end > ann.start) {
      segments.push({ text: text.slice(ann.start, ann.end), annotation: ann });
    }
    pos = ann.end;
  }
  if (pos < text.length) {
    segments.push({ text: text.slice(pos), annotation: null });
  }
  return segments.length > 0 ? segments : [{ text, annotation: null }];
}

export function AnnotatableSection({
  text,
  globalOffset,
  annotations,
  className,
  style,
  onSelectionReady,
}: AnnotatableSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !containerRef.current) return;
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    const startOff = getCharOffset(containerRef.current, range.startContainer, range.startOffset);
    const endOff = getCharOffset(containerRef.current, range.endContainer, range.endOffset);

    const rect = range.getBoundingClientRect();
    onSelectionReady({
      selectedText,
      charStart: globalOffset + Math.min(startOff, endOff),
      charEnd: globalOffset + Math.max(startOff, endOff),
      rect,
    });
  };

  const segments = buildSegments(text, annotations, globalOffset);

  return (
    <div ref={containerRef} onMouseUp={handleMouseUp} className={className} style={style}>
      {segments.map((seg, i) =>
        seg.annotation ? (
          <mark
            key={i}
            style={{ backgroundColor: ANNOTATION_COLORS[seg.annotation.color] ?? ANNOTATION_COLORS.crimson }}
            title={seg.annotation.note ?? undefined}
            className="rounded-sm cursor-default"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </div>
  );
}
