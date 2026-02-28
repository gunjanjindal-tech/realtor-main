"use client";

export default function PropertyMap({ listing, lat, lng }) {
  // Get coordinates from listing or props, fallback to Halifax
  const latitude = lat ?? listing?.Latitude ?? listing?.LatitudeDecimal ?? 44.6488;
  const longitude = lng ?? listing?.Longitude ?? listing?.LongitudeDecimal ?? -63.5752;
  const hasCoords = listing?.Latitude != null || listing?.LatitudeDecimal != null || lat != null;

  // Zoom 17 = street/block level so "agal bagal" (surrounding streets, buildings) dikhein
  const zoom = 17;
  const mapQuery = hasCoords ? `${latitude},${longitude}` : (listing?.UnparsedAddress || listing?.City || "Halifax, NS");
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=${zoom}&output=embed`;

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
            src={mapSrc}
            className="h-[420px] w-full border-0 md:h-[520px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

      </div>
    </section>
  );
}
