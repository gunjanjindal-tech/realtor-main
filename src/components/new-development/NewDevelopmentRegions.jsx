"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const REGIONS = [
  { city: "Halifax", image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=1600" },
  { city: "Dartmouth", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80" },
  { city: "Bedford", image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80" },
  { city: "Lower Sackville", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80" },
  { city: "Cole Harbour", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80" },
  { city: "Wolfville", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&q=80" },
  { city: "Kentville", image: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1600&q=80" },
  { city: "Lunenburg", image: "https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=1600&q=80" },
  { city: "Chester", image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600&q=80" },
  { city: "Bridgewater", image: "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600" },
  { city: "Yarmouth", image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1600" },
  { city: "Antigonish", image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=1600" },
];

export default function NewDevelopmentRegions() {
  const router = useRouter();
  const [active, setActive] = useState(REGIONS[0]);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch("/api/bridge/new-development-counts");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setCounts(data);
      } catch (e) {
        console.log("Counts fallback");
        setCounts({});
      }
    }
    fetchCounts();
  }, []);

  return (
    <section className="bg-white py-24">
      <div className="max-w-[1600px] mx-auto px-6">

        {/* HEADING */}
        <div className="mb-14 max-w-xl">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#091D35]">
            Our Regions
          </h2>
          <div className="mt-4 h-[3px] w-20 bg-red-600" />
          <p className="mt-5 text-gray-600">
            Explore new developments across Nova Scotia communities.
          </p>
        </div>

        {/* SAME DESKTOP UI */}
        <div className="hidden lg:grid lg:grid-cols-[420px_1fr] gap-16 items-start">

          {/* LEFT BIG PREVIEW */}
          <div>
            <div className="relative h-[480px] rounded-3xl overflow-hidden shadow-xl">
              <img
                src={active.image}
                alt={active.city}
                className="absolute inset-0 w-full h-full object-cover transition duration-500"
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute bottom-6 left-6 text-white">
                <p className="text-sm uppercase tracking-widest opacity-80">
                  Explore
                </p>
                <h3 className="text-2xl font-bold">{active.city}</h3>
                <p className="text-sm opacity-80">
                  {counts[active.city] || 0} New Developments
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT GRID */}
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
            {REGIONS.map((region) => (
              <button
                key={region.city}
                onMouseEnter={() => setActive(region)}
                onClick={() => router.push(`/new-development?city=${region.city}`)}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6
                           transition-all duration-300 hover:-translate-y-1 hover:border-red-500 hover:shadow-xl"
              >
                <div className="relative flex items-center justify-between">
                  <span className="font-semibold text-[#091D35] group-hover:text-red-600">
                    {region.city}
                  </span>
                  <span className="group-hover:translate-x-1 transition">→</span>
                </div>

                <p className="mt-2 text-sm font-medium text-red-600 text-left">
                  {counts[region.city] || 0} New Developments
                </p>
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
