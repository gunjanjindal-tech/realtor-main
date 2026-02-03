import Link from "next/link";

export default function PropertyCard({ listing }) {
  const image = listing.Image || "/images/placeholder.jpg";

  const sqft =
    listing.BuildingAreaTotal ||
    listing.LivingArea ||
    listing.AboveGradeFinishedArea;

  const pricePerSqFt =
    sqft && listing.ListPrice
      ? Math.round(listing.ListPrice / sqft)
      : null;

  const province =
    listing.StateOrProvince ||
    listing.ProvinceOrState ||
    "NS";

  // 🔑 CITY SLUG (IMPORTANT)
  const citySlug = encodeURIComponent(
    (listing.City || "nova-scotia")
      .toLowerCase()
      .replace(/\s+/g, "-")
  );

  const listingId = listing.ListingId;

  return (
    <Link
      href={`/buy/${citySlug}/${listingId}`}
      className="group rounded-2xl overflow-hidden bg-white border hover:shadow-2xl transition block"
    >
      {/* IMAGE */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={listing.UnparsedAddress}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-105 transition"
        />

        <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
          For Sale
        </span>
      </div>

      {/* CONTENT */}
      <div className="p-6">
        <p className="text-red-600 font-semibold text-lg">
          ${Number(listing.ListPrice).toLocaleString()}
        </p>

        <h3 className="mt-1 font-semibold text-[#091D35] line-clamp-2">
          {listing.UnparsedAddress}
        </h3>

        <p className="text-sm text-gray-600 mt-1">
          {listing.City}, {province}
        </p>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
          {listing.BedroomsTotal && <span>{listing.BedroomsTotal} Beds</span>}
          {listing.BathroomsTotalInteger && (
            <span>{listing.BathroomsTotalInteger} Baths</span>
          )}
          {sqft && <span>{Number(sqft).toLocaleString()} sq ft</span>}
          {pricePerSqFt && <span>${pricePerSqFt}/sq ft</span>}
        </div>
      </div>
    </Link>
  );
}
