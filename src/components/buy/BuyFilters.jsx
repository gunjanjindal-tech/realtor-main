"use client";

import { useState } from "react";

export default function BuyFilters({ onApplyFilters, onClose, initialFilters }) {

  const PRICE_MIN = 100000;
  const PRICE_MAX = 150000000;

  const SQFT_MIN = 500;
  const SQFT_MAX = 10000;

  const getInitialFilters = () => {
    if (initialFilters) {
      return {
        minBeds: initialFilters.minBeds || "",
        minBaths: initialFilters.minBaths || "",
        minPrice: initialFilters.minPrice ? Number(initialFilters.minPrice) : PRICE_MIN,
        maxPrice: initialFilters.maxPrice ? Number(initialFilters.maxPrice) : PRICE_MAX,
        minSqft: initialFilters.minSqft ? Number(initialFilters.minSqft) : SQFT_MIN,
        maxSqft: initialFilters.maxSqft ? Number(initialFilters.maxSqft) : SQFT_MAX
      };
    }

    return {
      minBeds: "",
      minBaths: "",
      minPrice: PRICE_MIN,
      maxPrice: PRICE_MAX,
      minSqft: SQFT_MIN,
      maxSqft: SQFT_MAX
    };
  };

  const [filters, setFilters] = useState(getInitialFilters());

  function formatPrice(value) {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  }

  const handleBedSelect = (value) => {
    const bedValue = value === "Any" ? "" : value.replace("+", "");
    setFilters(prev => ({ ...prev, minBeds: bedValue }));
  };

  const handleBathSelect = (value) => {
    const bathValue = value === "Any" ? "" : value.replace("+", "");
    setFilters(prev => ({ ...prev, minBaths: bathValue }));
  };

  const handleReset = () => {

    const reset = {
      minBeds: "",
      minBaths: "",
      minPrice: PRICE_MIN,
      maxPrice: PRICE_MAX,
      minSqft: SQFT_MIN,
      maxSqft: SQFT_MAX
    };

    setFilters(reset);

    if (onApplyFilters) {
      onApplyFilters({
        minBeds: "",
        minBaths: "",
        minPrice: "",
        maxPrice: "",
        minSqft: "",
        maxSqft: ""
      });
    }

    if (onClose) onClose();
  };

  const handleApply = () => {

    // Only send filters if they are NOT default values
    // API expects empty strings for default/unset filters
    const filtersToApply = {
      minBeds: filters.minBeds || "",
      minBaths: filters.minBaths || "",
      // Only send price if it's different from default
      minPrice: filters.minPrice !== PRICE_MIN ? filters.minPrice.toString() : "",
      maxPrice: filters.maxPrice !== PRICE_MAX ? filters.maxPrice.toString() : "",
      // Note: minSqft and maxSqft are not supported by API, so we don't send them
    };

    if (onApplyFilters) onApplyFilters(filtersToApply);

    if (onClose) onClose();
  };

  return (
    <div className="space-y-10">

      {/* Beds */}

      <div>

        <p className="font-semibold mb-3 text-[#091D35]">Beds</p>

        <div className="grid grid-cols-3 gap-2">

          {["Any", "1+", "2+", "3+", "4+", "5+"].map((b) => {

            const value = b === "Any" ? "" : b.replace("+", "");

            const active = filters.minBeds === value;

            return (

              <button
                key={b}
                onClick={() => handleBedSelect(b)}
                className={`border rounded-lg py-2 text-sm ${active
                    ? "bg-[#091D35] text-white border-[#091D35]"
                    : "hover:border-[#091D35]"
                  }`}
              >

                {b}

              </button>

            );

          })}

        </div>

      </div>

      {/* Baths */}

      <div>

        <p className="font-semibold mb-3 text-[#091D35]">Baths</p>

        <div className="grid grid-cols-3 gap-2">

          {["Any", "1+", "2+", "3+", "4+", "5+"].map((b) => {

            const value = b === "Any" ? "" : b.replace("+", "");

            const active = filters.minBaths === value;

            return (

              <button
                key={b}
                onClick={() => handleBathSelect(b)}
                className={`border rounded-lg py-2 text-sm ${active
                    ? "bg-[#091D35] text-white border-[#091D35]"
                    : "hover:border-[#091D35]"
                  }`}
              >

                {b}

              </button>

            );

          })}

        </div>

      </div>

      {/* SQFT SLIDER */}

      <div className="space-y-4">

        <div className="flex justify-between text-sm text-[#091D35] font-medium">

          <span>{filters.minSqft} Sq.Ft.</span>

          <span>{filters.maxSqft}+ Sq.Ft.</span>

        </div>

        <div className="relative h-8 flex items-center">

          <div className="absolute w-full h-[3px] bg-gray-200" />

          <div
            className="absolute h-[3px] bg-[#091D35]"
            style={{
              left: `${((filters.minSqft - SQFT_MIN) / (SQFT_MAX - SQFT_MIN)) * 100}%`,
              width: `${((filters.maxSqft - filters.minSqft) / (SQFT_MAX - SQFT_MIN)) * 100}%`
            }}
          />

          <input
            type="range"
            min={SQFT_MIN}
            max={SQFT_MAX}
            step="100"
            value={filters.minSqft}
            onChange={(e) => {

              const value = Number(e.target.value);

              if (value < filters.maxSqft) {

                setFilters(prev => ({ ...prev, minSqft: value }));

              }

            }}
            className="absolute w-full appearance-none bg-transparent pointer-events-none
[&::-webkit-slider-thumb]:appearance-none
[&::-webkit-slider-thumb]:pointer-events-auto
[&::-webkit-slider-thumb]:h-5
[&::-webkit-slider-thumb]:w-5
[&::-webkit-slider-thumb]:rounded-full
[&::-webkit-slider-thumb]:bg-[#091D35]
[&::-moz-range-thumb]:pointer-events-auto"
          />

          <input
            type="range"
            min={SQFT_MIN}
            max={SQFT_MAX}
            step="100"
            value={filters.maxSqft}
            onChange={(e) => {

              const value = Number(e.target.value);

              if (value > filters.minSqft) {

                setFilters(prev => ({ ...prev, maxSqft: value }));

              }

            }}
            className="absolute w-full appearance-none bg-transparent pointer-events-none
[&::-webkit-slider-thumb]:appearance-none
[&::-webkit-slider-thumb]:pointer-events-auto
[&::-webkit-slider-thumb]:h-5
[&::-webkit-slider-thumb]:w-5
[&::-webkit-slider-thumb]:rounded-full
[&::-webkit-slider-thumb]:bg-[#091D35]
[&::-moz-range-thumb]:pointer-events-auto"
          />

        </div>

      </div>

      {/* PRICE SLIDER */}

      <div className="space-y-4">

        <div className="flex justify-between text-sm text-[#091D35] font-medium">

          <span>{formatPrice(filters.minPrice)}</span>

          <span>{formatPrice(filters.maxPrice)}</span>

        </div>

        <div className="relative h-8 flex items-center">

          <div className="absolute w-full h-[3px] bg-gray-200" />

          <div
            className="absolute h-[3px] bg-[#091D35]"
            style={{
              left: `${((filters.minPrice - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100}%`,
              width: `${((filters.maxPrice - filters.minPrice) / (PRICE_MAX - PRICE_MIN)) * 100}%`
            }}
          />

          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step="10000"
            value={filters.minPrice}
            onChange={(e) => {

              const value = Number(e.target.value);

              if (value < filters.maxPrice) {

                setFilters(prev => ({ ...prev, minPrice: value }));

              }

            }}
            className="absolute w-full appearance-none bg-transparent pointer-events-none
[&::-webkit-slider-thumb]:appearance-none
[&::-webkit-slider-thumb]:pointer-events-auto
[&::-webkit-slider-thumb]:h-5
[&::-webkit-slider-thumb]:w-5
[&::-webkit-slider-thumb]:rounded-full
[&::-webkit-slider-thumb]:bg-[#091D35]"
          />

          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step="10000"
            value={filters.maxPrice}
            onChange={(e) => {

              const value = Number(e.target.value);

              if (value > filters.minPrice) {

                setFilters(prev => ({ ...prev, maxPrice: value }));

              }

            }}
            className="absolute w-full appearance-none bg-transparent pointer-events-none
[&::-webkit-slider-thumb]:appearance-none
[&::-webkit-slider-thumb]:pointer-events-auto
[&::-webkit-slider-thumb]:h-5
[&::-webkit-slider-thumb]:w-5
[&::-webkit-slider-thumb]:rounded-full
[&::-webkit-slider-thumb]:bg-[#091D35]"
          />

        </div>

      </div>

      {/* Buttons */}

      <div className="flex gap-3 pt-4">

        <button
          onClick={handleReset}
          className="flex-1 border rounded-full py-2 hover:border-red-500"
        >

          Reset Filters

        </button>

        <button
          onClick={handleApply}
          className="flex-1 bg-[#091D35] text-white rounded-full py-2"
        >

          Apply Filters

        </button>

      </div>

    </div>
  );
}