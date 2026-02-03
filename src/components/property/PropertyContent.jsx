"use client";

import { useState } from "react";

export default function PropertyContent({ property }) {
  const [expanded, setExpanded] = useState(false);

  // TEMP MOCK — replace with API data later
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

      {/* DESCRIPTION */}
      <section>
        <SectionTitle title="Property Description" />

        <p className={`mt-6 text-gray-700 leading-relaxed max-w-3xl ${
          expanded ? "" : "line-clamp-4"
        }`}>
          {data.description}
        </p>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-sm font-semibold text-[#091D35] hover:underline"
        >
          {expanded ? "Read Less" : "Read More"}
        </button>
      </section>

      {/* OVERVIEW */}
      <section>
        <SectionTitle title="Overview" />

        <div className="mt-6 grid sm:grid-cols-2 gap-x-12 gap-y-6">
          {Object.entries(data.overview).map(([key, value]) => (
            <KeyValue key={key} label={key} value={value} />
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <SectionTitle title="Features & Amenities" />

        <div className="mt-6 grid md:grid-cols-2 gap-10">
          {Object.entries(data.features).map(([group, items]) => (
            <div key={group}>
              <h4 className="text-lg font-semibold text-[#091D35]">
                {group}
              </h4>

              <ul className="mt-4 space-y-2 text-gray-700 text-sm">
                {items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FINANCIALS */}
      <section>
        <SectionTitle title="Financials" />

        <div className="mt-6 grid sm:grid-cols-2 gap-x-12 gap-y-6">
          {Object.entries(data.financials).map(([key, value]) => (
            <KeyValue key={key} label={key} value={value} />
          ))}
        </div>
      </section>

    </div>
  );
}

/* ---------------- REUSABLE UI ---------------- */

function SectionTitle({ title }) {
  return (
    <>
      <h2 className="text-2xl md:text-3xl font-extrabold text-[#091D35]">
        {title}
      </h2>
      <div className="mt-3 h-[3px] w-20 bg-red-600 rounded-full" />
    </>
  );
}

function KeyValue({ label, value }) {
  return (
    <div className="border-b pb-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[#091D35]">
        {value}
      </p>
    </div>
  );
}
