"use client";

import { useEffect, useRef, useState } from "react";
import PropertyCard from "./PropertyCard";

export default function FeaturedProperties({ city, filters = {} }) {
  const topRef = useRef(null);

  const [page, setPage] = useState(1);
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);

const [limit, setLimit] = useState(9);

/* -------- RESET PAGE WHEN FILTERS CHANGE -------- */
useEffect(() => {
  setPage(1);
}, [filters.minPrice, filters.maxPrice, filters.minBeds, filters.minBaths]);

/* -------- RESPONSIVE LIMIT -------- */
useEffect(() => {
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


/* -------- RESET PAGE WHEN LIMIT CHANGES -------- */
useEffect(() => {
  setPage((p) => (p !== 1 ? 1 : p));
}, [limit]);


/* -------- FETCH LISTINGS -------- */
useEffect(() => {
  async function fetchListings() {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (city) params.append("city", city);

      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      if (filters.minBeds) params.append("minBeds", filters.minBeds);
      if (filters.minBaths) params.append("minBaths", filters.minBaths);

      const res = await fetch(`/api/bridge/buy?${params}`);

      if (!res.ok) {
        setListings([]);
        setTotal(0);
        return;
      }

      const data = await res.json();

      setListings(data.listings || data.bundle || []);
      setTotal(data.total || 0);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Fetch error:", err);
      }
      setListings([]);
      setTotal(0);
    }
  }

  fetchListings();
}, [page, city, limit, filters.minPrice, filters.maxPrice, filters.minBeds, filters.minBaths]);

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
  <section ref={topRef} className="bg-white  pt-14 sm:pb-7 lg:pb-14">
    <div className="max-w-[1600px] mx-auto px-4">

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

      {/* LISTINGS */}
      {listings.length === 0 ? (
        <p className="text-center py-20 text-gray-500">Loading featured properties...</p>
      ) : (
        <>
          {/* MOBILE: horizontal scroll */}
          <div className="sm:hidden -mx-6 px-6">
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide">
              {listings.map((item) => (
                <div
                  key={item.ListingId || item.Id}
                  className="snap-start min-w-[280px]"
                >
                  <PropertyCard listing={item} />
                </div>
              ))}
            </div>
          </div>

          {/* DESKTOP GRID */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-10">
            {listings.map((item) => (
              <PropertyCard
                key={item.ListingId || item.Id}
                listing={item}
              />
            ))}
          </div>
        </>
      )}

      {/* PAGINATION */}
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
    </div>
  </section>
);

}
