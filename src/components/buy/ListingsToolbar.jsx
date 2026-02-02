"use client";

import { Search, SlidersHorizontal } from "lucide-react";

export default function ListingsToolbar({ onOpenFilters }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
      
      

      {/* CONTROLS */}
      <div className="flex items-center gap-3 w-full lg:w-auto">
        
        {/* SEARCH */}
        <div className="relative flex-1 lg:w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            placeholder="Search properties"
            className="w-full rounded-full border pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#091D35]"
          />
        </div>

        {/* BUY / RENT */}
        <div className="hidden lg:flex rounded-full border overflow-hidden">
          <button className="px-4 py-2 text-sm bg-[#091D35] text-white">
            Buy
          </button>
         
        </div>

        {/* FILTER BUTTON (mobile + desktop optional) */}
        <button
          onClick={onOpenFilters}
          className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>
    </div>
  );
}
