"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function NewDevelopmentRegions() {
  const router = useRouter();
  const [active, setActive] = useState(REGIONS[0]);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    fetch("/api/bridge/new-development-counts")
      .then((res) => {
        if (!res.ok) return {};
        return res.json();
      })
      .then(setCounts)
      .catch(() => setCounts({}));
  }, []);

  const handleSelect = (city) => {
    router.push(`/new-development/${city.toLowerCase().replace(/\s+/g, "-")}`);
  };

  return (
   <section className="bg-white py-20">
      <div className="mx-auto max-w-[1600px] px-6">


        {/* ================= HEADING ================= */}
        <div className="mb-12 max-w-xl">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#091D35]">
            Our Regions
          </h2>
          <div className="mt-3 h-[3px] w-20 bg-red-600" />
          <p className="mt-5 text-gray-600">
            Explore homes by location across Nova Scotia.
          </p>
        </div>

        {/* ================= MOBILE VIEW ================= */}
        <div className="lg:hidden -mx-6 px-6">
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {REGIONS.map((region) => (
              <button
                key={region.name}
                onClick={() => handleSelect(region.name)}
                className="snap-start min-w-[260px] rounded-2xl overflow-hidden bg-white border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-44">
                  <img
                    src={region.image}
                    alt={region.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/35" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-lg font-semibold">{region.name}</h3>
                    <p className="text-xs opacity-80 flex items-center gap-1">
                      View Homes
                      <span>→</span>
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ================= DESKTOP VIEW ================= */}
        <div className="hidden lg:grid lg:grid-cols-[420px_1fr] gap-16 items-start">
          {/* LEFT PREVIEW */}
          <div>
            <div className="relative h-[480px] rounded-3xl overflow-hidden shadow-xl">
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {REGIONS.map((region) => (
              <button
                key={region.name}
                onMouseEnter={() => setActive(region)}
                onClick={() => handleSelect(region.name)}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-red-500 hover:shadow-xl sm:min-w-0"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-50 via-white to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative flex items-center justify-between">
                  <span className="font-semibold text-[#091D35] group-hover:text-red-600">
                    {region.name}
                  </span>
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>

                <p className="relative mt-2 text-sm font-medium text-red-600 text-left">
                  View Homes
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
