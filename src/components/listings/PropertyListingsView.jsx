"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import PropertyCard from "@/components/buy/PropertyCard";
import PropertyListingsMap from "./PropertyListingsMap";
import { Search, Filter, Map, List as ListIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

// Higher limit so map shows more properties (API allows it)
const LISTINGS_LIMIT = 200;

export default function PropertyListingsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingType = searchParams?.get("type") === "rent" ? "rent" : "sale";

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState("split"); // "split", "list", "map"
  const [searchQuery, setSearchQuery] = useState("");
  const [mapBounds, setMapBounds] = useState(null); // { north, south, east, west } - filter list by visible map area
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    minBeds: "",
    minBaths: "",
    propertyType: "",
  });

  const limit = LISTINGS_LIMIT;
  const fetchIdRef = useRef(0);

  useEffect(() => {
    const currentFetchId = ++fetchIdRef.current;

    async function fetchListings() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        const hasSearchQuery = searchQuery && searchQuery.trim().length > 0;

        if (hasSearchQuery) {
          params.append("q", searchQuery.trim());
          if (filters.minPrice) params.append("minPrice", filters.minPrice);
          if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
          if (filters.minBeds) params.append("minBeds", filters.minBeds);
          if (filters.minBaths) params.append("minBaths", filters.minBaths);

          const response = await fetch(`/api/bridge/search?${params}`);
          const data = await response.json();

          if (currentFetchId !== fetchIdRef.current) return;

          if (data.error) {
            throw new Error(data.error);
          }

          setListings(data.listings || []);
          setTotal(data.total || 0);
        } else {
          if (filters.minPrice) params.append("minPrice", filters.minPrice);
          if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
          if (filters.minBeds) params.append("minBeds", filters.minBeds);
          if (filters.minBaths) params.append("minBaths", filters.minBaths);

          const apiUrl = listingType === "rent" ? "/api/bridge/rent" : "/api/bridge/buy";
          const response = await fetch(`${apiUrl}?${params}`);
          const data = await response.json();

          if (currentFetchId !== fetchIdRef.current) return;

          if (data.error) {
            throw new Error(data.error);
          }

          setListings(data.listings || []);
          setTotal(data.total || 0);
        }
      } catch (err) {
        if (currentFetchId !== fetchIdRef.current) return;
        setError(err.message);
        console.error("Error fetching listings:", err);
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false);
        }
      }
    }

    fetchListings();
  }, [page, limit, listingType, searchQuery, filters.minPrice, filters.maxPrice, filters.minBeds, filters.minBaths]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPagination = totalPages > 1;

  function handleSearch(e) {
    e.preventDefault();
    // Reset to page 1 when searching
    setPage(1);
    // Force immediate fetch by triggering useEffect
  }

  // Listings with valid coordinates for map
  const mapListings = useMemo(
    () =>
      listings.filter(
        (listing) =>
          (listing.Latitude || listing.LatitudeDecimal) &&
          (listing.Longitude || listing.LongitudeDecimal)
      ),
    [listings]
  );

  // When map is zoomed/panned: show only listings inside visible map area on the left list
  const displayedListings = useMemo(() => {
    if (!mapBounds) return listings;
    const { north, south, east, west } = mapBounds;
    return listings.filter((listing) => {
      const lat = parseFloat(listing.Latitude || listing.LatitudeDecimal);
      const lng = parseFloat(listing.Longitude || listing.LongitudeDecimal);
      if (isNaN(lat) || isNaN(lng)) return false;
      return lat >= south && lat <= north && lng >= west && lng <= east;
    });
  }, [listings, mapBounds]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER WITH SEARCH AND FILTERS */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4">

          {/* Back Button */}
          <button
  onClick={() => router.back()}
  className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition "
>
  ← Back
</button>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setSearchQuery(newValue);
                    // Auto-search as user types (with small delay)
                    if (newValue.trim().length > 0) {
                      setPage(1);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearch(e);
                    }
                  }}
                  placeholder="Search by address, city..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Search
              </button>
            </div>
          </form>

          {/* Filters and View Toggle */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap ">

              <select
                value={filters.minPrice}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFilters((prev) => ({ ...prev, minPrice: newValue }));
                  setPage(1);
                }}
               className="appearance-none px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 "

                >



                <option value="">Any Price</option>
                <option value="100000">$100K+</option>
                <option value="200000">$200K+</option>
                <option value="300000">$300K+</option>
                <option value="500000">$500K+</option>
                <option value="1000000">$1M+</option>
                 {/* Custom Arrow */}

                </select>
                
              <select
                value={filters.maxPrice}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFilters((prev) => ({ ...prev, maxPrice: newValue }));
                  setPage(1);
                }}
               className="appearance-none px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"

              >
                <option value="">Max Price</option>
                <option value="300000">Up to $300K</option>
                <option value="500000">Up to $500K</option>
                <option value="750000">Up to $750K</option>
                <option value="1000000">Up to $1M</option>
                <option value="2000000">Up to $2M</option>
              </select>
              <select
                value={filters.minBeds}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFilters((prev) => ({ ...prev, minBeds: newValue }));
                  setPage(1);
                }}
                className="appearance-none px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"

              >
                <option value="">All Beds</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
              <select
                value={filters.minBaths}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFilters((prev) => ({ ...prev, minBaths: newValue }));
                  setPage(1);
                }}
                className="appearance-none px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"

              >
                <option value="">All Baths</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
              {(filters.minPrice || filters.maxPrice || filters.minBeds || filters.minBaths || searchQuery) && (
                <button
                  onClick={() => {
                    setFilters({
                      minPrice: "",
                      maxPrice: "",
                      minBeds: "",
                      minBaths: "",
                      propertyType: "",
                    });
                    setSearchQuery("");
                    setPage(1);
                  }}
                  className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition"
                >
                  Clear All
                </button>
                )}
        
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 rounded ${viewMode === "list" ? "bg-red-600 text-white" : "text-gray-600"}`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("split")}
                className={`px-3 py-2 rounded ${viewMode === "split" ? "bg-red-600 text-white" : "text-gray-600"}`}
              >
                <ListIcon className="w-4 h-4" />
                <Map className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`px-3 py-2 rounded ${viewMode === "map" ? "bg-red-600 text-white" : "text-gray-600"}`}
              >
                <Map className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-[1600px] mx-auto">
        {/* Results Count + Pagination */}
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#091D35]">
              {listingType === "rent" ? "Rental Listings" : "Real Estate & Homes for Sale"}
            </h1>
            <p className="text-gray-600 mt-1">
              {mapBounds
                ? `Showing ${displayedListings.length} of ${total.toLocaleString()}+ in map view`
                : total > 0
                  ? `${total.toLocaleString()}+ results · Page ${page} of ${totalPages}`
                  : "No results found"}
            </p>
          </div>
          {hasPagination && (viewMode === "map" || !mapBounds) && (
            <nav className="flex items-center gap-2 flex-wrap" aria-label="Pagination">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let p;
                  if (totalPages <= 7) p = i + 1;
                  else if (page <= 4) p = i + 1;
                  else if (page >= totalPages - 3) p = totalPages - 6 + i;
                  else p = page - 3 + i;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium ${
                        page === p
                          ? "bg-red-600 text-white"
                          : "border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </nav>
          )}
        </div>

        {/* Split View */}
        {viewMode === "split" && (
          <div className="flex h-[calc(100vh-250px)]">
            {/* Left Panel - Listings */}
            <div className="w-1/2 overflow-y-auto px-6 py-4">
              {loading && page === 1 ? (
                <div className="text-center py-12">Loading properties...</div>
              ) : error ? (
                <div className="text-center py-12 text-red-600">{error}</div>
              ) : displayedListings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {mapBounds ? "No properties in this map area. Zoom out or pan." : "No properties found"}
                </div>
              ) : (
                <>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {displayedListings.map((listing) => (
    <PropertyCard
      key={listing.ListingId || listing.Id}
      listing={listing}
      listingType={listingType}
    />
  ))}

                    {displayedListings.map((listing) => (
                      <PropertyCard key={listing.ListingId || listing.Id} listing={listing} listingType={listingType} />
                    ))}
                  </div>
                  {/* Pagination at bottom of sidebar - always show when there are multiple pages */}
                  {hasPagination && (
                    <div className="mt-6 pt-4 pb-2 flex items-center justify-center gap-3 flex-wrap border-t border-gray-200">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        ← Previous
                      </button>
                      <span className="px-3 py-2 text-sm text-gray-600">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Panel - Map: zoom/pan filters the list on the left */}
            <div className="w-1/2 border-l">
              <PropertyListingsMap
                listings={mapListings}
                onBoundsChange={setMapBounds}
              />
            </div>
          </div>
        )}

        {/* List Only View */}
        {viewMode === "list" && (
          <div className="px-6 py-4">
            {loading && page === 1 ? (
              <div className="text-center py-12">Loading properties...</div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">{error}</div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Loading properties...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map((listing) => (
                    <PropertyCard key={listing.ListingId || listing.Id} listing={listing} listingType={listingType} />
                  ))}
                </div>
                {hasPagination && (
                  <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Map Only View */}
        {viewMode === "map" && (
          <div className="px-6 pb-4">
            <div className="h-[calc(100vh-280px)]">
              <PropertyListingsMap
                listings={mapListings}
                onBoundsChange={setMapBounds}
              />
            </div>
            {hasPagination && (
              <div className="mt-4 flex items-center justify-center gap-4 flex-wrap bg-white py-3 rounded-lg border">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages} · {total.toLocaleString()}+ total
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

