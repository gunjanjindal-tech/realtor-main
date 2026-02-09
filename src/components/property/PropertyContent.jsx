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

  // Interior from API (InteriorFeatures, Appliances, FireplaceFeatures) + fallback
  const interiorFromApi = [
    ...(Array.isArray(property?.InteriorFeatures) ? property.InteriorFeatures : []),
    ...(Array.isArray(property?.Appliances) ? property.Appliances : []),
    ...(Array.isArray(property?.FireplaceFeatures) ? property.FireplaceFeatures : []),
  ].filter(Boolean);
  const interiorItems = interiorFromApi.length > 0
    ? interiorFromApi
    : [
        property?.BedroomsTotal && `${property.BedroomsTotal} Bedrooms`,
        property?.BathroomsTotalInteger && `${property.BathroomsTotalInteger} Bathrooms`,
        property?.BuildingAreaTotal && `${property.BuildingAreaTotal.toLocaleString()} sq ft`,
      ].filter(Boolean);

  // Exterior from API (ExteriorFeatures, LotFeatures, CommunityFeatures) + fallback
  const exteriorFromApi = [
    ...(Array.isArray(property?.ExteriorFeatures) ? property.ExteriorFeatures : []),
    ...(Array.isArray(property?.LotFeatures) ? property.LotFeatures : []),
    ...(Array.isArray(property?.CommunityFeatures) ? property.CommunityFeatures : []),
  ].filter(Boolean);
  const exteriorItems = exteriorFromApi.length > 0
    ? exteriorFromApi
    : [
        property?.LotSizeAcres && `${property.LotSizeAcres} Acres`,
        property?.PropertyType && property.PropertyType,
      ].filter(Boolean);

  // Amenities: from API (Amenities array) or combined interior + exterior
  const amenitiesList = Array.isArray(property?.Amenities) && property.Amenities.length > 0
    ? property.Amenities
    : [...interiorItems, ...exteriorItems].filter(Boolean);

  // Sale / price history from API
  const saleHistoryRows = property?.SaleHistory ?? [];
  const historyArray = Array.isArray(property?.History) ? property.History : [];
  const hasSaleHistory = saleHistoryRows.length > 0 || historyArray.length > 0;

  const formatPrice = (v) => {
    if (v == null || v === "") return "—";
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    return `$${n.toLocaleString()}`;
  };
  const formatDate = (v) => (v == null || v === "" ? "—" : String(v));

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

      {/* PROPERTY HISTORY — always show; table when API has data, else message */}
      <section className="max-w-[1200px]">
        <SectionTitle title="Property History" />
        {hasSaleHistory ? (
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-[#091D35]">Event</th>
                    <th className="text-left py-4 px-6 font-semibold text-[#091D35]">Date / Price</th>
                  </tr>
                </thead>
                <tbody>
                  {saleHistoryRows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="py-4 px-6 text-gray-600">{row.label}</td>
                      <td className="py-4 px-6 font-semibold text-[#091D35]">
                        {typeof row.value === "number" && row.label?.toLowerCase?.().includes("price")
                          ? formatPrice(row.value)
                          : row.label?.toLowerCase?.().includes("date")
                            ? formatDate(row.value)
                            : String(row.value ?? "—")}
                      </td>
                    </tr>
                  ))}
                  {historyArray.map((h, i) => (
                    <tr key={`hist-${i}`} className="border-b border-gray-100 last:border-0">
                      <td className="py-4 px-6 text-gray-600">
                        {h.EventType || (h.CloseDate ? "Close date" : "Sale")}
                      </td>
                      <td className="py-4 px-6 font-semibold text-[#091D35]">
                        {h.ClosePrice != null ? formatPrice(h.ClosePrice) : (h.CloseDate ? formatDate(h.CloseDate) : formatDate(h.Date) ?? "—")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 px-8 py-10 text-center">
            <p className="text-gray-600">
              Property sale history is not available for this listing from the MLS.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              When the MLS provides sale history (e.g. past sale price and date), it will appear here.
            </p>
          </div>
        )}
      </section>

      {/* INTERIOR & EXTERIOR — from API */}
      {(interiorItems.length > 0 || exteriorItems.length > 0) && (
        <section className="max-w-[1200px]">
          <SectionTitle title="Interior & Exterior" />
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            {interiorItems.length > 0 && (
              <div className="rounded-2xl bg-[#0A1F44] px-10 py-9">
                <h4 className="text-sm font-bold tracking-widest uppercase text-white/70">Interior</h4>
                <ul className="mt-6 space-y-3 text-sm text-white">
                  {interiorItems.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-[7px] h-[4px] w-[4px] rounded-full bg-white/60 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {exteriorItems.length > 0 && (
              <div className="rounded-2xl bg-[#0A1F44] px-10 py-9">
                <h4 className="text-sm font-bold tracking-widest uppercase text-white/70">Exterior</h4>
                <ul className="mt-6 space-y-3 text-sm text-white">
                  {exteriorItems.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-[7px] h-[4px] w-[4px] rounded-full bg-white/60 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* AMENITIES — from API or combined interior + exterior */}
      {amenitiesList.length > 0 && (
        <section className="max-w-[1200px]">
          <SectionTitle title="Amenities" />
          <div className="mt-10 rounded-2xl bg-[#0A1F44] px-10 py-9">
            <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-white">
              {amenitiesList.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-[4px] w-[4px] rounded-full bg-white/60 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

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