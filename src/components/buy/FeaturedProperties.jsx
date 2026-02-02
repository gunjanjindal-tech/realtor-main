"use client";

import { useEffect, useRef, useState } from "react";
import PropertyCard from "./PropertyCard";

export default function FeaturedProperties({ city }) {
  const topRef = useRef(null);

  const [page, setPage] = useState(1);
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);

  const limit = 9;

  /* ---------------- FETCH LISTINGS ---------------- */
  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch(
          `/api/bridge/buy?page=${page}&limit=${limit}${
            city ? `&city=${city}` : ""
          }`
        );

        const data = await res.json();

        setListings(data.listings || data.bundle || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error("Failed to fetch listings", err);
      }
    }

    fetchListings();
  }, [page, city]);

  const totalPages = Math.ceil(total / limit);

  /* ---------------- SCROLL CONTROL ---------------- */
  const scrollToTop = () => {
    topRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  /* ---------------- PAGINATION RANGE ---------------- */
  const maxButtons = 5;
  const startPage = Math.max(1, page - Math.floor(maxButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);

  return (
    <section ref={topRef} className="bg-white py-24">
      <div className="max-w-[1600px] mx-auto px-6">
        {/* HEADER */}
       <div className="mb-14">
  {/* TOP ROW */}
  <div className="flex items-end justify-between">
    <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-[#091D35]">
      Featured Properties
    </h2>

    <span className="text-sm text-gray-500">
      Showing {listings.length} of {total}
    </span>
  </div>

  {/* SIGNATURE LINE — under heading */}
  <div className="mt-4 h-[3px] w-25 bg-red-600 rounded-full" />
</div>

        {/* GRID */}
        {listings.length === 0 ? (
          <p className="text-gray-500">No properties found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {listings.map((item) => (
              <PropertyCard
                key={item.ListingId || item.Id}
                listing={item}
              />
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="mt-16 flex justify-center items-center gap-3">
            {/* PREV */}
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-12 w-12 rounded-full border disabled:opacity-40"
            >
              ←
            </button>

            {/* PAGE NUMBERS */}
            {Array.from(
              { length: endPage - startPage + 1 },
              (_, i) => startPage + i
            ).map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => {
                  setPage(pageNumber);
                  scrollToTop(); 
                }}
                className={`h-12 w-12 rounded-full font-medium ${
                  page === pageNumber
                    ? "bg-[#091D35] text-white"
                    : "border hover:bg-gray-100"
                }`}
              >
                {pageNumber}
              </button>
            ))}

            {/* NEXT */}
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-12 w-12 rounded-full border disabled:opacity-40"
            >
              →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
