"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import PropertyCard from "@/components/buy/PropertyCard";
import PropertyListingsMap from "./PropertyListingsMap";
import { Search, Filter, Map, List as ListIcon, LayoutGrid } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import Header from "@/components/Header";

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
  const [viewMode, setViewMode] = useState("split"); // "split", "list", "map" - default to "split" (middle view with properties + map)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInputValue, setSearchInputValue] = useState(""); // Separate state for input display
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
    // Set the search query from input value (empty string clears search)
    const trimmedValue = searchInputValue.trim();
    setSearchQuery(trimmedValue);
    // Reset to page 1 when searching
    setPage(1);
    // Clear input after search is submitted
    setSearchInputValue("");
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

  // When map is zoomed/panned: show listings in visible area + buffer so bagal (nearby) properties stay visible
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
    <div className="bg-[#0B1F3A] min-h-screen" style={{ paddingTop: '80px', overflow: 'hidden', height: '100vh' }}>

    {/* HEADER sitting on blue */}
    <Header />
<div className="bg-white border-b sticky top-20 z-40">
 <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4">

  {/* ✅ DESKTOP / TABLET */}
  <div className="hidden md:flex items-center gap-3">

    {/* Back */}
    <button
      onClick={() => router.back()}
      className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm"
    >
      ← Back
    </button>

    {/* Search */}
    <form onSubmit={handleSearch} className="flex-1">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchInputValue}
            onChange={(e) => {
              setSearchInputValue(e.target.value);
              setPage(1);
            }}
            placeholder="Search by address, city..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium"
        >
          Search
        </button>
      </div>
    </form>

    {/* Filters */}
    <div className="flex items-center gap-2">

      <select
        className="toolbar-select"
        value={filters.minPrice || ""}
        onChange={(e) => {
          setFilters((prev) => ({ ...prev, minPrice: e.target.value }));
          setPage(1);
        }}
      >
        <option value="">Min Price</option>
        <option value="0">$0</option>
        <option value="100000">$100K</option>
        <option value="200000">$200K</option>
        <option value="300000">$300K</option>
        <option value="400000">$400K</option>
        <option value="500000">$500K</option>
        <option value="600000">$600K</option>
        <option value="700000">$700K</option>
        <option value="800000">$800K</option>
        <option value="900000">$900K</option>
        <option value="1000000">$1M</option>
        <option value="1500000">$1.5M</option>
        <option value="2000000">$2M</option>
        <option value="3000000">$3M</option>
        <option value="5000000">$5M+</option>
      </select>

      <select
        className="toolbar-select"
        value={filters.maxPrice || ""}
        onChange={(e) => {
          setFilters((prev) => ({ ...prev, maxPrice: e.target.value }));
          setPage(1);
        }}
      >
        <option value="">Max Price</option>
        <option value="200000">$200K</option>
        <option value="300000">$300K</option>
        <option value="400000">$400K</option>
        <option value="500000">$500K</option>
        <option value="600000">$600K</option>
        <option value="700000">$700K</option>
        <option value="800000">$800K</option>
        <option value="900000">$900K</option>
        <option value="1000000">$1M</option>
        <option value="1500000">$1.5M</option>
        <option value="2000000">$2M</option>
        <option value="3000000">$3M</option>
        <option value="5000000">$5M</option>
        <option value="10000000">$10M+</option>
      </select>

      <select
        className="toolbar-select"
        value={filters.minBeds || ""}
        onChange={(e) => {
          setFilters((prev) => ({ ...prev, minBeds: e.target.value }));
          setPage(1);
        }}
      >
        <option value="">Any Beds</option>
        <option value="1">1+</option>
        <option value="2">2+</option>
        <option value="3">3+</option>
        <option value="4">4+</option>
        <option value="5">5+</option>
      </select>

      <select
        className="toolbar-select"
        value={filters.minBaths || ""}
        onChange={(e) => {
          setFilters((prev) => ({ ...prev, minBaths: e.target.value }));
          setPage(1);
        }}
      >
        <option value="">Any Baths</option>
        <option value="1">1+</option>
        <option value="2">2+</option>
        <option value="3">3+</option>
        <option value="4">4+</option>
        <option value="5">5+</option>
      </select>

      <button
        className="toolbar-clear"
        onClick={() => {
          setFilters({
            minPrice: "",
            maxPrice: "",
            minBeds: "",
            minBaths: "",
            propertyType: "",
          });
          setPage(1);
        }}
      >
        Clear
      </button>
    </div>

    {/* View Toggle */}
    <div className="flex border border-gray-300 rounded-lg p-1">
      <button
        onClick={() => setViewMode("list")}
        className={`toolbar-toggle ${viewMode === "list" && "active"}`}
      >
        <ListIcon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setViewMode("split")}
        className={`toolbar-toggle ${viewMode === "split" && "active"}`}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => setViewMode("map")}
        className={`toolbar-toggle ${viewMode === "map" && "active"}`}
      >
        <Map className="w-4 h-4" />
      </button>
    </div>
  </div>

  {/* ✅ MOBILE */}
  <div className="md:hidden space-y-3">

    {/* Row 1 */}
    <div className="flex gap-2">
      <button
        onClick={() => router.back()}
        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm"
      >
        ← Back
      </button>

      {/* View toggle - List and Map only (no Split on mobile) */}
      <div className="flex border border-gray-300 rounded-lg p-1 ml-auto">
        <button
          onClick={() => setViewMode("list")}
          className={`toolbar-toggle ${viewMode === "list" && "active"}`}
        >
          <ListIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode("map")}
          className={`toolbar-toggle ${viewMode === "map" && "active"}`}
        >
          <Map className="w-4 h-4" />
        </button>
      </div>
    </div>

    {/* Row 2 Search */}
    <form onSubmit={handleSearch}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchInputValue}
            onChange={(e) => {
              setSearchInputValue(e.target.value);
              setPage(1);
            }}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm"
        >
          Go
        </button>
      </div>
    </form>

    {/* Row 3 Filters Scroll */}
    <div className="flex gap-2 overflow-x-auto pb-1">
      <select
        className="toolbar-select min-w-[110px]"
        value={filters.minPrice || ""}
        onChange={(e) => {
          setFilters((prev) => ({ ...prev, minPrice: e.target.value }));
          setPage(1);
        }}
      >
        <option value="">Min Price</option>
        <option value="0">$0</option>
        <option value="100000">$100K</option>
        <option value="200000">$200K</option>
        <option value="300000">$300K</option>
        <option value="400000">$400K</option>
        <option value="500000">$500K</option>
        <option value="600000">$600K</option>
        <option value="700000">$700K</option>
        <option value="800000">$800K</option>
        <option value="900000">$900K</option>
        <option value="1000000">$1M</option>
        <option value="1500000">$1.5M</option>
        <option value="2000000">$2M</option>
        <option value="3000000">$3M</option>
        <option value="5000000">$5M+</option>
      </select>
      <select
        className="toolbar-select min-w-[110px]"
        value={filters.maxPrice || ""}
        onChange={(e) => {
          setFilters((prev) => ({ ...prev, maxPrice: e.target.value }));
          setPage(1);
        }}
      >
        <option value="">Max Price</option>
        <option value="200000">$200K</option>
        <option value="300000">$300K</option>
        <option value="400000">$400K</option>
        <option value="500000">$500K</option>
        <option value="600000">$600K</option>
        <option value="700000">$700K</option>
        <option value="800000">$800K</option>
        <option value="900000">$900K</option>
        <option value="1000000">$1M</option>
        <option value="1500000">$1.5M</option>
        <option value="2000000">$2M</option>
        <option value="3000000">$3M</option>
        <option value="5000000">$5M</option>
        <option value="10000000">$10M+</option>
      </select>
      <select
        className="toolbar-select"
        value={filters.minBeds || ""}
        onChange={(e) => {
          setFilters((prev) => ({ ...prev, minBeds: e.target.value }));
          setPage(1);
        }}
      >
        <option value="">Beds</option>
        <option value="1">1+</option>
        <option value="2">2+</option>
        <option value="3">3+</option>
        <option value="4">4+</option>
        <option value="5">5+</option>
      </select>
      <select
        className="toolbar-select"
        value={filters.minBaths || ""}
        onChange={(e) => {
          setFilters((prev) => ({ ...prev, minBaths: e.target.value }));
          setPage(1);
        }}
      >
        <option value="">Baths</option>
        <option value="1">1+</option>
        <option value="2">2+</option>
        <option value="3">3+</option>
        <option value="4">4+</option>
        <option value="5">5+</option>
      </select>
      <button
        className="toolbar-clear"
        onClick={() => {
          setFilters({
            minPrice: "",
            maxPrice: "",
            minBeds: "",
            minBaths: "",
            propertyType: "",
          });
          setPage(1);
        }}
      >
        Clear
      </button>
    </div>
  </div>
