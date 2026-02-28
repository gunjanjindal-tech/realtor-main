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

  const handleMinPriceChange = (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, minPrice: value }));
  };

  const handleMaxPriceChange = (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, maxPrice: value }));
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
      <div className="space-y-4">
        {/* Min Price */}
        <div>
          <p className="text-sm font-semibold text-[#091D35] mb-2">Min Price</p>
          <select
            value={filters.minPrice || ""}
            onChange={handleMinPriceChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091D35]"
          >
            <option value="">Any</option>
            <option value="0">$0</option>
            <option value="100000">$100K</option>
            <option value="200000">$200K</option>
            <option value="300000">$300K</option>
            <option value="400000">$400K</option>
            <option value="500000">$500K</option>
            <option value="600000">$600K</option>
            <option value="700000">$700K</option>
            <option value="800000">$800K</option>
            <option value="900000">$900K</option>
            <option value="1000000">$1M</option>
            <option value="1500000">$1.5M</option>
            <option value="2000000">$2M</option>
            <option value="3000000">$3M</option>
            <option value="5000000">$5M+</option>
          </select>
        </div>

        {/* Max Price */}
        <div>
          <p className="text-sm font-semibold text-[#091D35] mb-2">Max Price</p>
          <select
            value={filters.maxPrice || ""}
            onChange={handleMaxPriceChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091D35]"
          >
            <option value="">Any</option>
            <option value="200000">$200K</option>
            <option value="300000">$300K</option>
            <option value="400000">$400K</option>
            <option value="500000">$500K</option>
            <option value="600000">$600K</option>
            <option value="700000">$700K</option>
            <option value="800000">$800K</option>
            <option value="900000">$900K</option>
            <option value="1000000">$1M</option>
            <option value="1500000">$1.5M</option>
            <option value="2000000">$2M</option>
            <option value="3000000">$3M</option>
            <option value="5000000">$5M</option>
            <option value="10000000">$10M+</option>
          </select>
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
