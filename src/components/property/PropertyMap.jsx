"use client";

export default function PropertyMap({ listing, lat, lng }) {
  // Get coordinates from listing or props, fallback to Halifax
  const latitude = lat || listing?.Latitude || listing?.LatitudeDecimal || 44.6488;
  const longitude = lng || listing?.Longitude || listing?.LongitudeDecimal || -63.5752;
  
  // If we have address but no coordinates, we could geocode it, but for now use fallback
  const address = listing?.UnparsedAddress || listing?.City || "Halifax, NS";

  return (
    <section className="bg-[#F7F9FC] py-24">
      <div className="max-w-[1600px] mx-auto px-6">

        {/* HEADER */}
        <div className="mb-12 max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Location
          </span>

          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-[#091D35]">
            Explore the Neighborhood
          </h2>

          <div className="mt-4 h-[3px] w-24 bg-red-600 rounded-full" />

          <p className="mt-6 text-gray-600">
            Get a feel for the surrounding area, nearby amenities, and
            neighborhood accessibility.
          </p>
        </div>

        {/* MAP */}
        <div className="relative overflow-hidden rounded-3xl shadow-2xl">
          <iframe
            title="Property Location"
            src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&z=14&output=embed`}
            className="h-[420px] w-full border-0 md:h-[520px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

      </div>
    </section>
  );
}
