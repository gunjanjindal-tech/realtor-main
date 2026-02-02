"use client";

import { useState } from "react";

const REGIONS = [
  { name: "Halifax", image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1600" },
  { name: "Dartmouth", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600" },
  { name: "Bedford", image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600" },
  { name: "Lower Sackville", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600" },
  { name: "Cole Harbour", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600" },
  { name: "Wolfville", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600" },
  { name: "Kentville", image: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1600" },
  { name: "Lunenburg", image: "https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=1600" },
  { name: "Chester", image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600" },
  { name: "Bridgewater", image: "https://images.unsplash.com/photo-1501183638710-841dd1904471?w=1600" },
  { name: "Yarmouth", image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1600" },
  { name: "Antigonish", image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1600" },
];

export default function BuyRegions({ onSelectCity }) {
  const [active, setActive] = useState(REGIONS[0]);

  return (
    <section className="py-24 bg-white">
      <div className="max-w-[1600px] mx-auto px-6 grid lg:grid-cols-[420px_1fr] gap-16">

        {/* LEFT */}
        <div>
          <h2 className="text-4xl font-extrabold text-[#091D35]">
            Our Regions
          </h2>

          <div className="mt-4 h-[3px] w-20 bg-red-600" />

          <p className="mt-6 text-gray-600 max-w-sm">
            Explore homes by location across Nova Scotia. Hover to preview,
            click to view listings.
          </p>

          {/* IMAGE PREVIEW */}
          <div className="mt-10 hidden lg:block relative h-[320px] rounded-3xl overflow-hidden shadow-xl">
            <img
              src={active.image}
              alt={active.name}
              className="absolute inset-0 w-full h-full object-cover transition duration-500"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-6 left-6 text-white">
              <p className="text-sm uppercase tracking-widest opacity-80">
                Explore
              </p>
              <h3 className="text-2xl font-bold">{active.name}</h3>
            </div>
          </div>
        </div>

        {/* RIGHT GRID */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {REGIONS.map((region) => (
            <button
              key={region.name}
              onMouseEnter={() => setActive(region)}
              onClick={() => onSelectCity(region.name)}
              className="
                group rounded-xl border border-gray-200 bg-white p-5 text-left
                hover:border-[#091D35] hover:shadow-lg transition
              "
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#091D35]">
                  {region.name}
                </span>
                <span className="group-hover:translate-x-1 transition">
                  →
                </span>
              </div>

              <p className="mt-2 text-sm text-red-600">
                View Homes
              </p>
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}
