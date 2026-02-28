"use client";

import { Search, SlidersHorizontal } from "lucide-react";

export default function ListingsToolbar({ searchQuery = "", onSearchQueryChange, onSearchSubmit, onOpenFilters }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (onSearchSubmit) onSearchSubmit(searchQuery?.trim?.() || "");
    }
  };

  return (
    <div className="w-full lg:w-auto">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-2xl bg-white/80 backdrop-blur px-4 sm:px-6 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">

        {/* SEARCH */}
        <form
          className="flex items-center gap-3 rounded-full bg-gray-100 px-4 py-2 w-full sm:w-64 flex-1 sm:flex-initial"
          onSubmit={(e) => {
            e.preventDefault();
            if (onSearchSubmit) onSearchSubmit(searchQuery?.trim?.() || "");
          }}
        >
          <Search size={16} className="text-gray-500 shrink-0" />
          <input
            type="search"
            placeholder="Search homes"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full min-w-0 bg-transparent text-sm text-[#091D35] outline-none placeholder-gray-500"
            aria-label="Search homes"
          />
        </form>

        {/* MODE */}
        <span className="hidden sm:inline text-sm font-semibold tracking-wide text-[#091D35] px-2">
          BUY
        </span>

        {/* FILTER CTA */}
        <button
          onClick={onOpenFilters}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#091D35] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0c2746] transition shadow-md w-full sm:w-auto"
        >
          <SlidersHorizontal size={14} />
          Filters
        </button>
      </div>
    </div>
  );
}
