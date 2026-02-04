"use client";

import { useState } from "react";
import Link from "next/link";

const regions = [
  {
    name: "Halifax Region",
    image:
      "https://images.unsplash.com/photo-1650073475221-042960a60883?auto=format&fit=crop&w=1600&q=80",
    tag: "Urban & Waterfront Living",
  },
  {
    name: "South Shore",
    image:
      "https://images.unsplash.com/photo-1688307193832-a6f711942705?auto=format&fit=crop&w=1600&q=80",
    tag: "Coastal & Historic Towns",
  },
  {
    name: "Annapolis Valley",
    image:
      "https://images.unsplash.com/photo-1645406310264-de3fd67ae341?auto=format&fit=crop&w=1600&q=80",
    tag: "Nature & Vineyards",
  },
  { name: "Cape Breton", tag: "Scenic & Affordable Living" },
 {
    name: "Northern Nova Scotia",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80",
    tag: "Rural Communities & Ocean Views",
  },
  {
    name: "Eastern Shore",
    image:
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1600&q=80",
    tag: "Beachside Living & Nature",
  },
 
];

export default function Regions() {
  const [activeCity, setActiveCity] = useState(regions[0]);

  return (
   <section className="relative overflow-hidden py-60">


      {/* BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 bg-contain bg-center transition-all duration-700"
        style={{
          backgroundImage: `url(${
            activeCity.image ||
            "https://images.unsplash.com/photo-1650073475221-042960a60883?auto=format&fit=crop&w=1600&q=80"
          })`,
        }}
      />

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/70" />

      {/* CONTENT */}
      <div className="relative mx-auto grid max-w-[1600px] grid-cols-1 gap-16 px-6 lg:grid-cols-2">

        {/* LEFT CONTENT */}
        <div>
          <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Browse by Region
          </span>

          <h2 className="mt-4 text-4xl font-extrabold text-[#091D35]">
            Explore Regions Across Nova Scotia
                  </h2>
                   <div className="mt-4 h-[3px] w-24 bg-red-600" />

          <p className="mt-6 max-w-md text-lg text-gray-600">
            Discover homes across Nova Scotia’s most desirable cities and
            neighbourhoods — from waterfront living to family-friendly suburbs.
          </p>

          <Link
            href="/buy"
            className="inline-block mt-10 rounded-full bg-red-600 px-8 py-4 text-sm font-semibold tracking-wide text-white transition hover:bg-red-700"
          >
            View All Listings
          </Link>
        </div>

        {/* RIGHT GRID */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {regions.map((city) => (
            <div
              key={city.name}
              onMouseEnter={() => setActiveCity(city)}
              className="group cursor-pointer rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-md font-semibold text-[#091D35]">
                  {city.name}
                </h4>
                <span className="text-gray-400 transition group-hover:text-red-600">
                  →
                </span>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                {city.tag}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
