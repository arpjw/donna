"use client";

import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading?: boolean;
  initialValue?: string;
}

export function SearchBar({ onSearch, loading, initialValue = "" }: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9E9890" }} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search regulations, topics, requirements..."
          className="w-full rounded pl-11 pr-4 py-3.5 font-sans text-sm focus:outline-none transition-colors"
          style={{
            background: "#F5F2EC",
            border: "1px solid #E2DDD5",
            color: "#1C1814",
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(196,133,90,0.50)";
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLInputElement).style.borderColor = "#E2DDD5";
          }}
        />
        {loading && (
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 rounded-full animate-spin"
            style={{ borderColor: "rgba(158,152,144,0.30)", borderTopColor: "#9E9890" }}
          />
        )}
      </div>
    </form>
  );
}
