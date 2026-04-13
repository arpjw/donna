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

  const plainOffset = 0;
  const detailedBaseOffset = doc.plain_summary.length + 2;

  const togglePanel = () => {
    const next = !panelOpen;
    setPanelOpen(next);
    localStorage.setItem(`notes-panel-${doc.id}`, String(next));
  };

  const loadAnnotations = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await annotationsApi.list(doc.id, token);
      setAnnotations(data);
    } catch {
      // non-fatal
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

  const detailedParagraphs = doc.detailed_summary
    ? doc.detailed_summary.split("\n\n")
    : [];
  const paraOffsets: number[] = [];
  let acc = detailedBaseOffset;
  for (const para of detailedParagraphs) {
    paraOffsets.push(acc);
    acc += para.length + 2;
  }

  return (
    <div className="min-h-screen transition-colors" style={{ background: "#F5F2EC", color: "#1C1814" }}>
      <div className={panelOpen ? "pr-[280px]" : ""}>
        <div className="max-w-[720px] mx-auto px-4 py-6 sm:px-14 sm:py-12">
          {/* Back link */}
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 mb-10 font-mono uppercase tracking-wider transition-colors"
            style={{ fontSize: 10, color: "#9E9890" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#6B655C")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#9E9890")}
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
                  <span
                    className="font-mono uppercase tracking-wider"
                    style={{ fontSize: 10, color: "#9E9890" }}
                  >
                    {source.name}
                  </span>
                )}
              </div>
              {/* Notes toggle */}
              <button
                onClick={togglePanel}
                className="flex items-center gap-1.5 font-mono uppercase tracking-wider shrink-0 px-2.5 py-1 rounded border transition-colors"
                style={{
                  fontSize: 10,
                  ...(panelOpen
                    ? { background: "rgba(196,133,90,0.10)", color: "#C4855A", borderColor: "rgba(196,133,90,0.30)" }
                    : { color: "#9E9890", borderColor: "#E2DDD5" }),
                }}
              >
                <StickyNote className="w-3.5 h-3.5" />
                Notes {annotations.length > 0 ? `(${annotations.length})` : ""}
              </button>
            </div>

            <h1
              className="font-display leading-tight mb-4"
              style={{ fontSize: 32, color: "#1C1814" }}
            >
              {headline}
            </h1>

            <div className="flex items-center gap-6 font-mono" style={{ fontSize: 11, color: "#9E9890" }}>
              {publishedAt && (
                <span>Published {formatDate(publishedAt)}</span>
              )}
              {documentUrl && (
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                  style={{ color: "#C4855A" }}
                >
                  View source <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </header>

          {/* Quick stats */}
          <div
            className="grid grid-cols-3 gap-4 mb-10 p-5 rounded"
            style={{ background: "#EEE9E0", border: "1px solid #E2DDD5" }}
          >
            <div>
              <p className="font-mono uppercase tracking-widest mb-1" style={{ fontSize: 10, color: "#9E9890" }}>
                Significance
              </p>
              <p className="font-mono text-lg" style={{ color: "#1C1814" }}>
                {doc.significance_score != null
                  ? (doc.significance_score * 100).toFixed(0) + "%"
                  : "—"}
              </p>
            </div>
            <div>
              <p className="font-mono uppercase tracking-widest mb-1" style={{ fontSize: 10, color: "#9E9890" }}>
                Industries
              </p>
              <p className="font-sans text-sm" style={{ color: "#1C1814" }}>
                {doc.affected_industries?.length
                  ? doc.affected_industries.slice(0, 3).join(", ")
                  : "—"}
              </p>
            </div>
            <div>
              <p className="font-mono uppercase tracking-widest mb-1" style={{ fontSize: 10, color: "#9E9890" }}>
                Jurisdictions
              </p>
              <p className="font-sans text-sm" style={{ color: "#1C1814" }}>
                {doc.affected_jurisdictions?.length
                  ? doc.affected_jurisdictions.slice(0, 3).join(", ")
                  : "—"}
              </p>
            </div>
          </div>

          {/* Plain summary */}
          <section className="mb-10">
            <p className="font-mono uppercase tracking-widest mb-3" style={{ fontSize: 10, color: "#9E9890" }}>
              In plain language
            </p>
            <AnnotatableSection
              text={doc.plain_summary}
              globalOffset={plainOffset}
              annotations={annotations}
              onSelectionReady={setPending}
              className="font-sans leading-relaxed"
              style={{
                fontSize: 18,
                color: "#1C1814",
                borderLeft: "2px solid #C4855A",
                paddingLeft: 16,
                fontWeight: 300,
              }}
            />
          </section>

          <hr style={{ borderColor: "#E2DDD5", marginBottom: 40 }} />

          {/* Detailed summary */}
          {doc.detailed_summary && (
            <section className="mb-10">
              <h2
                className="font-display italic mb-4"
                style={{ fontSize: 18, color: "#1C1814" }}
              >
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
                    className="font-sans leading-relaxed"
                    style={{ fontSize: 14, color: "#6B655C", fontWeight: 300, lineHeight: 1.7 }}
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
                  <AlertCircle className="w-4 h-4" style={{ color: "#C4855A" }} />
                  <h2
                    className="font-display italic"
                    style={{ fontSize: 18, color: "#1C1814" }}
                  >
                    What to do
                  </h2>
                </div>
                <button
                  onClick={() => setTaskSlideOver(true)}
                  className="flex items-center gap-1.5 font-sans transition-colors"
                  style={{ fontSize: 11, color: "#9E9890" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#C4855A")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#9E9890")}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  Create task
                </button>
              </div>
              <div
                className="p-5 rounded"
                style={{ background: "rgba(196,133,90,0.06)", border: "1px solid rgba(196,133,90,0.20)" }}
              >
                <p className="font-sans leading-relaxed" style={{ fontSize: 14, color: "#1C1814", fontWeight: 300 }}>
                  {doc.recommended_actions}
                </p>
              </div>
            </section>
          )}

          {/* Key dates */}
          {doc.key_dates && doc.key_dates.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4" style={{ color: "#9E9890" }} />
                <h2
                  className="font-display italic"
                  style={{ fontSize: 18, color: "#1C1814" }}
                >
                  Key Dates
                </h2>
              </div>
              <div className="space-y-2">
                {doc.key_dates.map((kd, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5"
                    style={{ borderBottom: i < doc.key_dates.length - 1 ? "1px solid #E2DDD5" : "none" }}
                  >
                    <span className="font-sans text-sm" style={{ color: "#6B655C" }}>
                      {kd.label}
                    </span>
                    <span className="font-mono text-sm" style={{ color: "#1C1814" }}>{kd.date}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Taxonomy tags */}
          {doc.taxonomy_tags && doc.taxonomy_tags.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4" style={{ color: "#9E9890" }} />
                <h2
                  className="font-display italic"
                  style={{ fontSize: 18, color: "#1C1814" }}
                >
                  Tags
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {doc.taxonomy_tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono uppercase tracking-wider px-2 py-1 rounded"
                    style={{ fontSize: 10, background: "#EEE9E0", border: "1px solid #D5D0C8", color: "#6B655C" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Significance reasoning */}
          {doc.significance_reasoning && (
            <div
              className="mb-10 p-4 rounded"
              style={{ background: "#EEE9E0", border: "1px solid #E2DDD5" }}
            >
              <p className="font-mono uppercase tracking-widest mb-1" style={{ fontSize: 10, color: "#9E9890" }}>
                Significance
              </p>
              <p className="font-sans text-sm italic" style={{ color: "#6B655C", fontWeight: 300 }}>
                {doc.significance_reasoning}
              </p>
            </div>
          )}

          {/* Related documents */}
          {related && related.length > 0 && (
            <section className="mt-12 pt-8" style={{ borderTop: "1px solid #E2DDD5" }}>
              <h2
                className="font-display italic mb-4"
                style={{ fontSize: 18, color: "#1C1814" }}
              >
                Related Documents
              </h2>
              <div className="space-y-3">
                {related.map((r) => (
                  <Link
                    key={r.processed_document.id}
                    href={`/document/${r.processed_document.id}`}
                    className="block p-4 rounded transition-colors group"
                    style={{ border: "1px solid #E2DDD5" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(196,133,90,0.40)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "#E2DDD5";
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono uppercase tracking-wider" style={{ fontSize: 10, color: "#9E9890" }}>
                        {(r.similarity_score * 100).toFixed(0)}% match
                      </span>
                      {r.source && (
                        <span className="font-mono" style={{ fontSize: 10, color: "#9E9890" }}>
                          {r.source.name}
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-sm line-clamp-2" style={{ color: "#6B655C", fontWeight: 300 }}>
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
