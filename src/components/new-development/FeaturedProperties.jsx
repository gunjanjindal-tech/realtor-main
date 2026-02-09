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
          let errorData = { error: `HTTP ${res.status}: ${res.statusText}` };
          const contentType = res.headers.get("content-type");
          
          try {
            if (contentType?.includes("application/json")) {
              errorData = await res.json();
            } else {
              const text = await res.text();
              console.error("❌ [NEW-DEV] API returned HTML instead of JSON:", text.substring(0, 200));
              errorData = { error: `Server returned ${contentType || "HTML"} instead of JSON` };
            }
          } catch (parseError) {
            console.error("❌ [NEW-DEV] Failed to parse error response:", parseError);
          }
          
          console.error("❌ [NEW-DEV] API Error Response:", {
            status: res.status,
            statusText: res.statusText,
            contentType,
            error: errorData,
          });
          setListings([]);
          setTotal(0);
          return;
        }

        const contentType = res.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          const text = await res.text();
          console.error("❌ [NEW-DEV] API returned non-JSON response:", {
            contentType,
            preview: text.substring(0, 200),
          });
          setListings([]);
          setTotal(0);
          return;
        }

        const data = await res.json();
        console.log("📊 [NEW-DEV] Frontend received data:", {
          hasListings: !!data.listings,
          hasBundle: !!data.bundle,
          listingsCount: data.listings?.length || 0,
          bundleCount: data.bundle?.length || 0,
          total: data.total,
        });

        setListings(data.listings || data.bundle || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error("❌ [NEW-DEV] Failed to fetch listings", err);
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

          <div className="mt-4 h-[3px] w-25 bg-red-600 rounded-full" />
        </div>

        {/* GRID */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-500">Loading new developments...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-4">
              No new developments found
            </p>
            <p className="text-gray-400 text-sm">
              {city ? `Try searching in other cities` : "Check back soon for new construction projects"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {listings.map((listing) => (
                <PropertyCard 
                  key={listing.ListingId || listing.Id} 
                  listing={listing}
                  showNewDevelopmentBadge={true}
                />
              ))}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="mt-16 flex justify-center items-center gap-2">
                <button
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    scrollToTop();
                  }}
                  disabled={page === 1 || loading}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                >
                  Previous
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                    const p = startPage + i;
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          setPage(p);
                          scrollToTop();
                        }}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg transition ${
                          page === p
                            ? "bg-red-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    scrollToTop();
                  }}
                  disabled={page === totalPages || loading}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}



