"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import PropertyCard from "@/components/buy/PropertyCard";
import PropertyListingsMap from "./PropertyListingsMap";
import { Search, Filter, Map, List as ListIcon, LayoutGrid, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

import "rc-slider/assets/index.css";

function buildPolygon(bounds) {
  const { north, south, east, west } = bounds;
  // IMPORTANT: longitude latitude order for Bridge POLYGON
  return `POLYGON((
${west} ${south},
${west} ${north},
${east} ${north},
${east} ${south},
${west} ${south}
))`;
}

export default function PropertyListingsView() {
  console.log("Listing page ")
  const router = useRouter();
  const searchParams = useSearchParams();
  // Get listing type from URL, default to "sale"
  // Support: "rent", "sale", "new-development", "sell"
  const typeParam = searchParams?.get("type") || "sale";
  let listingType;
  if (typeParam === "rent") {
    listingType = "rent";
  } else if (typeParam === "new-development" || typeParam === "newDevelopment") {
    listingType = "new-development";
  } else if (typeParam === "sell") {
    listingType = "sell";
  } else {
    listingType = "sale"; // Default to sale
  }

  const [listings, setListings] = useState([]);
  const [pins, setPins] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRelatedResults, setIsRelatedResults] = useState(false);
  // Nearby fallback listings (when search returns 0 results): show properties near searched location
  const [nearbyListings, setNearbyListings] = useState([]);
  // Default view: "split" for server render (consistent), will be updated on client
  // Always use "split" for SSR to avoid hydration mismatch
  const [viewMode, setViewMode] = useState("split");
  const [isMounted, setIsMounted] = useState(false);
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



  // Price slider state
  const [priceRange, setPriceRange] = useState([0, 2000000]);
  const [showPricePopup, setShowPricePopup] = useState(false);
  const fetchIdRef = useRef(0);
  const viewportFetchIdRef = useRef(0);
  const nearbyFetchIdRef = useRef(0);
  const lastNearbyKeyRef = useRef("");

  const hasSearchQuery = searchQuery && searchQuery.trim().length > 0;
  const hasSearchResults = hasSearchQuery && listings.length > 0;

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const onMapClick = useCallback((locationName) => {
    setSearchInputValue(locationName);
    setSearchQuery(locationName);
  }, []);

  const handleBoundsChange = useCallback((bounds) => {
    if (!bounds) return;
    
    // Round bounds to 4 decimals to avoid tiny scroll changes causing re-fetches
    const roundedBounds = {
      north: Number(bounds.north.toFixed(4)),
      south: Number(bounds.south.toFixed(4)),
      east: Number(bounds.east.toFixed(4)),
      west: Number(bounds.west.toFixed(4))
    };

    setMapBounds(prev => {
      // Deep compare
      if (!prev) return roundedBounds;
      if (
        prev.north === roundedBounds.north &&
        prev.south === roundedBounds.south &&
        prev.east === roundedBounds.east &&
        prev.west === roundedBounds.west
      ) {
        return prev;
      }
      return roundedBounds;
    });
  }, []);

  // Read search query from URL on mount if present
  useEffect(() => {
    const urlQuery = searchParams?.get("q") || searchParams?.get("query") || "";
    if (urlQuery && urlQuery.trim().length > 0) {
      // If search query is in URL, use it (e.g., when redirected from specific pages)
      setSearchQuery(urlQuery.trim());
      setSearchInputValue(urlQuery.trim());
    } else {
      // Otherwise clear search
      setSearchQuery("");
      setSearchInputValue("");
    }
  }, [searchParams]);

  // Viewport-driven fetch: listings inside current map bounds
  useEffect(() => {
    console.log("I'm console before the if under the useEffect")
    if (!mapBounds && !searchQuery) {
      // If we don't have bounds yet (initial load), do a default fetch so we don't spin forever
      // Especially if Google Maps fails to load or geocoding is slow
      console.log("⚠️ No map bounds yet, doing initial fallback fetch");
      
      const timeoutId = setTimeout(async () => {
        if (mapBounds) return; // Map loaded just in time, let the bounds effect handle it

        setLoading(true);
        try {
          // Default broad search around Halifax area if no bounds exist
          const defaultFilter = `PropertyType eq 'Residential' and StandardStatus eq 'Active'`;
          const url = `/api/bridge/search?$filter=${encodeURIComponent(defaultFilter)}&$top=50`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (!mapBounds) { // Still no bounds
              setListings(data.listings || []);
              setLoading(false);
            }
          }
        } catch (err) {
          console.error("Initial load failed", err);
          if (!mapBounds) setLoading(false);
        }
      }, 1500); // Give the map 1.5s to report bounds first
      return () => clearTimeout(timeoutId);
    }

    const currentFetchId = ++viewportFetchIdRef.current;

    console.log("🔄 Triggering Viewport Fetch", { bounds: mapBounds, filters, type: listingType });

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);
      setPage(1); // Reset page on bounds/filter change

      try {
        const polygon = buildPolygon(mapBounds);

        const filterParts = [
          `geo.intersects(Coordinates, ${polygon})`,
        ];

        // Ensure we filter by listingType standard statuses mapping
        if (listingType === "rent") {
          filterParts.push(`PropertyType eq 'Residential Lease'`);
        } else if (listingType === "new-development") {
          filterParts.push(`NewConstructionYN eq true`);
        } else if (listingType === "sell") {
           filterParts.push(`StandardStatus eq 'Closed'`);
        } else {
           // Default to "sale"
           filterParts.push(`PropertyType eq 'Residential'`);
           filterParts.push(`StandardStatus eq 'Active'`);
        }

        if (filters.minPrice) filterParts.push(`ListPrice ge ${filters.minPrice}`);
        if (filters.maxPrice) filterParts.push(`ListPrice le ${filters.maxPrice}`);
        if (filters.minBeds)  filterParts.push(`BedroomsTotal ge ${filters.minBeds}`);
        if (filters.minBaths) filterParts.push(`BathroomsTotalInteger ge ${filters.minBaths}`);

        const odataFilter = filterParts.join(" and ");
        const baseApiUrl = `/api/bridge/search?$filter=${encodeURIComponent(odataFilter)}`;

        // Zillow-style Triple Query:
        // 1. Fetch total count (countOnly=true)
        // 2. Fetch all pins for map clustering (pinsOnly=true)
        // 3. Fetch first page of full listings for sidebar (limit=40)
        // Perform these in parallel for maximum performance
        const [countRes, pinsRes, listingsRes] = await Promise.all([
          fetch(`${baseApiUrl}&countOnly=true`),
          fetch(`${baseApiUrl}&pinsOnly=true`),
          fetch(`${baseApiUrl}&limit=40&page=1`)
        ]);
        console.log("I'm console after the fetch")

        if (!countRes.ok || !pinsRes.ok || !listingsRes.ok) {
          throw new Error(`API fetch failed! Count: ${countRes.status}, Pins: ${pinsRes.status}, Listings: ${listingsRes.status}`);
        }

        const [countData, pinsData, listingsData] = await Promise.all([
          countRes.json(),
          pinsRes.json(),
          listingsRes.json()
        ]);

        if (currentFetchId !== viewportFetchIdRef.current) return;

        if (countData.error || pinsData.error || listingsData.error) {
          throw new Error(countData.error || pinsData.error || listingsData.error);
        }

        const total = Number(countData.total || listingsData.total || 0);
        setListings(listingsData.listings || []);
        setPins(pinsData.listings || []);
        setTotalResults(total);
        setHasMore(listingsData.listings?.length < total);
        setIsRelatedResults(listingsData.isRelated || false);
        setLoading(false);
      } catch (err) {
        if (currentFetchId !== viewportFetchIdRef.current) return;
        setError(err.message);
        console.error("Error fetching viewport listings:", err);
        setLoading(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timeoutId);
  }, [mapBounds, filters.minPrice, filters.maxPrice, filters.minBeds, filters.minBaths, listingType]);

  // (legacy map pagination effects removed – viewport-based fetching now handles map data)

  // If search returns 0 results, fetch nearby properties in the current map bounds (after geocode centers the map)
  useEffect(() => {
    if (!hasSearchQuery || hasSearchResults) {
      if (nearbyListings.length > 0) setNearbyListings([]);
      lastNearbyKeyRef.current = "";
      return;
    }
    if (!mapBounds) return;

    const { north, south, east, west } = mapBounds;
    const key = [
      listingType,
      searchQuery.trim().toLowerCase(),
      north.toFixed(3),
      south.toFixed(3),
      east.toFixed(3),
      west.toFixed(3),
      filters.minPrice || "",
      filters.maxPrice || "",
      filters.minBeds || "",
      filters.minBaths || "",
    ].join("|");

    if (key === lastNearbyKeyRef.current) return;
    lastNearbyKeyRef.current = key;

    const currentNearbyFetchId = ++nearbyFetchIdRef.current;

    console.log("🔄 Triggering Nearby Fallback Fetch", { key });

    async function fetchNearby() {
      try {
        const params = new URLSearchParams({
          type: listingType,
          north: String(north),
          south: String(south),
          east: String(east),
          west: String(west),
        });

        if (filters.minPrice) params.append("minPrice", filters.minPrice);
        if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
        if (filters.minBeds) params.append("minBeds", filters.minBeds);
        if (filters.minBaths) params.append("minBaths", filters.minBaths);

        const res1 = await fetch(`/api/bridge/nearby?${params}`);

        if (!res1.ok) {
          const errorText = await res1.text().catch(() => "Unknown error");
          const isHTML = errorText.trim().startsWith("<!DOCTYPE") || errorText.trim().startsWith("<html");
          throw new Error(isHTML
            ? `API route not found (${res1.status}). The server returned an HTML error page.`
            : `Nearby fetch failed (${res1.status})`);
        }

        // Check content type before parsing JSON
        const contentType1 = res1.headers.get("content-type");
        if (!contentType1 || !contentType1.includes("application/json")) {
          const text = await res1.text();
          throw new Error(`Expected JSON but got ${contentType1 || "unknown content type"}`);
        }

        const data1 = await res1.json();
        if (currentNearbyFetchId !== nearbyFetchIdRef.current) return;

        if (data1?.error) {
          throw new Error(data1.error);
        }

        let combined = data1.listings || [];
        const totalNearby = Number(data1.total || combined.length);

        // Removed pagination fetches (No page loops needed for Viewport searching)

        // De-dupe
        const seen = new Set();
        const deduped = [];
        for (const l of combined) {
          const id = l.ListingId || l.Id;
          const keyId =
            id != null
              ? String(id)
              : `${l.Latitude || ""},${l.Longitude || ""},${l.UnparsedAddress || ""}`;
          if (seen.has(keyId)) continue;
          seen.add(keyId);
          deduped.push(l);
        }

        if (currentNearbyFetchId === nearbyFetchIdRef.current) {
          setNearbyListings(deduped);
        }
      } catch (e) {
        if (currentNearbyFetchId === nearbyFetchIdRef.current) {
          setNearbyListings([]);
        }
      }
    }

    fetchNearby();
  }, [
    hasSearchQuery,
    hasSearchResults,
    mapBounds,
    listingType,
    searchQuery,
    filters.minPrice,
    filters.maxPrice,
    filters.minBeds,
    filters.minBaths,
  ]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !mapBounds) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      const polygon = buildPolygon(mapBounds);
      const filterParts = [`geo.intersects(Coordinates, ${polygon})`];
      
      if (listingType === "rent") {
        filterParts.push(`PropertyType eq 'Residential Lease'`);
      } else if (listingType === "new-development") {
        filterParts.push(`NewConstructionYN eq true`);
      } else if (listingType === "sell") {
        filterParts.push(`StandardStatus eq 'Closed'`);
      } else {
        filterParts.push(`PropertyType eq 'Residential' and StandardStatus eq 'Active'`);
      }

      if (filters.minPrice) filterParts.push(`ListPrice ge ${filters.minPrice}`);
      if (filters.maxPrice) filterParts.push(`ListPrice le ${filters.maxPrice}`);
      if (filters.minBeds)  filterParts.push(`BedroomsTotal ge ${filters.minBeds}`);
      if (filters.minBaths) filterParts.push(`BathroomsTotalInteger ge ${filters.minBaths}`);

      const odataFilter = filterParts.join(" and ");
      const url = `/api/bridge/search?$filter=${encodeURIComponent(odataFilter)}&limit=40&page=${nextPage}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load more listings");
      
      const data = await res.json();
      const newListings = data.listings || [];
      
      setListings(prev => [...prev, ...newListings]);
      setPage(nextPage);
      setHasMore(listings.length + newListings.length < totalResults);
    } catch (err) {
      console.error("Load more failed:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Set default view mode based on screen size on mount (mobile: list, desktop: split)
  // This runs only on client to avoid hydration mismatch
  useEffect(() => {
    console.log("I'm the useEffect for the view mode")
    setIsMounted(true);
    // Only check window size on client (useEffect runs only on client)
    const isMobile = window.innerWidth < 768;
    setViewMode(isMobile ? "list" : "split");
  }, []);

  // Set default view mode based on screen size on mount

  useEffect(() => {
    // Only set price filters if they are NOT default values
    // Default: min=0, max=2000000 (no filter applied)
    const DEFAULT_MIN = 0;
    const DEFAULT_MAX = 2000000;
    const SLIDER_MAX = 10000000;

    // Only send minPrice if it's greater than default (0)
    const minPrice = priceRange[0] > DEFAULT_MIN ? priceRange[0].toString() : "";

    // Only send maxPrice if:
    // - It's NOT the default (2000000) - default means no filter
    // - AND it's NOT the slider max (10000000) - slider max means no upper limit
    // So send only if user set a value between default and slider max
    const maxPrice = (priceRange[1] !== DEFAULT_MAX && priceRange[1] !== SLIDER_MAX)
      ? priceRange[1].toString()
      : "";

    setFilters((prev) => {
      // Only update if values actually changed to avoid unnecessary re-renders
      if (prev.minPrice === minPrice && prev.maxPrice === maxPrice) {
        return prev;
      }
      return {
        ...prev,
        minPrice: minPrice,
        maxPrice: maxPrice,
      };
    });
  }, [priceRange]);


  // Fetch suggestions as user types
  useEffect(() => {
    console.log("I'm the useEffect for the suggestions")
    if (!searchInputValue.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/suggestions?q=${encodeURIComponent(searchInputValue.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        } else {
          // If the suggestions API fails (e.g., missing API key), show mock suggestions for UI testing
          setSuggestions([
            { label: "Halifax, NS", type: "city" },
            { label: "Dartmouth, NS", type: "city" },
            { label: "Bedford, NS", type: "city" },
            { label: "123 Main St, Halifax, NS", type: "address" },
            { label: "456 King St, Dartmouth, NS", type: "address" }
          ]);
          setShowSuggestions(true);
        }
      } catch (e) {
        console.error('Failed to fetch suggestions:', e);
        // Mock suggestions for testing when API fails
        setSuggestions([
          { label: "Halifax, NS", type: "city" },
          { label: "Dartmouth, NS", type: "city" },
          { label: "Bedford, NS", type: "city" },
          { label: "123 Main St, Halifax, NS", type: "address" },
          { label: "456 King St, Dartmouth, NS", type: "address" }
        ]);
        setShowSuggestions(true);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchInputValue]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSuggestions && !event.target.closest('.search-input-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  function handleSearch(e) {
    e.preventDefault();
    // Immediate search on Enter/Submit
    const trimmedValue = searchInputValue.trim();
    setSearchQuery(trimmedValue);
    // Don't persist in URL - will clear on refresh/back
  }

  // mapListings is derived DIRECTLY from displayedListings instead of raw listings
  // This ensures map AND list share exactly the SAME properties, including nearby fallbacks.
  const mapListings = useMemo(() => {
    // displayedListings returns either standard viewport matches or nearby default list
    let targetDataset;

    // If searching and we have results, ALWAYS show ALL search results (don't filter by map bounds)
    if (hasSearchQuery && hasSearchResults) {
      targetDataset = pins.length > 0 ? pins : listings; 
    } else if (hasSearchQuery && !hasSearchResults && nearbyListings.length > 0) {
      targetDataset = nearbyListings; // Fallback
    } else {
      targetDataset = pins.length > 0 ? pins : listings; // Map uses pins if available
    }

    const filtered = targetDataset.filter(
      (listing) => {
        // Check multiple possible coordinate field names
        const lat = listing.Latitude || listing.LatitudeDecimal || listing.latitude || listing.lat;
        const lng = listing.Longitude || listing.LongitudeDecimal || listing.longitude || listing.lng || listing.lon;

        // Convert to number and validate
        const latNum = lat != null ? parseFloat(lat) : NaN;
        const lngNum = lng != null ? parseFloat(lng) : NaN;

        // Check if valid numbers and within valid ranges
        return !isNaN(latNum) && !isNaN(lngNum) &&
          latNum >= -90 && latNum <= 90 &&
          lngNum >= -180 && lngNum <= 180;
      }
    );
    return filtered;
  }, [listings, pins, nearbyListings, hasSearchQuery, hasSearchResults]);

  // List uses the same logic
  const displayedListings = useMemo(() => {
    if (hasSearchQuery && hasSearchResults) {
      return listings;
    }
    if (hasSearchQuery && !hasSearchResults && nearbyListings.length > 0) {
      return nearbyListings;
    }
    return listings;
  }, [listings, nearbyListings, hasSearchQuery, hasSearchResults]);

  function formatPriceLabel(value) {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(0)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  }

  function formatPriceInput(value) {
    return `$${value.toLocaleString()}`;
  }

  return (
    <div className="bg-[#0B1F3A] min-h-screen pt-[22px]">
      {/* Smooth fade-in animation for property cards */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out both;
        }
      `}} />

      {/* HEADER sitting on blue */}
      <Header />
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">

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
                <div className="flex-1 relative search-input-container overflow-visible">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  {loading && searchInputValue && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-red-600"></div>
                    </div>
                  )}
                  <input
                    type="text"
                    value={searchInputValue}
                    onChange={(e) => {
                      setSearchInputValue(e.target.value);
                    }}
                    placeholder="Search by address, city..."
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-b-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSearchInputValue(suggestion.label);
                            setSearchQuery(suggestion.label);
                            setSuggestions([]);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                        >
                          {suggestion.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>
            </form>

            {/* Filters */}
            <div className="flex items-center gap-2">

              <div className="relative">
                <button
                  onClick={() => setShowPricePopup(!showPricePopup)}
                  className="toolbar-select flex items-center gap-2"
                >
                  {formatPriceLabel(priceRange[0])} – {formatPriceLabel(priceRange[1])}
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showPricePopup && (
                  <div className="absolute top-12 left-0 bg-white shadow-xl border rounded-xl p-4 w-[340px] z-50">

                    {/* MIN MAX INPUTS */}
                    <div className="flex items-center gap-3 mb-4">

                      <input
                        type="text"
                        value={formatPriceInput(priceRange[0])}
                        onChange={(e) => {
                          const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                          setPriceRange([value, priceRange[1]]);
                        }}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />

                      <span className="text-gray-400 text-sm">to</span>

                      <input
                        type="text"
                        value={formatPriceInput(priceRange[1])}
                        onChange={(e) => {
                          const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                          setPriceRange([priceRange[0], value]);
                        }}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />

                    </div>

                    {/* SLIDER */}
                    <Slider
                      range
                      min={0}
                      max={10000000}
                      step={50000}
                      value={priceRange}
                      onChange={(value) => setPriceRange(value)}
                    />

                  </div>
                )}
              </div>

              <select
                className="toolbar-select"
                value={filters.minBeds || ""}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, minBeds: e.target.value }));
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
                  // Clear all filters
                  setFilters({
                    minPrice: "",
                    maxPrice: "",
                    minBeds: "",
                    minBaths: "",
                    propertyType: "",
                  });
                  // Clear price range
                  setPriceRange([0, 2000000]);
                  // Clear search query
                  setSearchInputValue("");
                  setSearchQuery("");
                }}
              >
                Clear
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`toolbar-toggle ${viewMode === "list" ? "active" : ""}`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("split")}
                className={`toolbar-toggle ${viewMode === "split" ? "active" : ""}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`toolbar-toggle ${viewMode === "map" ? "active" : ""}`}
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

              <button
                onClick={() => setShowMobileFilters(true)}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm"
              >
                Filters
              </button>

              {/* View toggle - List and Map only (no Split on mobile) */}
              <div className="flex border border-gray-300 rounded-lg p-1 ml-auto">
                <button
                  onClick={() => setViewMode("list")}
                  className={`toolbar-toggle ${viewMode === "list" ? "active" : ""}`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`toolbar-toggle ${viewMode === "map" ? "active" : ""}`}
                >
                  <Map className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Row 2 Search */}
            <form onSubmit={handleSearch}>
              <div className="flex gap-2">
                <div className="flex-1 relative search-input-container">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  {loading && searchInputValue && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-red-600"></div>
                    </div>
                  )}
                  <input
                    type="text"
                    value={searchInputValue}
                    onChange={(e) => {
                      setSearchInputValue(e.target.value);
                    }}
                    placeholder="Search..."
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-b-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSearchInputValue(suggestion.label);
                            setSearchQuery(suggestion.label);
                            setSuggestions([]);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                        >
                          {suggestion.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? "..." : "Go"}
                </button>
              </div>
            </form>


          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div
        className="max-w-[1600px] mx-auto bg-white flex flex-col"
        style={{
          height: isMounted && window.innerWidth < 768
            ? 'calc(100vh - 180px)' // Mobile: account for header + filters
            : 'calc(100vh - 100px)', // Desktop (default for SSR)
          overflow: 'hidden'
        }}>
        {/* Title and property count */}
        <div className="px-6 pt-1 flex-shrink-0">
          <h1 className="text-2xl font-bold text-[#091D35]">
            {listingType === "rent"
              ? "Rental Listings"
              : listingType === "new-development"
                ? "New Development Properties"
                : listingType === "sell"
                  ? "Sold Properties"
                  : "Real Estate & Homes for Sale"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? "Searching..." : `${totalResults.toLocaleString()} properties found`}
            {!loading && totalResults > listings.length && (
              <span className="ml-2 text-xs text-gray-400">
                (Showing {listings.length} in list)
              </span>
            )}
          </p>
        </div>

        {/* Split View - Hidden on small devices */}
        {viewMode === "split" && (
          <div className="hidden md:flex flex-1 min-h-0" style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
            {/* Left Panel - Listings - Scrollable with visible scrollbar */}
            <div className="w-1/2 flex flex-col" style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
              <div className="flex-1 overflow-y-scroll px-6 py-4 property-sidebar-scroll" style={{ minHeight: 0, maxHeight: '100%' }}>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-red-600 mb-3"></div>
                    <p className="text-gray-600">Loading properties...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12 text-red-600">{error}</div>
                ) : displayedListings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {mapBounds ? "No properties in this map area. Zoom out or pan." : (isRelatedResults ? "No exact matches found. Showing related properties:" : "No properties found")}
                  </div>
                ) : (
                  <>
                    {isRelatedResults && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>No exact matches found.</strong> Showing related properties based on your search.
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {displayedListings.map((listing, index) => (
                        <div
                          key={listing.ListingId || listing.Id}
                          className="animate-fadeIn"
                          style={{
                            animation: `fadeIn 0.3s ease-in-out ${index * 0.05}s both`
                          }}
                        >
                          <PropertyCard
                            listing={listing}
                            listingType={listingType}
                            priority={index < 2}
                          />
                        </div>
                      ))}
                    </div>

                    {hasMore && (
                      <div className="mt-8 pb-12 text-center">
                        <button
                          onClick={handleLoadMore}
                          disabled={loadingMore}
                          className="px-8 py-3 bg-white border-2 border-[#091D35] text-[#091D35] rounded-xl font-bold hover:bg-[#091D35] hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto shadow-sm"
                        >
                          {loadingMore ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              Loading...
                            </>
                          ) : (
                            "Load More Properties"
                          )}
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
                onBoundsChange={handleBoundsChange}
                searchQuery={searchQuery}
                hasSearchResults={hasSearchResults}
                listingType={listingType}
                onMapClick={onMapClick}
                onZoomChange={() => {}}
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* List Only View - Available on all devices */}
        {viewMode === "list" && (
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-red-600 mb-3"></div>
                <p className="text-gray-600">Loading properties...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">{error}</div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchQuery && searchQuery.trim().length > 0 ? (
                  isRelatedResults ? (
                    <div>
                      <p className="mb-2">No exact matches found for &quot;{searchQuery}&quot;.</p>
                      <p className="text-sm">Try a different search term or browse all properties.</p>
                    </div>
                  ) : (
                    <div>
                      <p className="mb-2">No properties found for &quot;{searchQuery}&quot;.</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  )
                ) : (
                  "No properties found. Try adjusting your filters."
                )}
              </div>
            ) : (
              <>
                {isRelatedResults && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>No exact matches found.</strong> Showing related properties based on your search.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map((listing, index) => (
                    <div
                      key={listing.ListingId || listing.Id}
                      className="animate-fadeIn"
                      style={{
                        animation: `fadeIn 0.3s ease-in-out ${index * 0.05}s both`
                      }}
                    >
                      <PropertyCard listing={listing} listingType={listingType} />
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-12 pb-12 text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-10 py-4 bg-[#091D35] text-white rounded-xl font-bold hover:bg-[#0c2a4d] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto shadow-lg"
                    >
                      {loadingMore ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Loading...
                        </>
                      ) : (
                        "Load More Properties"
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Map Only View - Available on all devices */}
        {viewMode === "map" && (
          <div className="flex-1 min-h-0" style={{ height: '100%', width: '100%', position: 'relative' }}>
            <div
              className="h-full w-full"
              style={{
                height: '100%',
                width: '100%',
                minHeight: '400px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <PropertyListingsMap
                listings={mapListings}
                onBoundsChange={setMapBounds}
                searchQuery={searchQuery}
                hasSearchResults={hasSearchResults}
                listingType={listingType}
                onMapClick={onMapClick}
                onZoomChange={() => {}}
              />
            </div>
          </div>
        )}
      </div>


      {/* MOBILE FILTER PANEL */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-end md:hidden">

          <div className="bg-white w-full rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3 mb-6">

              <h2 className="text-lg font-semibold text-[#091D35]">
                Filters
              </h2>

              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-gray-500 text-lg"
              >
                ✕
              </button>

            </div>
            {/* PRICE */}
            <div className="mb-6">

              <h3 className="text-sm font-semibold mb-3">Price</h3>

              <div className="flex gap-2 mb-4">

                <input
                  type="text"
                  value={formatPriceInput(priceRange[0])}
                  onChange={(e) => {
                    const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                    setPriceRange([value, priceRange[1]]);
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />

                <span className="text-gray-400 self-center">to</span>

                <input
                  type="text"
                  value={formatPriceInput(priceRange[1])}
                  onChange={(e) => {
                    const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                    setPriceRange([priceRange[0], value]);
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />

              </div>

              <Slider
                range
                min={0}
                max={10000000}
                step={50000}
                value={priceRange}
                onChange={(value) => setPriceRange(value)}
              />

            </div>


            {/* BEDROOMS */}
            <div className="mb-6">

              <h3 className="text-sm font-semibold mb-3">Bedrooms</h3>

              <div className="flex gap-2 flex-wrap">

                {["", "1", "2", "3", "4", "5"].map((bed) => (

                  <button
                    key={bed}
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, minBeds: bed }));
                    }}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition
${filters.minBeds === bed
                        ? "bg-[#091D35] text-white border-[#091D35]"
                        : "bg-white border-gray-300 hover:border-red-500"
                      }`}
                  >

                    {bed === "" ? "Any" : `${bed}+`}

                  </button>

                ))}

              </div>

            </div>


            {/* BATHROOMS */}
            <div className="mb-6">

              <h3 className="text-sm font-semibold mb-3">Bathrooms</h3>

              <div className="flex gap-2 flex-wrap">

                {["", "1", "2", "3", "4", "5"].map((bath) => (

                  <button
                    key={bath}
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, minBaths: bath }));
                    }}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition
${filters.minBaths === bath
                        ? "bg-[#091D35] text-white border-[#091D35]"
                        : "bg-white border-gray-300 hover:border-red-500"
                      }`}
                  >

                    {bath === "" ? "Any" : `${bath}+`}

                  </button>

                ))}

              </div>

            </div>


            {/* Footer */}
            <div className="bg-white border-t pt-4 mt-6">

              <div className="flex gap-3">

                <button
                  onClick={() => {
                    // Clear all filters
                    setFilters({
                      minPrice: "",
                      maxPrice: "",
                      minBeds: "",
                      minBaths: "",
                      propertyType: ""
                    });
                    // Clear price range
                    setPriceRange([0, 2000000]);
                    // Clear search query
                    setSearchInputValue("");
                    setSearchQuery("");
                  }}
                  className="flex-1 border border-gray-300 rounded-lg py-3 text-sm font-medium hover:border-red-500"
                >
                  Reset
                </button>

                <button
                  onClick={() => {
                    setShowMobileFilters(false);
                  }}
                  className="flex-1 bg-red-600 text-white rounded-lg py-3 text-sm font-semibold hover:bg-red-700"
                >
                  See Properties
                </button>

              </div>

            </div>

          </div>
        </div>
      )}


    </div>
  );
}