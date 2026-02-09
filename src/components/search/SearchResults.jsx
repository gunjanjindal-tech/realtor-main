"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PropertyCard from "../buy/PropertyCard";

function SearchResultsContent({ query: initialQuery }) {
  const searchParams = useSearchParams();
  const query = initialQuery || searchParams.get("q") || searchParams.get("query") || "";

  const [page, setPage] = useState(1);
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const limit = 12;

  useEffect(() => {
    if (!query || query.trim().length === 0) {
      setListings([]);
      setTotal(0);
      return;
    }

    async function fetchSearchResults() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/bridge/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
        );

        if (!res.ok) {
          let errorData = { error: `HTTP ${res.status}: ${res.statusText}` };
          const contentType = res.headers.get("content-type");
          
          try {
            if (contentType?.includes("application/json")) {
              errorData = await res.json();
            } else {
              const text = await res.text();
              errorData = { error: `Server returned ${contentType || "HTML"} instead of JSON` };
            }
          } catch (parseError) {
            console.error("Failed to parse error response:", parseError);
          }
          
          setError(errorData.error || "Failed to search properties");
          setListings([]);
          setTotal(0);
          return;
        }

        const contentType = res.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          setError("Invalid response from server");
          setListings([]);
          setTotal(0);
          return;
        }

        const data = await res.json();
        console.log("📊 Search results received:", {
          listingsCount: data.listings?.length || 0,
          total: data.total,
          query: data.query,
        });

        setListings(data.listings || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error("❌ Failed to fetch search results", err);
        setError(err.message || "Failed to search properties");
        setListings([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }

    fetchSearchResults();
  }, [query, page]);

  const totalPages = Math.ceil(total / limit);

  if (!query || query.trim().length === 0) {
    return (
      <section className="bg-white py-24">
        <div className="max-w-[1600px] mx-auto px-6 text-center">
          <p className="text-gray-500 text-lg">Please enter a search query</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-24">
      <div className="max-w-[1600px] mx-auto px-6">
        {/* HEADER */}
        <div className="mb-14">
          <div className="flex items-end justify-between">
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-[#091D35]">
              Search Results
            </h2>
            <span className="text-sm text-gray-500">
              {loading ? "Searching..." : `Found ${total} ${total === 1 ? "property" : "properties"}`}
            </span>
          </div>
          <div className="mt-4 h-[3px] w-25 bg-red-600 rounded-full" />
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="text-center py-20">
            <p className="text-gray-500">Searching properties...</p>
          </div>
        )}

        {/* RESULTS */}
        {!loading && !error && (
          <>
            {listings.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg mb-4">
                  No properties found for "{query}"
                </p>
                <p className="text-gray-400 text-sm">
                  Try searching by city name, address, or MLS® number
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                  {listings.map((listing) => (
                    <PropertyCard
                      key={listing.ListingId || listing.Id}
                      listing={listing}
                    />
                  ))}
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="mt-16 flex justify-center items-center gap-3">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || loading}
                      className="h-12 w-12 rounded-full border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                    >
                      ←
                    </button>

                    <div className="flex gap-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNumber = i + 1;
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => setPage(pageNumber)}
                            disabled={loading}
                            className={`h-12 w-12 rounded-full font-medium transition ${
                              page === pageNumber
                                ? "bg-[#091D35] text-white"
                                : "border hover:bg-gray-100"
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || loading}
                      className="h-12 w-12 rounded-full border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default function SearchResults({ query: initialQuery }) {
  return (
    <Suspense fallback={
      <section className="bg-white py-24">
        <div className="max-w-[1600px] mx-auto px-6 text-center">
          <p className="text-gray-500">Loading search results...</p>
        </div>
      </section>
    }>
      <SearchResultsContent query={initialQuery} />
    </Suspense>
  );
}



