"use client";
import { MapPin, Share2 } from "lucide-react";

export default function PropertyHeader({ listing }) {
  if (!listing) return null;

  return (
    <section className="bg-white border-b">
      <div className="max-w-[1400px] mx-auto px-6 pt-14 pb-12">

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">

          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-[#0A1F44]">
              {listing.UnparsedAddress || "Property Address"}
            </h1>

            <div className="mt-2 flex items-center gap-2 text-gray-600">
              <MapPin size={16} />
              <span>
                {listing.City}, {listing.StateOrProvince} {listing.PostalCode}
              </span>
            </div>

            <p className="mt-6 text-3xl font-bold text-[#0A1F44]">
              ${Number(listing.ListPrice).toLocaleString()}
            </p>

            <div className="mt-3 h-[3px] w-16 bg-red-600 rounded-full" />
          </div>

          <button className="flex items-center gap-2 rounded-full border px-5 py-2 text-sm">
            <Share2 size={16} />
            Share
          </button>
        </div>

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-10">
          <Stat label="Beds" value={listing.BedroomsTotal ?? "—"} />
          <Stat label="Baths" value={listing.BathroomsTotalInteger ?? "—"} />
          <Stat label="Size" value={`${listing.LotSizeAcres ?? "—"} Acres`} />
          <Stat label="Type" value={listing.PropertyType ?? "—"} />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#0A1F44]">{value}</p>
    </div>
  );
}
