"use client";

import { useState } from "react";

export default function PropertyContent({ property }) {
  const [expanded, setExpanded] = useState(false);

  const data = property || {
    description:
      "Discover a rare opportunity to shape a premier residential community in one of the area's most sought-after and fast-growing regions. This expansive land offering delivers privacy, natural beauty, and long-term investment potential.",
    overview: {
      "Property Type": "Land",
      Location: "3400 Biggers Road, Concord, NC",
      Zoning: "AO",
      "MLS ID": "4321783",
      "Lot Size": "138 Acres",
      "Last Updated": "11/19/2025",
    },
    features: {
      Exterior: [
        "River Front",
        "Cleared Pasture",
        "Private Access",
        "Wooded Areas",
      ],
      Utilities: ["Well", "Septic Installed"],
      Other: ["Livestock Run-In", "Fenced Sections"],
    },
    financials: {
      Price: "$5,000,000",
      Taxes: "—",
      HOA: "None",
    },
  };

  return (
    <div className="space-y-20">

      {/* PROPERTY DESCRIPTION — DARK */}
      <section className="max-w-[1000px]">
        <div className="rounded-3xl bg-[#0A1F44] px-12 py-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Property Description
          </h2>
          <div className="mt-2 h-[3px] w-16 bg-red-600 rounded-full" />

          <p
            className={`mt-6 text-white/90 leading-relaxed ${
              expanded ? "" : "line-clamp-4"
            }`}
          >
            {data.description}
          </p>

          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-4 text-sm font-semibold text-white hover:underline"
          >
            {expanded ? "Read Less" : "Read More"}
          </button>
        </div>
      </section>

      {/* OVERVIEW — WHITE BOXES */}
      <section className="max-w-[1200px]">
        <SectionTitle title="Overview" />

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(data.overview).map(([key, value]) => (
            <div
              key={key}
              className="rounded-2xl border border-gray-200 bg-white px-8 py-7
                         transition-all duration-300
                         hover:-translate-y-[2px] hover:shadow-lg"
            >
              <p className="text-[11px] uppercase tracking-widest text-gray-500">
                {key}
              </p>
              <p className="mt-2 text-sm font-semibold text-[#091D35]">
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES & AMENITIES — DARK */}
      <section className="max-w-[1200px]">
        <SectionTitle title="Features & Amenities" />

        <div className="mt-12 grid md:grid-cols-2 gap-8">
          {Object.entries(data.features).map(([group, items]) => (
            <div
              key={group}
              className="rounded-2xl bg-[#0A1F44] px-10 py-9
                         transition-all duration-300
                         hover:-translate-y-[2px] hover:shadow-xl"
            >
              <h4 className="text-sm font-bold tracking-widest uppercase text-white/70">
                {group}
              </h4>

              <ul className="mt-6 space-y-3 text-sm text-white">
                {items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-[7px] h-[4px] w-[4px] rounded-full bg-white/60" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FINANCIALS — WHITE BOXES */}
      <section className="max-w-[900px]">
        <SectionTitle title="Financials" />

        <div className="mt-10 grid sm:grid-cols-2 gap-6">
          {Object.entries(data.financials).map(([key, value]) => (
            <div
              key={key}
              className="rounded-2xl border border-gray-200 bg-white px-8 py-7
                         transition-all duration-300
                         hover:-translate-y-[2px] hover:shadow-lg"
            >
              <p className="text-[11px] uppercase tracking-widest text-gray-500">
                {key}
              </p>
              <p className="mt-2 text-sm font-semibold text-[#091D35]">
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

/* ---------------- HELPERS ---------------- */

function SectionTitle({ title }) {
  return (
    <>
      <h2 className="text-2xl md:text-3xl font-extrabold text-[#091D35]">
        {title}
      </h2>
      <div className="mt-2 h-[3px] w-16 bg-red-600 rounded-full" />
    </>
  );
}