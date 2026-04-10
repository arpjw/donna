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
    if (e.key === "Escape") {
      onClose();
      return;
    }
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-[600px] mx-4 bg-card border border-border rounded-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          {loading ? (
            <div className="w-4 h-4 border-2 border-text-tertiary/30 border-t-text-tertiary rounded-full animate-spin shrink-0" />
          ) : (
            <Search className="w-4 h-4 text-text-tertiary shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search regulations, topics, requirements..."
            className="flex-1 bg-transparent py-4 text-sm text-text-primary font-sans placeholder:text-text-tertiary focus:outline-none"
          />
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-secondary transition-colors"
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
                  i === selectedIndex
                    ? "bg-crimson/10 text-text-primary"
                    : "hover:bg-white/5 text-text-secondary"
                )}
              >
                <div className="flex-1 min-w-0">
                  {r.change?.headline && (
                    <p className="text-sm font-sans font-medium text-text-primary truncate">
                      {r.change.headline}
                    </p>
                  )}
                  <p className="text-xs text-text-secondary font-sans line-clamp-1 mt-0.5">
                    {r.processed_document.plain_summary}
                  </p>
                  {r.source && (
                    <p className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider mt-1">
                      {r.source.name} · {(r.similarity_score * 100).toFixed(0)}% match
                    </p>
                  )}
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-text-tertiary shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}

        {/* Empty with query */}
        {query.trim() && !loading && results.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-text-secondary font-sans">
              No results for "{query}"
            </p>
          </div>
        )}

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-border flex items-center justify-between">
          <p className="text-[10px] font-mono text-text-tertiary">
            ↑↓ navigate · ↵ open · esc close
          </p>
          {query.trim() && (
            <button
              onClick={navigateToSearch}
              className="text-[10px] font-mono text-crimson hover:text-crimson/80 transition-colors"
            >
              View all results →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
