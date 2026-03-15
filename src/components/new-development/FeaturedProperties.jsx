"use client";

import { useEffect, useRef, useState } from "react";
import PropertyCard from "../buy/PropertyCard";

export default function FeaturedProperties({ city, filters = {}, searchQuery = "", initialListings = null, externalLoading = false }) {
  const topRef = useRef(null);

  const [page, setPage] = useState(1);
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(9);

  /* ---------------- RESET PAGE WHEN FILTERS OR SEARCH CHANGE ---------------- */
  useEffect(() => {
    setPage(1);
  }, [filters.minPrice, filters.maxPrice, filters.minBeds, filters.minBaths, searchQuery, initialListings?.length]);

  /* ---------------- RESPONSIVE LIMIT ---------------- */
  useEffect(() => {
    // Let's use the same responsive limit logic as buy for consistency
    let timeout;
    function updateLimit() {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const width = window.innerWidth;
        if (width < 640) setLimit(6);
        else if (width < 1024) setLimit(8);
        else setLimit(9);
      }, 150);
    }
    updateLimit();
    window.addEventListener("resize", updateLimit);
    return () => window.removeEventListener("resize", updateLimit);
  }, []);

  /* ---------------- FETCH/LOAD LISTINGS ---------------- */
  useEffect(() => {
    // If initialListings is provided (even if empty), use it and skip fetch
    if (initialListings !== null) {
      setLoading(false);
      const start = (page - 1) * limit;
      setListings(initialListings.slice(start, start + limit));
      setTotal(initialListings.length);
      return;
    }

    async function fetchListings() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        // Always use new-development API for city context, but include search query if present
        if (city) params.append("city", city);

        const hasSearchQuery = searchQuery && searchQuery.trim().length > 0;
        if (hasSearchQuery) {
          params.append("q", searchQuery.trim());
        }
        if (filters.minPrice && filters.minPrice !== "") params.append("minPrice", filters.minPrice);
        if (filters.maxPrice && filters.maxPrice !== "") params.append("maxPrice", filters.maxPrice);
        if (filters.minBeds && filters.minBeds !== "") params.append("minBeds", filters.minBeds);
        if (filters.minBaths && filters.minBaths !== "") params.append("minBaths", filters.minBaths);

        const res = await fetch(`/api/bridge/new-development?${params}`);

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

    if (!externalLoading) {
      fetchListings();
    }
  }, [page, city, filters.minPrice, filters.maxPrice, filters.minBeds, filters.minBaths, searchQuery, initialListings, externalLoading]);

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
       <div className="mb-10 sm:mb-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
  <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#091D35]">
    Featured Properties
  </h2>

  <span className="text-sm text-gray-500">
    Showing {listings.length} of {total}
  </span>
</div>

<div className="mt-4 h-[3px] w-20 bg-red-600 rounded-full" />

      
      </div>


        {/* GRID - show listings as they load; no full-screen loading on pagination (like Buy) */}
        {listings.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            {searchQuery && searchQuery.trim().length > 0
              ? `No new development properties found for "${searchQuery}". Try adjusting your search.`
              : "New Development Properties Loading..."}
          </div>
        ) : (
          <>
        <>
  {/* MOBILE SCROLL */}
  <div className="sm:hidden -mx-6 px-6">
    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide">
      {listings.map((listing) => (
        <div
          key={listing.ListingId || listing.Id}
          className="snap-start min-w-[280px]"
        >
          <PropertyCard
            listing={listing}
            listingType="newDevelopment"
          />
        </div>
      ))}
    </div>
  </div>

  {/* DESKTOP GRID */}
  <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-10">
    {listings.map((listing) => (
      <PropertyCard
        key={listing.ListingId || listing.Id}
        listing={listing}
        listingType="newDevelopment"
      />
    ))}
  </div>
</>


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