"use client";

import { Search, SlidersHorizontal } from "lucide-react";

export default function ListingsToolbar({ onOpenFilters }) {
  return (
    <div className="w-full lg:w-auto">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-2xl bg-white/80 backdrop-blur px-4 sm:px-6 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">

        {/* SEARCH */}
        <div className="flex items-center gap-3 rounded-full bg-gray-100 px-4 py-2 w-full sm:w-auto">
          <Search size={16} className="text-gray-500" />
          <input
            placeholder="Search homes"
            className="w-full sm:w-48 bg-transparent text-sm text-[#091D35] outline-none placeholder-gray-500"
          />
        </div>

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
