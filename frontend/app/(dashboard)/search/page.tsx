"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { SearchBar } from "@/components/search/SearchBar";
import { ImpactBadge, ChangeTypeBadge } from "@/components/ui/badge";
import { searchApi } from "@/lib/api";
import type { SearchResult } from "@/lib/types";
import Link from "next/link";
import { CardSkeleton } from "@/components/ui/skeleton";

const EXAMPLE_QUERIES = [
  "Anti-money laundering requirements",
  "Data privacy consumer rights",
  "SEC enforcement actions 2024",
  "CFPB mortgage servicing rules",
  "Federal Reserve capital requirements",
];

export default function SearchPage() {
  const { getToken } = useAuth();
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState("");

  const handleSearch = async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      setLastQuery(query);
      const token = await getToken();
      const data = await searchApi.search({ query }, token ?? undefined);
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[860px] mx-auto px-8 py-8">
      <div className="border-b border-border pb-6 mb-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary mb-5">
          Search
        </h1>
        <SearchBar onSearch={handleSearch} loading={loading} />
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <div className="border border-border rounded p-8 text-center">
          <p className="text-text-secondary text-sm font-sans">{error}</p>
        </div>
      ) : results !== null && results.length === 0 ? (
        <div className="border border-border rounded p-8 text-center">
          <p className="font-display text-xl text-text-primary mb-2">
            No results for "{lastQuery}"
          </p>
          <p className="text-sm text-text-secondary font-sans">
            Try different search terms or browse the feed.
          </p>
        </div>
      ) : results !== null ? (
        <div>
          <p className="text-xs text-text-tertiary font-mono mb-4">
            {results.length} results for "{lastQuery}"
          </p>
          <div className="space-y-4">
            {results.map((r) => (
              <SearchResultCard key={r.processed_document.id} result={r} />
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-xs text-text-tertiary font-mono uppercase tracking-wider mb-4">
            Example searches
          </p>
          <div className="space-y-2">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => handleSearch(q)}
                className="block w-full text-left px-4 py-3 border border-border rounded text-sm text-text-secondary hover:text-text-primary hover:border-white/20 transition-colors font-sans"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ result }: { result: SearchResult }) {
  const { processed_document: doc, change, source, similarity_score } = result;
  const docId = doc.id;

  return (
    <Link href={`/document/${docId}`}>
      <article className="border border-border rounded p-5 hover:border-crimson/30 hover:bg-crimson/[0.03] transition-all cursor-pointer group">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {change?.impact_level && <ImpactBadge level={change.impact_level} />}
          {change?.change_type && <ChangeTypeBadge type={change.change_type} />}
          {source && (
            <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider">
              {source.name}
            </span>
          )}
          <span className="ml-auto text-[10px] font-mono text-text-tertiary">
            {(similarity_score * 100).toFixed(0)}% match
          </span>
        </div>
        {change?.headline && (
          <h3 className="font-display text-lg font-semibold text-text-primary mb-1.5 group-hover:text-white transition-colors">
            {change.headline}
          </h3>
        )}
        <p className="text-sm text-text-secondary font-sans line-clamp-2">
          {doc.plain_summary}
        </p>
      </article>
    </Link>
  );
}
