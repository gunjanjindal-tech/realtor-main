"use client";

import { useState } from "react";

export default function PropertyContent({ property }) {
  const [expanded, setExpanded] = useState(false);

  // Use property data if available, otherwise use fallback
  const description = property?.Description || 
    property?.PublicRemarks || 
    property?.Remarks || 
    property?.LongDescription ||
    "Discover a rare opportunity in one of the area's most sought-after and fast-growing regions. This property delivers privacy, natural beauty, and long-term investment potential.";

  const overview = {
    "Property Type": property?.PropertyType || property?.PropertySubType || "—",
    Location: property?.UnparsedAddress || "—",
    "MLS ID": property?.ListingId || property?.Id || "—",
    "Lot Size": property?.LotSizeAcres ? `${property.LotSizeAcres} Acres` : 
                property?.LotSizeSquareFeet ? `${property.LotSizeSquareFeet} sq ft` : "—",
    "Year Built": property?.YearBuilt || "—",
    "Square Feet": property?.BuildingAreaTotal || property?.LivingArea ? 
                   `${(property.BuildingAreaTotal || property.LivingArea).toLocaleString()} sq ft` : "—",
  };

  const features = {
    Interior: [
      property?.BedroomsTotal && `${property.BedroomsTotal} Bedrooms`,
      property?.BathroomsTotalInteger && `${property.BathroomsTotalInteger} Bathrooms`,
      property?.BuildingAreaTotal && `${property.BuildingAreaTotal.toLocaleString()} sq ft`,
    ].filter(Boolean),
    Exterior: [
      property?.LotSizeAcres && `${property.LotSizeAcres} Acres`,
      property?.PropertyType && property.PropertyType,
    ].filter(Boolean),
  };

  const financials = {
    Price: property?.ListPrice ? `$${Number(property.ListPrice).toLocaleString()}` : "—",
    "Price per sq ft": property?.ListPrice && property?.BuildingAreaTotal ? 
                      `$${Math.round(property.ListPrice / property.BuildingAreaTotal).toLocaleString()}` : "—",
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
            {description}
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
          {Object.entries(overview).map(([key, value]) => (
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
          {Object.entries(features).map(([group, items]) => (
            items.length > 0 && (
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
          )))}
        </div>
      </section>

      {/* FINANCIALS — WHITE BOXES */}
      <section className="max-w-[900px]">
        <SectionTitle title="Financials" />

        <div className="mt-10 grid sm:grid-cols-2 gap-6">
          {Object.entries(financials).map(([key, value]) => (
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