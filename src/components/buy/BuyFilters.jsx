"use client";

export default function BuyFilters() {
  return (
    <div className="space-y-8">
      
      {/* BEDS */}
      <div>
        <p className="text-sm font-semibold text-[#091D35] mb-3">Beds</p>
        <div className="grid grid-cols-3 gap-2">
          {["Any", "1+", "2+", "3+", "4+", "5+"].map((b) => (
            <button
              key={b}
              className="rounded-xl border py-2 text-sm hover:border-[#091D35] hover:bg-[#091D35]/5 transition"
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* BATHS */}
      <div>
        <p className="text-sm font-semibold text-[#091D35] mb-3">Baths</p>
        <div className="grid grid-cols-3 gap-2">
          {["Any", "1+", "2+", "3+", "4+", "5+"].map((b) => (
            <button
              key={b}
              className="rounded-xl border py-2 text-sm hover:border-[#091D35] hover:bg-[#091D35]/5 transition"
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* PRICE */}
      <div>
        <p className="text-sm font-semibold text-[#091D35] mb-3">
          Price Range
        </p>
        <input type="range" className="w-full accent-[#091D35]" />
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 pt-4">
        <button className="flex-1 rounded-full border py-2 text-sm">
          Reset
        </button>
        <button className="flex-1 rounded-full bg-[#091D35] text-white py-2 text-sm">
          Apply Filters
        </button>
      </div>
    </div>
  );
}
