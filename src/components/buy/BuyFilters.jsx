"use client";

import { useState } from "react";

export default function BuyFilters({ onApplyFilters, onClose, initialFilters }) {

  const PRICE_MIN = 100000;
const PRICE_MAX = 150000000;

  // Initialize filters from props or defaults
  const getInitialFilters = () => {
    if (initialFilters) {
      return {
        minBeds: initialFilters.minBeds || "",
        minBaths: initialFilters.minBaths || "",
     minPrice: initialFilters.minPrice
  ? Number(initialFilters.minPrice)
  : PRICE_MIN,

maxPrice: initialFilters.maxPrice
  ? Number(initialFilters.maxPrice)
  : PRICE_MAX,
      };
    }
    return {
  minBeds: "",
  minBaths: "",
minPrice: PRICE_MIN,
maxPrice: PRICE_MAX,
};
  };

  
  const [filters, setFilters] = useState(getInitialFilters());
  
  function formatPrice(value) {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(0)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
}

const [sqftRange, setSqftRange] = useState({
  min: 500,
  max: 10000
});
  
  

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
  minPrice: PRICE_MIN,
  maxPrice: PRICE_MAX,
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
     maxPrice: filters.maxPrice < PRICE_MAX ? filters.maxPrice.toString() : "",
    };
    if (onApplyFilters) onApplyFilters(filtersToApply);
    if (onClose) onClose();
  };

  return (
    <div className="space-y-12">

      {/* BEDS */}
      <div>
        <p className="text-md font-semibold text-[#091D35] mb-3">Beds</p>

        <div className="grid grid-cols-3 gap-2">
          {["Any", "1+", "2+", "3+", "4+", "5+"].map((b) => {

            const value = b === "Any" ? "" : b.replace("+", "");
            const isSelected = filters.minBeds === value;

            return (
              <button
                key={b}
                onClick={() => handleBedSelect(b)}
                className={`rounded-lg border py-2 text-sm font-medium transition
${isSelected
? "bg-[#091D35] text-white border-[#091D35]"
: "border-gray-300 hover:border-red-500 hover:bg-red-50"}
`}
              >
                {b}
              </button>
            );
          })}
        </div>
      </div>


      {/* BATHS */}
      <div>
        <p className="text-md font-semibold text-[#091D35] mb-3">Baths</p>

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


    {/* SQFT */}
<div className="space-y-6 ">

<div className="flex justify-between text-sm font-medium text-[#091D35]">
<span>&lt;{sqftRange.min} Sq.Ft.</span>
<span>{sqftRange.max}+ Sq.Ft.</span>
</div>

<div className="relative h-8 flex items-center">

<div className="absolute w-full h-[3px] bg-gray-200"></div>

<div
className="absolute h-[3px] bg-[#091D35]"
style={{
left: `${(sqftRange.min / 10000) * 100}%`,
width: `${((sqftRange.max - sqftRange.min) / 10000) * 100}%`
}}
></div>

<input
type="range"
min="500"
max="10000"
step="100"
value={sqftRange.min}
onChange={(e)=>{
const newMin = Number(e.target.value);
setSqftRange(prev=>({
...prev,
min: Math.min(newMin, prev.max - 100)
}));
}}
className="absolute w-full appearance-none bg-transparent z-10
[&::-webkit-slider-thumb]:appearance-none
[&::-webkit-slider-thumb]:h-6
[&::-webkit-slider-thumb]:w-6
[&::-webkit-slider-thumb]:rounded-full
[&::-webkit-slider-thumb]:bg-[#091D35]"
/>

<input
type="range"
min="0"
max="10000"
step="100"
value={sqftRange.max}
onChange={(e)=>{
const newMax = Number(e.target.value);
setSqftRange(prev=>({
...prev,
max: Math.max(newMax, prev.min + 100)
}));
}}
className="absolute w-full appearance-none bg-transparent z-20
[&::-webkit-slider-thumb]:appearance-none
[&::-webkit-slider-thumb]:h-6
[&::-webkit-slider-thumb]:w-6
[&::-webkit-slider-thumb]:rounded-full
[&::-webkit-slider-thumb]:bg-[#091D35]"
/>

</div>

</div>
      
     {/* PRICE */}
<div className="space-y-6">


{/* Selected price */}
<div className="flex justify-between text-sm font-medium text-[#091D35]">

<span>{formatPrice(filters.minPrice)}</span>

<span>
{filters.maxPrice === PRICE_MAX 
  ? formatPrice(filters.maxPrice) + "+" 
  : formatPrice(filters.maxPrice)}
</span>

</div>

<div className="relative h-8 flex items-center">

{/* track background */}
<div className="absolute w-full h-[3px] bg-gray-200"></div>

{/* active range */}
<div
className="absolute h-[3px] bg-[#091D35]"
style={{
left: `${(filters.minPrice / PRICE_MAX) * 100}%`,
width: `${((filters.maxPrice - filters.minPrice) / PRICE_MAX) * 100}%`
}}
></div>

{/* min slider */}
<input
type="range"
min={PRICE_MIN}
max={PRICE_MAX}
step="10000"
value={filters.minPrice}
onChange={(e)=>{
const newMin = Number(e.target.value);

if (newMin < filters.maxPrice) {
setFilters(prev => ({
...prev,
minPrice: newMin
}));
}
}}
className="absolute w-full appearance-none bg-transparent z-10
[&::-webkit-slider-thumb]:appearance-none
[&::-webkit-slider-thumb]:h-6
[&::-webkit-slider-thumb]:w-6
[&::-webkit-slider-thumb]:rounded-full
[&::-webkit-slider-thumb]:bg-[#091D35]
cursor-pointer"
          />
          
{/* max slider */}
<input
type="range"
min={PRICE_MIN}
max={PRICE_MAX}
step="10000"
value={filters.maxPrice}
onChange={(e)=>{
const newMax = Number(e.target.value);

if (newMax > filters.minPrice) {
setFilters(prev => ({
...prev,
maxPrice: newMax
}));
}
}}
className="absolute w-full appearance-none bg-transparent z-20
[&::-webkit-slider-thumb]:appearance-none
[&::-webkit-slider-thumb]:h-5
[&::-webkit-slider-thumb]:w-5
[&::-webkit-slider-thumb]:rounded-full
[&::-webkit-slider-thumb]:bg-[#091D35]
cursor-pointer"
/>

</div>


</div>


      {/* ACTIONS */}
     <div className="sticky bottom-0 bg-white pt-4 flex gap-3">

<button
onClick={handleReset}
className="flex-1 rounded-full border py-2.5 text-sm font-medium hover:border-red-500 transition"
>
Reset Filters
</button>

<button
onClick={handleApply}
className="flex-1 rounded-full bg-[#091D35] text-white py-2.5 text-sm font-semibold hover:bg-[#0c2a4d] transition"
>
Apply Filters
</button>

</div>

    </div>
  );
}