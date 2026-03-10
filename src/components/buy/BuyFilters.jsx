"use client";

import { useState } from "react";

export default function BuyFilters({ onApplyFilters, onClose, initialFilters }) {

  // Initialize filters from props or defaults
  const getInitialFilters = () => {
    if (initialFilters) {
      return {
        minBeds: initialFilters.minBeds || "",
        minBaths: initialFilters.minBaths || "",
        minPrice: initialFilters.minPrice ? Number(initialFilters.minPrice) : 0,
        maxPrice: initialFilters.maxPrice ? Number(initialFilters.maxPrice) : 10000000,
      };
    }
    return {
      minBeds: "",
      minBaths: "",
      minPrice: 0,
      maxPrice: 10000000,
    };
  };

  const [filters, setFilters] = useState(getInitialFilters);

  const handleBedSelect = (value) => {
    const bedValue = value === "Any" ? "" : value.replace("+", "");
    setFilters((prev) => ({ ...prev, minBeds: bedValue }));
  };

  const handleBathSelect = (value) => {
    const bathValue = value === "Any" ? "" : value.replace("+", "");
    setFilters((prev) => ({ ...prev, minBaths: bathValue }));
  };

  const resetFilters = {
    minBeds: "",
    minBaths: "",
    minPrice: "",
    maxPrice: "",
  };

  const handleReset = () => {
    const reset = {
      minBeds: "",
      minBaths: "",
      minPrice: 0,
      maxPrice: 10000000,
    };
    setFilters(reset);
    // Convert to string format for parent component
    if (onApplyFilters) onApplyFilters({
      minBeds: "",
      minBaths: "",
      minPrice: "",
      maxPrice: "",
    });
    if (onClose) onClose();
  };

  const handleApply = () => {
    // Convert price values to string format (empty string if default values)
    const filtersToApply = {
      minBeds: filters.minBeds || "",
      minBaths: filters.minBaths || "",
      minPrice: filters.minPrice > 0 ? filters.minPrice.toString() : "",
      maxPrice: filters.maxPrice < 10000000 ? filters.maxPrice.toString() : "",
    };
    if (onApplyFilters) onApplyFilters(filtersToApply);
    if (onClose) onClose();
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
                className={`rounded-xl border py-2 text-sm transition ${isSelected
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
                className={`rounded-xl border py-2 text-sm transition ${isSelected
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

        <p className="text-sm font-semibold text-[#091D35]">
          Price Range
        </p>

        {/* Selected price */}
        <div className="flex justify-between text-sm text-gray-600 mb-4">
          <span className="font-medium">${filters.minPrice.toLocaleString()}</span>
          <span className="font-medium">${filters.maxPrice.toLocaleString()}</span>
        </div>

        {/* Dual Range Slider - Single track with two handles */}
        <div className="relative h-8 flex items-center">
          {/* Track background */}
          <div className="absolute w-full h-2 bg-gray-200 rounded-full"></div>

          {/* Active range (between min and max) */}
          <div
            className="absolute h-2 bg-[#091D35] rounded-full"
            style={{
              left: `${(filters.minPrice / 10000000) * 100}%`,
              width: `${((filters.maxPrice - filters.minPrice) / 10000000) * 100}%`
            }}
          ></div>

          {/* Min Price Slider */}
          <input
            type="range"
            min="0"
            max="10000000"
            step="10000"
            value={filters.minPrice}
            onChange={(e) => {
              const newMin = Number(e.target.value);
              setFilters((prev) => ({
                ...prev,
                minPrice: Math.min(newMin, prev.maxPrice - 10000),
              }));
            }}
            className="absolute w-full h-2 opacity-0 cursor-pointer z-10"
          />

          {/* Max Price Slider */}
          <input
            type="range"
            min="0"
            max="10000000"
            step="10000"
            value={filters.maxPrice}
            onChange={(e) => {
              const newMax = Number(e.target.value);
              setFilters((prev) => ({
                ...prev,
                maxPrice: Math.max(newMax, prev.minPrice + 10000),
              }));
            }}
            className="absolute w-full h-2 opacity-0 cursor-pointer z-20"
          />
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