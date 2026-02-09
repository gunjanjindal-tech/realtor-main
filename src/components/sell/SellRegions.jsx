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
  { city: "Bridgewater", image: "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600&auto=format&fit=crop" },
  { city: "Yarmouth", image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1600&auto=format&fit=crop" },
  { city: "Antigonish", image:  "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=1600&auto=format&fit=crop" },
];

export default function SellRegions() {
  const router = useRouter();
  const [activeBg, setActiveBg] = useState("");
  const [counts, setCounts] = useState({});

  useEffect(() => {
    fetch("/api/bridge/regions")
      .then((res) => res.json())
      .then(setCounts)
      .catch(console.error);
  }, []);

  return (
    <section
      className="relative py-28 transition-all duration-500 bg-gray-400"
      style={{
        backgroundImage: activeBg ? `url(${activeBg})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/70" />

      <div className="relative max-w-[1600px] mx-auto px-6 grid lg:grid-cols-2 gap-16">
        
        {/* LEFT */}
        <div>
          <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Locations
          </span>

          <h2 className="mt-3 text-4xl md:text-5xl font-extrabold text-[#091D35]">
            Our Regions
          </h2>

          <div className="mt-4 h-[3px] w-20 bg-red-600" />

          <p className="mt-6 text-lg text-gray-600 max-w-md">
            List your property in Nova Scotia's most desirable communities.
          </p>
        </div>

        {/* RIGHT */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {REGIONS.map((region) => (
            <button
              key={region.city}
              onMouseEnter={() => setActiveBg(region.image)}
              onMouseLeave={() => setActiveBg("")}
              onClick={() => router.push(`/sell?city=${region.city}`)}
              className="group rounded-xl bg-white px-6 py-6 border border-gray-200 hover:bg-[#091D35] transition text-left"
            >
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold group-hover:text-white">
                  {region.city}
                </span>
                <span className="group-hover:text-white">→</span>
              </div>

              <p className="mt-2 text-sm text-red-600 group-hover:text-white/70">
                {counts[region.city] || 0} Listings
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}




