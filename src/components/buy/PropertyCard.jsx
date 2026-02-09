import Link from "next/link";
import Image from "next/image";

export default function PropertyCard({ listing, showNewDevelopmentBadge = false, listingType = "sale" }) {
  const image = listing.Image || "/images/placeholder.jpg";
  const isExternal = image.startsWith("http");
  
  // Check if it's a new development (built in last 5 years)
  const currentYear = new Date().getFullYear();
  const isNewDevelopment = showNewDevelopmentBadge || 
    (listing.YearBuilt && listing.YearBuilt >= currentYear - 5);

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
        href={`/buy/${citySlug}/${listingId}`}
        className="group rounded-2xl overflow-hidden bg-white border hover:shadow-2xl transition block"
      >
      {/* IMAGE */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Image
          src={image}
          alt={listing.UnparsedAddress || "Property"}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition"
          unoptimized={isExternal && !image.includes("images.unsplash.com")}
        />

        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className="bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            {listingType === "rent" ? "For Rent" : "For Sale"}
          </span>
          {isNewDevelopment && (
            <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              New Development
            </span>
          )}
        </div>
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
          {listing.City}, {listing.Province || province}
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
    </>
  );
}