</div>
</div>

      {/* MAIN CONTENT */}
      <div className="max-w-[1600px] mx-auto bg-white" style={{ height: 'calc(100vh - 180px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Title only – no property count, no "Showing X of Y" text */}
        <div className="px-6 py-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-[#091D35]">
            {listingType === "rent" ? "Rental Listings" : "Real Estate & Homes for Sale"}
          </h1>
        </div>

        {/* Split View - Hidden on small devices */}
        {viewMode === "split" && (
          <div className="hidden md:flex flex-1 min-h-0" style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
            {/* Left Panel - Listings - Scrollable with visible scrollbar */}
            <div className="w-1/2 flex flex-col" style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
              <div className="flex-1 overflow-y-scroll px-6 py-4 property-sidebar-scroll" style={{ minHeight: 0, maxHeight: '100%' }}>
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
                  <div className="grid grid-cols-2 gap-4">
                    {displayedListings.map((listing, index) => (
                      <PropertyCard
                        key={listing.ListingId || listing.Id}
                        listing={listing}
                        listingType={listingType}
                        priority={index < 2}
                      />
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
            </div>

            {/* Right Panel - Map: Fixed, no scroll */}
            <div 
              className="w-1/2 border-l flex-shrink-0 bg-gray-100" 
              style={{ 
                height: '100%', 
                minHeight: '500px',
                position: 'relative',
                overflow: 'hidden',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}
              suppressHydrationWarning
            >
              <PropertyListingsMap
                listings={mapListings}
                onBoundsChange={setMapBounds}
              />
            </div>
          </div>
        )}

        {/* List Only View - Available on all devices */}
        {viewMode === "list" && (
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
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
                  <div className="mt-10 flex items-center justify-center gap-4 flex-wrap pb-4">
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

        {/* Map Only View - Available on all devices */}
        {viewMode === "map" && (
          <div className="flex-1 min-h-0 px-6 pb-4">
            <div className="h-full w-full min-h-[500px]">
              <PropertyListingsMap
                listings={mapListings}
                onBoundsChange={setMapBounds}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}