"use client";

import { useState } from "react";

export default function BuyFilters({ onApplyFilters, onClose }) {
  const [filters, setFilters] = useState({
    minBeds: "",
    minBaths: "",
    minPrice: "",
    maxPrice: "",
  });

  const handleBedSelect = (value) => {
    const bedValue = value === "Any" ? "" : value.replace("+", "");
    setFilters((prev) => ({ ...prev, minBeds: bedValue }));
  };

  const handleBathSelect = (value) => {
    const bathValue = value === "Any" ? "" : value.replace("+", "");
    setFilters((prev) => ({ ...prev, minBaths: bathValue }));
  };

  const handlePriceChange = (e) => {
    const value = parseInt(e.target.value);
    setFilters((prev) => ({ ...prev, maxPrice: value.toString() }));
  };

  const resetFilters = {
    minBeds: "",
    minBaths: "",
    minPrice: "",
    maxPrice: "",
  };

  const handleReset = () => {
    setFilters(resetFilters);
    if (onApplyFilters) {
      onApplyFilters(resetFilters);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleApply = () => {
    if (onApplyFilters) {
      onApplyFilters(filters);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="space-y-8">
      
      {/* BEDS */}
      <div>
        <p className="text-sm font-semibold text-[#091D35] mb-3">Beds</p>
        <div className="grid grid-cols-3 gap-2">
          {["Any", "1+", "2+", "3+", "4+", "5+"].map((b) => {
            const value = b === "Any" ? "" : b.replace("+", "");
            const isSelected = filters.minBeds === value;
            return (
              <button
                key={b}
                onClick={() => handleBedSelect(b)}
                className={`rounded-xl border py-2 text-sm transition ${
                  isSelected
                    ? "bg-[#091D35] text-white border-[#091D35]"
                    : "hover:border-[#091D35] hover:bg-[#091D35]/5"
                }`}
              >
                {b}
              </button>
            );
          })}
        </div>
      </div>

      {/* BATHS */}
      <div>
        <p className="text-sm font-semibold text-[#091D35] mb-3">Baths</p>
        <div className="grid grid-cols-3 gap-2">
          {["Any", "1+", "2+", "3+", "4+", "5+"].map((b) => {
            const value = b === "Any" ? "" : b.replace("+", "");
            const isSelected = filters.minBaths === value;
            return (
              <button
                key={b}
                onClick={() => handleBathSelect(b)}
                className={`rounded-xl border py-2 text-sm transition ${
                  isSelected
                    ? "bg-[#091D35] text-white border-[#091D35]"
                    : "hover:border-[#091D35] hover:bg-[#091D35]/5"
                }`}
              >
                {b}
              </button>
            );
          })}
        </div>
      </div>

      {/* PRICE */}
      <div>
        <p className="text-sm font-semibold text-[#091D35] mb-3">
          Max Price: {filters.maxPrice ? `$${parseInt(filters.maxPrice).toLocaleString()}` : "Any"}
        </p>
        <input 
          type="range" 
          min="100000" 
          max="2000000" 
          step="50000"
          value={filters.maxPrice || 2000000}
          onChange={handlePriceChange}
          className="w-full accent-[#091D35]" 
        />
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>$100K</span>
          <span>$2M</span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 pt-4">
        <button 
          onClick={handleReset}
          className="flex-1 rounded-full border py-2 text-sm hover:bg-gray-50 transition"
        >
          Reset
        </button>
        <button 
          onClick={handleApply}
          className="flex-1 rounded-full bg-[#091D35] text-white py-2 text-sm hover:bg-[#0c2a4d] transition"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
