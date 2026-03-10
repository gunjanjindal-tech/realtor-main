import Link from "next/link";
import Image from "next/image";

export default function PropertyCard({ listing, showNewDevelopmentBadge = false, listingType = "sale", priority = false }) {
  if (!listing) return null;
  const image = listing.Image || "/images/placeholder.jpg";
  const isExternal = image.startsWith("http");

  // Check if it's a new development (built in last 5 years)
  // Also check PropertySubType or other indicators
  const currentYear = new Date().getFullYear();
  const yearBuilt = listing.YearBuilt || listing.YearBuiltNum || listing.BuildingYearBuilt;
  const isNewDevelopmentByYear = yearBuilt && parseInt(yearBuilt) >= (currentYear - 5);
  const isNewDevelopmentByType = listing.PropertySubType &&
    (listing.PropertySubType.toLowerCase().includes('new') ||
      listing.PropertySubType.toLowerCase().includes('pre-construction') ||
      listing.PropertySubType.toLowerCase().includes('preconstruction'));
  const isNewDevelopment = showNewDevelopmentBadge || isNewDevelopmentByYear || isNewDevelopmentByType;

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
    listing.Province ||
    "NS";

  // 🔑 CITY SLUG (IMPORTANT)
  const citySlug = encodeURIComponent(
    (listing.City || "nova-scotia")
      .toLowerCase()
      .replace(/\s+/g, "-")
  );

  const listingId = listing.ListingId;

  // Determine base path based on listingType AND property data
  // If property is a new development (built in last 5 years), always use new-development URL
  // This ensures search results show correct URLs even if listingType is "sale"
  const isNewDevelopmentProperty = isNewDevelopment; // Already calculated above
  const basePath = isNewDevelopmentProperty
    ? "new-development"
    : (listingType === "newDevelopment" || listingType === "new-development")
      ? "new-development"
      : listingType === "rent"
        ? "rent"
        : "buy";

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: listing.UnparsedAddress,
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.City,
      addressRegion: province,
      addressCountry: "CA",
    },
    ...(sqft && {
      floorSize: {
        "@type": "QuantitativeValue",
        value: sqft,
        unitCode: "FTK",
      },
    }),
    offers: {
      "@type": "Offer",
      price: listing.ListPrice,
      priceCurrency: "CAD",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <Link
        href={`/${basePath}/${citySlug}/${listingId}`}
        className="group rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-2xl transition block"
        prefetch={true}
      >
        {/* IMAGE */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">

          <Image
            src={image}
            alt={listing.UnparsedAddress || "Property"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition"
            unoptimized={isExternal && !image.includes("images.unsplash.com")}
            priority={priority}
          />

          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {/* Only show "For Sale" or "For Rent" if it's NOT a new development */}
            {!isNewDevelopment && listingType !== "newDevelopment" && listingType !== "new-development" && (
              <span className="bg-[#091D35] text-white text-xs font-semibold px-3 py-1 rounded-full">
                {listingType === "rent" ? "For Rent" : "For Sale"}
              </span>
            )}
            {/* Show "New Development" badge if it's a new development */}
            {(listingType === "newDevelopment" || listingType === "new-development" || isNewDevelopment) && (
              <span className="bg-[#091D35] text-white text-xs font-semibold px-3 py-1 rounded-full">
                New Development
              </span>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-4">
          <p className="text-red-600 font-semibold text-lg">
            ${Number(listing.ListPrice).toLocaleString()}
          </p>

          <h3 className="mt-1 font-semibold text-[#091D35] line-clamp-2">
            {listing.UnparsedAddress}
          </h3>

          <p className="text-sm text-gray-600 mt-1">
            {listing.City}, {listing.Province || province}
          </p>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
            {listing.BedroomsTotal && <span>{listing.BedroomsTotal} Beds</span>}
            {listing.BathroomsTotalInteger && (
              <span>{listing.BathroomsTotalInteger} Baths</span>
            )}
            {sqft && <span>{Number(sqft).toLocaleString()} sq ft</span>}
            {pricePerSqFt && <span>{pricePerSqFt}/sq ft</span>}
          </div>
        </div>
      </Link>
    </>
  );
}
