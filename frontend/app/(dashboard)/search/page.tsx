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
      <div className="pb-6 mb-8" style={{ borderBottom: "1px solid #E2DDD5" }}>
        <h1 className="font-display mb-5" style={{ fontSize: 26, color: "#1C1814" }}>
          Search
        </h1>
        <SearchBar onSearch={handleSearch} loading={loading} />
      </div>

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <div className="rounded p-8 text-center" style={{ border: "1px solid #E2DDD5" }}>
          <p className="font-sans text-sm" style={{ color: "#6B655C" }}>{error}</p>
        </div>
      ) : results !== null && results.length === 0 ? (
        <div className="rounded p-8 text-center" style={{ border: "1px solid #E2DDD5" }}>
          <p className="font-display text-xl mb-2" style={{ color: "#1C1814" }}>
            No results for &ldquo;{lastQuery}&rdquo;
          </p>
          <p className="font-sans text-sm" style={{ color: "#6B655C", fontWeight: 300 }}>
            Try broader terms or different keywords.
          </p>
        </div>
      ) : results !== null ? (
        <div>
          <p className="font-mono mb-4" style={{ fontSize: 11, color: "#9E9890" }}>
            {results.length} results for "{lastQuery}"
          </p>
          <div className="space-y-3">
            {results.map((r) => (
              <SearchResultCard key={r.processed_document.id} result={r} />
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="text-center py-6 mb-8">
            <p className="font-display text-xl mb-2" style={{ color: "#1C1814" }}>
              Search regulations
            </p>
            <p className="font-sans text-sm max-w-md mx-auto" style={{ color: "#6B655C", fontWeight: 300 }}>
              Search across 689+ regulatory documents. Try searching for a topic, agency, or regulation type.
            </p>
          </div>
          <p className="font-mono uppercase tracking-wider mb-4" style={{ fontSize: 11, color: "#9E9890" }}>
            Example searches
          </p>
          <div className="space-y-2">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => handleSearch(q)}
                className="block w-full text-left px-4 py-3 rounded font-sans text-sm transition-colors"
                style={{ border: "1px solid #E2DDD5", color: "#6B655C", background: "#F5F2EC" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#1C1814";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(196,133,90,0.30)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#6B655C";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#E2DDD5";
                }}
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

  return (
    <Link href={`/document/${doc.id}`}>
      <article
        className="rounded p-5 cursor-pointer transition-all group"
        style={{ background: "#F5F2EC", border: "1px solid #E2DDD5" }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "#FAF8F4";
          el.style.borderColor = "rgba(196,133,90,0.30)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "#F5F2EC";
          el.style.borderColor = "#E2DDD5";
        }}
      >
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {change?.impact_level && <ImpactBadge level={change.impact_level} />}
          {change?.change_type && <ChangeTypeBadge type={change.change_type} />}
          {source && (
            <span className="font-mono uppercase tracking-wider" style={{ fontSize: 10, color: "#9E9890" }}>
              {source.name}
            </span>
          )}
          <span className="ml-auto font-mono" style={{ fontSize: 10, color: "#9E9890" }}>
            {(similarity_score * 100).toFixed(0)}% match
          </span>
        </div>
        {change?.headline && (
          <h3 className="font-display text-lg mb-1.5" style={{ color: "#1C1814" }}>
            {change.headline}
          </h3>
        )}
        <p className="font-sans text-sm line-clamp-2" style={{ color: "#6B655C", fontWeight: 300 }}>
          {doc.plain_summary}
        </p>
      </article>
    </Link>
  );
}
