"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { ImpactBadge, ChangeTypeBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type {
  ProcessedDocument,
  RegulatoryChange,
  RegulatorySource,
  SearchResult,
  DocumentAnnotation,
  AnnotationColor,
} from "@/lib/types";
import { ExternalLink, Calendar, Tag, AlertCircle, ClipboardList, StickyNote } from "lucide-react";
import Link from "next/link";
import { CreateTaskSlideOver } from "@/components/tasks/CreateTaskSlideOver";
import { AnnotatableSection } from "./AnnotatableSection";
import { AnnotationToolbar } from "./AnnotationToolbar";
import { AnnotationsPanel } from "./AnnotationsPanel";
import { annotationsApi } from "@/lib/api";

interface DocumentViewProps {
  doc: ProcessedDocument;
  change?: RegulatoryChange | null;
  related?: SearchResult[];
}

interface PendingSelection {
  selectedText: string;
  charStart: number;
  charEnd: number;
  rect: DOMRect;
}

export function DocumentView({ doc, change, related }: DocumentViewProps) {
  const { getToken } = useAuth();
  const [taskSlideOver, setTaskSlideOver] = useState(false);
  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>([]);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [panelOpen, setPanelOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`notes-panel-${doc.id}`) === "true";
    }
    return false;
  });

  const headline = doc.headline ?? change?.headline ?? doc.raw_title ?? "Untitled Document";
  const impactLevel = (doc.impact_level ?? change?.impact_level) as "high" | "medium" | "low" | undefined;
  const changeType = doc.change_type ?? change?.change_type ?? doc.document_type;
  const source = doc.source ?? change?.source;
  const documentUrl = doc.raw_document_url ?? change?.processed_document?.raw_document_url;
  const publishedAt = doc.published_at ?? change?.processed_document?.published_at;

  // Offsets for the combined text: plain_summary + "\n\n" + detailed_summary
  const plainOffset = 0;
  const detailedBaseOffset = doc.plain_summary.length + 2;

  const togglePanel = () => {
    const next = !panelOpen;
    setPanelOpen(next);
    localStorage.setItem(`notes-panel-${doc.id}`, String(next));
  };

  // Load annotations
  const loadAnnotations = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await annotationsApi.list(doc.id, token);
      setAnnotations(data);
    } catch {
      // non-fatal — document still readable without annotations
    }
  }, [getToken, doc.id]);

  useEffect(() => { loadAnnotations(); }, [loadAnnotations]);

  const handleSaveAnnotation = async (color: AnnotationColor, note: string) => {
    if (!pending) return;
    try {
      const token = await getToken();
      if (!token) return;
      const created = await annotationsApi.create({
        processed_document_id: doc.id,
        selected_text: pending.selectedText,
        note: note || undefined,
        color,
        char_start: pending.charStart,
        char_end: pending.charEnd,
      }, token);
      setAnnotations((prev) => [...prev, created]);
      window.getSelection()?.removeAllRanges();
    } finally {
      setPending(null);
    }
  };

  const handleDeleteAnnotation = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      await annotationsApi.delete(id, token);
      setAnnotations((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // silent
    }
  };

  // Build paragraph offsets for detailed_summary
  const detailedParagraphs = doc.detailed_summary
    ? doc.detailed_summary.split("\n\n")
    : [];
  const paraOffsets: number[] = [];
  let acc = detailedBaseOffset;
  for (const para of detailedParagraphs) {
    paraOffsets.push(acc);
    acc += para.length + 2; // +2 for the "\n\n" separator
  }

  return (
    <div className="min-h-screen bg-doc-bg text-doc-text transition-colors">
      {/* Right-margin buffer when panel is open */}
      <div className={panelOpen ? "pr-[280px]" : ""}>
        <div className="max-w-[720px] mx-auto px-4 py-6 sm:px-14 sm:py-12">
          {/* Back link */}
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 text-xs text-doc-text-secondary hover:text-doc-text transition-colors mb-10 font-mono uppercase tracking-wider"
          >
            ← Back to feed
          </Link>

          {/* Header */}
          <header className="mb-10">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                {impactLevel && <ImpactBadge level={impactLevel} />}
                {changeType && <ChangeTypeBadge type={changeType} />}
                {source && (
                  <span className="text-[11px] text-doc-text-secondary font-mono uppercase tracking-wider">
                    {source.name}
                  </span>
                )}
              </div>
              {/* Notes toggle */}
              <button
                onClick={togglePanel}
                className={`flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider shrink-0 px-2.5 py-1 rounded border transition-colors ${
                  panelOpen
                    ? "bg-doc-accent/10 text-doc-accent border-doc-accent/30"
                    : "text-doc-text-secondary border-doc-border hover:text-doc-text hover:border-doc-text-secondary"
                }`}
              >
                <StickyNote className="w-3.5 h-3.5" />
                Notes {annotations.length > 0 ? `(${annotations.length})` : ""}
              </button>
            </div>

            <h1 className="font-display text-[32px] font-semibold text-doc-text leading-tight mb-4">
              {headline}
            </h1>

            <div className="flex items-center gap-6 text-xs text-doc-text-secondary font-mono">
              {publishedAt && (
                <span>Published {formatDate(publishedAt)}</span>
              )}
              {documentUrl && (
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-doc-accent hover:underline"
                >
                  View source <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </header>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 mb-10 p-5 bg-doc-bg border border-doc-border rounded">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-doc-text-secondary mb-1">
                Significance
              </p>
              <p className="font-mono text-lg text-doc-text">
                {doc.significance_score != null
                  ? (doc.significance_score * 100).toFixed(0) + "%"
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-doc-text-secondary mb-1">
                Industries
              </p>
              <p className="text-sm text-doc-text font-sans">
                {doc.affected_industries?.length
                  ? doc.affected_industries.slice(0, 3).join(", ")
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-doc-text-secondary mb-1">
                Jurisdictions
              </p>
              <p className="text-sm text-doc-text font-sans">
                {doc.affected_jurisdictions?.length
                  ? doc.affected_jurisdictions.slice(0, 3).join(", ")
                  : "—"}
              </p>
            </div>
          </div>

          {/* Plain summary — annotatable */}
          <section className="mb-10">
            <p className="text-[10px] font-mono uppercase tracking-widest text-doc-text-secondary mb-3">
              In plain language
            </p>
            <AnnotatableSection
              text={doc.plain_summary}
              globalOffset={plainOffset}
              annotations={annotations}
              onSelectionReady={setPending}
              className="text-xl font-sans text-doc-text leading-relaxed border-l-2 border-doc-accent pl-4"
            />
          </section>

          <hr className="border-doc-border mb-10" />

          {/* Detailed summary — annotatable, paragraph by paragraph */}
          {doc.detailed_summary && (
            <section className="mb-10">
              <h2 className="font-display text-xl font-semibold text-doc-text mb-4">
                Detailed Analysis
              </h2>
              <div className="space-y-4">
                {detailedParagraphs.map((para, i) => (
                  <AnnotatableSection
                    key={i}
                    text={para}
                    globalOffset={paraOffsets[i]}
                    annotations={annotations}
                    onSelectionReady={setPending}
                    className="text-sm text-doc-text-secondary font-sans leading-relaxed"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Recommended actions */}
          {doc.recommended_actions && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-doc-accent" />
                  <h2 className="font-display text-xl font-semibold text-doc-text">
                    What to do
                  </h2>
                </div>
                <button
                  onClick={() => setTaskSlideOver(true)}
                  className="flex items-center gap-1.5 text-[11px] text-doc-text-secondary hover:text-doc-accent font-sans transition-colors"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  Create task
                </button>
              </div>
              <div className="p-5 bg-doc-accent/5 border border-doc-accent/20 rounded">
                <p className="text-sm font-sans text-doc-text leading-relaxed">
                  {doc.recommended_actions}
                </p>
              </div>
            </section>
          )}

          {/* Key dates */}
          {doc.key_dates && doc.key_dates.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-doc-text-secondary" />
                <h2 className="font-display text-xl font-semibold text-doc-text">
                  Key Dates
                </h2>
              </div>
              <div className="space-y-2">
                {doc.key_dates.map((kd, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5 border-b border-doc-border last:border-0"
                  >
                    <span className="text-sm text-doc-text-secondary font-sans">
                      {kd.label}
                    </span>
                    <span className="font-mono text-sm text-doc-text">{kd.date}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Taxonomy tags */}
          {doc.taxonomy_tags && doc.taxonomy_tags.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-doc-text-secondary" />
                <h2 className="font-display text-xl font-semibold text-doc-text">
                  Tags
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {doc.taxonomy_tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-mono uppercase tracking-wider px-2 py-1 bg-doc-border rounded text-doc-text-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Significance reasoning */}
          {doc.significance_reasoning && (
            <div className="mb-10 p-4 bg-doc-border/50 rounded">
              <p className="text-[10px] font-mono uppercase tracking-widest text-doc-text-secondary mb-1">
                Significance
              </p>
              <p className="text-sm font-sans text-doc-text-secondary italic">
                {doc.significance_reasoning}
              </p>
            </div>
          )}

          {/* Related documents */}
          {related && related.length > 0 && (
            <section className="mt-12 pt-8 border-t border-doc-border">
              <h2 className="font-display text-xl font-semibold text-doc-text mb-4">
                Related Documents
              </h2>
              <div className="space-y-3">
                {related.map((r) => (
                  <Link
                    key={r.processed_document.id}
                    href={`/document/${r.processed_document.id}`}
                    className="block p-4 border border-doc-border rounded hover:border-doc-accent/30 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-doc-text-secondary uppercase tracking-wider">
                        {(r.similarity_score * 100).toFixed(0)}% match
                      </span>
                      {r.source && (
                        <span className="text-[10px] font-mono text-doc-text-secondary">
                          {r.source.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-sans text-doc-text group-hover:text-doc-accent transition-colors line-clamp-2">
                      {r.processed_document.plain_summary}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Floating annotation toolbar */}
      {pending && (
        <AnnotationToolbar
          pending={pending}
          onSave={handleSaveAnnotation}
          onDismiss={() => { setPending(null); window.getSelection()?.removeAllRanges(); }}
        />
      )}

      {/* Annotations panel */}
      {panelOpen && (
        <AnnotationsPanel
          annotations={annotations}
          onDelete={handleDeleteAnnotation}
        />
      )}

      {/* Create task slide-over */}
      <CreateTaskSlideOver
        open={taskSlideOver}
        onClose={() => setTaskSlideOver(false)}
        doc={doc}
      />
    </div>
  );
}
