"use client";

import PropertyCard from "./PropertyCard";

export default function PropertyGrid({ listings }) {
  return (
    <section className="py-20">
      <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {listings.map((item) => (
          <PropertyCard key={item.ListingId} listing={item} />
        ))}
      </div>
    </section>
  );
}
