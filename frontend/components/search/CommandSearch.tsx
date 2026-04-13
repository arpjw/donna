"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Search, ArrowRight, X } from "lucide-react";
import { searchApi } from "@/lib/api";
import type { SearchResult } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CommandSearchProps {
  open: boolean;
  onClose: () => void;
}

export function CommandSearch({ open, onClose }: CommandSearchProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const data = await searchApi.search({ query: query.trim() }, token ?? undefined);
        setResults(data.slice(0, 6));
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, getToken]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        navigateTo(results[selectedIndex].processed_document.id);
      } else if (query.trim()) {
        navigateToSearch();
      }
    }
  };

  const navigateTo = (docId: string) => {
    router.push(`/document/${docId}`);
    onClose();
  };

  const navigateToSearch = () => {
    if (query.trim()) {
      router.push(`/search`);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-[600px] mx-4 rounded-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#1C1814", border: "1px solid #2A2420" }}
      >
        {/* Input */}
        <div
          className="flex items-center gap-3 px-4"
          style={{ borderBottom: "1px solid #2A2420" }}
        >
          {loading ? (
            <div
              className="w-4 h-4 border-2 rounded-full animate-spin shrink-0"
              style={{ borderColor: "rgba(74,69,63,0.3)", borderTopColor: "#4A453F" }}
            />
          ) : (
            <Search className="w-4 h-4 shrink-0" style={{ color: "#4A453F" }} />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search regulations, topics, requirements..."
            className="flex-1 bg-transparent py-4 font-sans focus:outline-none"
            style={{ fontSize: 14, color: "#D4CFC7" }}
          />
          <button
            onClick={onClose}
            style={{ color: "#4A453F" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#8A837A")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#4A453F")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-[360px] overflow-y-auto py-1">
            {results.map((r, i) => (
              <button
                key={r.processed_document.id}
                onClick={() => navigateTo(r.processed_document.id)}
                className={cn(
                  "w-full text-left px-4 py-3 flex items-start gap-3 transition-colors group",
                )}
                style={
                  i === selectedIndex
                    ? { background: "rgba(196,133,90,0.10)" }
                    : {}
                }
                onMouseEnter={(e) => {
                  if (i !== selectedIndex) {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (i !== selectedIndex) {
                    (e.currentTarget as HTMLButtonElement).style.background = "";
                  }
                }}
              >
                <div className="flex-1 min-w-0">
                  {r.change?.headline && (
                    <p className="font-sans font-medium text-sm truncate" style={{ color: "#D4CFC7" }}>
                      {r.change.headline}
                    </p>
                  )}
                  <p className="font-sans text-xs line-clamp-1 mt-0.5" style={{ color: "#6B655C" }}>
                    {r.processed_document.plain_summary}
                  </p>
                  {r.source && (
                    <p className="font-mono uppercase tracking-wider mt-1" style={{ fontSize: 10, color: "#4A453F" }}>
                      {r.source.name} · {(r.similarity_score * 100).toFixed(0)}% match
                    </p>
                  )}
                </div>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#4A453F" }} />
              </button>
            ))}
          </div>
        )}

        {query.trim() && !loading && results.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="font-sans text-sm" style={{ color: "#6B655C" }}>
              No results for "{query}"
            </p>
          </div>
        )}

        {/* Footer hint */}
        <div
          className="px-4 py-2 flex items-center justify-between"
          style={{ borderTop: "1px solid #2A2420" }}
        >
          <p className="font-mono" style={{ fontSize: 10, color: "#4A453F" }}>
            ↑↓ navigate · ↵ open · esc close
          </p>
          {query.trim() && (
            <button
              onClick={navigateToSearch}
              className="font-mono transition-colors"
              style={{ fontSize: 10, color: "#C4855A" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#D4956A")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#C4855A")}
            >
              View all results →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
