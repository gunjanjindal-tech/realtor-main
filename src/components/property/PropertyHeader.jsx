"use client";

import { MapPin, Share2 } from "lucide-react";


export default function PropertyHeader({ listing }) {
  if (!listing) return null;

  const handleShare = async () => {
    const shareData = {
      title: listing.UnparsedAddress || "Property Listing",
      text: "Check out this property",
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard");
    }
  };

  return (
    <section className="bg-white border-b">
      <div className="max-w-[1400px] mx-auto pt-12 pb-6">


        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
        
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0A1F44] leading-tight">
              {listing.UnparsedAddress || "Property Address"}
            </h1>

            <div className="mt-2 flex items-center gap-2 text-gray-600">
              <MapPin size={16} />
              <span>
                {listing.City}, {listing.StateOrProvince} {listing.PostalCode}
              </span>
            </div>

            <p className="mt-6 text-2xl font-bold text-[#0A1F44]">
              ${Number(listing.ListPrice).toLocaleString()}
            </p>

            <div className="mt-3 h-[3px] w-16 bg-red-600 rounded-full" />
          </div>

          {/* 🔥 SHARE BUTTON WITH HOVER */}
          <button
            onClick={handleShare}
            className="
              flex items-center gap-2
              rounded-full border
              px-5 py-2 text-sm
              cursor-pointer
              text-[#0A1F44]
              hover:bg-[#0A1F44]
              hover:text-white
              transition-colors duration-200
            "
          >
            <Share2 size={16} />
            Share
          </button>
        </div>

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-10">
          <Stat label="Beds" value={listing.BedroomsTotal ?? "—"} />
          <Stat label="Baths" value={listing.BathroomsTotalInteger ?? "—"} />
          <Stat
            label="Size"
            value={`${listing.LotSizeAcres ?? "—"} Acres`}
          />
          <Stat label="Type" value={listing.PropertyType ?? "—"} />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-[#0A1F44]">
        {value}
      </p>
    </div>
  );
}