"use client";

import { useEffect, useRef, useState } from "react";
import PropertyCard from "../buy/PropertyCard";

export default function FeaturedProperties({ city }) {
  const topRef = useRef(null);

  const [page, setPage] = useState(1);
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const limit = 9;

  /* ---------------- FETCH LISTINGS ---------------- */
  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/bridge/new-development?page=${page}&limit=${limit}${
            city ? `&city=${city}` : ""
          }`
        );

        if (!res.ok) {
          setListings([]);
          setTotal(0);
          return;
        }

        const data = await res.json();
        setListings(data.listings || data.bundle || []);
        setTotal(data.total || 0);
      } catch (err) {
        setListings([]);
        setTotal(0);
      } finally {
        setLoading(false);
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
          <div className="flex items-end justify-between">
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-[#091D35]">
              New Developments
            </h2>

            <span className="text-sm text-gray-500">
              {loading ? "Loading..." : `Showing ${listings.length} of ${total}`}
            </span>
          </div>

          <div className="mt-4 h-[3px] w-20 bg-red-600 rounded-full" />
        </div>

        {/* GRID */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">
            Loading new developments...
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No new developments found
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {listings.map((listing) => (
                <PropertyCard
                  key={listing.ListingId || listing.Id}
                  listing={listing}
                  listingType="newDevelopment"
                />
              ))}
            </div>

            {/* 🔥 BUY STYLE PAGINATION (SAME AS BUY PAGE) */}
            {totalPages > 1 && (
              <div className="mt-14 flex justify-center items-center gap-2 sm:gap-3">

                {/* PREV */}
                <button
                  disabled={page === 1}
                  onClick={() => {
                    setPage((p) => p - 1);
                    scrollToTop();
                  }}
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border disabled:opacity-40"
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
                    className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full text-sm sm:text-base font-medium ${
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
                  onClick={() => {
                    setPage((p) => p + 1);
                    scrollToTop();
                  }}
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border disabled:opacity-40"
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}