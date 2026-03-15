"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import PropertyCard from "@/components/buy/PropertyCard";
import PropertyListingsMap from "./PropertyListingsMap";
import { Search, Filter, Map, List as ListIcon, LayoutGrid, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

// Higher limit so map shows more properties (API allows it)
const LISTINGS_LIMIT = 200;

export default function PropertyListingsView() {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isRelatedResults, setIsRelatedResults] = useState(false);
  // Separate state for map - fetch ALL properties for map display
  const [allMapListings, setAllMapListings] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);
  // Track map zoom level for dynamic loading
  const [mapZoomLevel, setMapZoomLevel] = useState(12);
  // Track how many pages we've fetched
  const [fetchedPages, setFetchedPages] = useState(1); // Start with 1 page (200 properties)
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


  const limit = LISTINGS_LIMIT;
  const fetchIdRef = useRef(0);
  const mapFetchIdRef = useRef(0);
  const nearbyFetchIdRef = useRef(0);
  const lastNearbyKeyRef = useRef("");

  const hasSearchQuery = searchQuery && searchQuery.trim().length > 0;
  const hasSearchResults = hasSearchQuery && listings.length > 0;

  const [showMobileFilters, setShowMobileFilters] = useState(false);

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

  useEffect(() => {
    const currentFetchId = ++fetchIdRef.current;

    async function fetchListings() {
      setLoading(true);
      setError(null);

      try {
        // For search, use smaller limit for faster initial load, then load more if needed
        const searchLimit = (searchQuery && searchQuery.trim().length > 0) ? 50 : limit;

        const params = new URLSearchParams({
          page: page.toString(),
          limit: searchLimit.toString(),
        });

        const hasSearchQuery = searchQuery && searchQuery.trim().length > 0;

        if (hasSearchQuery) {
          params.append("q", searchQuery.trim());
          if (filters.minPrice && filters.minPrice !== "") params.append("minPrice", filters.minPrice);
          if (filters.maxPrice && filters.maxPrice !== "") params.append("maxPrice", filters.maxPrice);
          if (filters.minBeds && filters.minBeds !== "") params.append("minBeds", filters.minBeds);
          if (filters.minBaths && filters.minBaths !== "") params.append("minBaths", filters.minBaths);

          const response = await fetch(`/api/bridge/search?${params}`);

          if (!response.ok) {
            const errorText = await response.text().catch(() => "Unknown error");
            // Check if response is HTML (404 page) or JSON
            const isHTML = errorText.trim().startsWith("<!DOCTYPE") || errorText.trim().startsWith("<html");
            throw new Error(isHTML
              ? `API route not found (${response.status}). The server returned an HTML error page.`
              : `HTTP error! status: ${response.status}`);
          }

          // Check content type before parsing JSON
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            throw new Error(`Expected JSON but got ${contentType || "unknown content type"}. Response: ${text.substring(0, 100)}`);
          }

          const data = await response.json();

          if (currentFetchId !== fetchIdRef.current) return;

          if (data.error) {
            throw new Error(data.error);
          }

          // Set listings IMMEDIATELY to show results fast
          setListings(data.listings || []);
          setTotal(data.total || 0);
          setIsRelatedResults(data.isRelated || false);
          // Set loading to false immediately after setting listings
          setLoading(false);
        } else {
          if (filters.minPrice && filters.minPrice !== "") params.append("minPrice", filters.minPrice);
          if (filters.maxPrice && filters.maxPrice !== "") params.append("maxPrice", filters.maxPrice);
          if (filters.minBeds && filters.minBeds !== "") params.append("minBeds", filters.minBeds);
          if (filters.minBaths && filters.minBaths !== "") params.append("minBaths", filters.minBaths);

          // Determine API endpoint based on listing type
          let apiUrl;
          if (listingType === "rent") {
            apiUrl = "/api/bridge/rent";
          } else if (listingType === "new-development") {
            apiUrl = "/api/bridge/new-development";
          } else if (listingType === "sell") {
            apiUrl = "/api/bridge/sell";
          } else {
            apiUrl = "/api/bridge/buy"; // Default to buy for sale
          }

          if (process.env.NODE_ENV === "development") {
            console.log("🔍 Fetching listings with filters:", {
              minPrice: filters.minPrice,
              maxPrice: filters.maxPrice,
              minBeds: filters.minBeds,
              minBaths: filters.minBaths,
              url: `${apiUrl}?${params}`
            });
          }

          const response = await fetch(`${apiUrl}?${params}`);

          if (!response.ok) {
            const errorText = await response.text().catch(() => "Unknown error");
            // Check if response is HTML (404 page) or JSON
            const isHTML = errorText.trim().startsWith("<!DOCTYPE") || errorText.trim().startsWith("<html");
            throw new Error(isHTML
              ? `API route not found (${response.status}). The server returned an HTML error page.`
              : `HTTP error! status: ${response.status}`);
          }

          // Check content type before parsing JSON
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            throw new Error(`Expected JSON but got ${contentType || "unknown content type"}. Response: ${text.substring(0, 100)}`);
          }

          const data = await response.json();

          if (currentFetchId !== fetchIdRef.current) return;

          if (data.error) {
            throw new Error(data.error);
          }

          // Set listings IMMEDIATELY to show results fast
          setListings(data.listings || []);
          setTotal(data.total || 0);
          setIsRelatedResults(false); // Not a search, so not related results
          // Set loading to false immediately after setting listings
          setLoading(false);
        }
      } catch (err) {
        if (currentFetchId !== fetchIdRef.current) return;
        setError(err.message);
        console.error("Error fetching listings:", err);
        setLoading(false); // Set loading to false on error too
      }
    }

    fetchListings();
  }, [page, limit, listingType, searchQuery, filters.minPrice, filters.maxPrice, filters.minBeds, filters.minBaths]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filters.minPrice, filters.maxPrice, filters.minBeds, filters.minBaths]);

  // Fetch ALL properties for map (not paginated) - separate from list view
  useEffect(() => {
    const currentMapFetchId = ++mapFetchIdRef.current;

    async function fetchAllMapListings() {
      setMapLoading(true);

      try {
        const params = new URLSearchParams();
        // Always use 200 properties per page for map (consistent pagination)
        // This ensures 200 properties load at once, then more on zoom in
        const mapLimit = 200;
        params.append("limit", mapLimit.toString());
        params.append("page", "1");

        // Include search query if present
        if (searchQuery && searchQuery.trim().length > 0) {
          params.append("q", searchQuery.trim());
        }

        if (filters.minPrice) params.append("minPrice", filters.minPrice);
        if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
        if (filters.minBeds) params.append("minBeds", filters.minBeds);
        if (filters.minBaths) params.append("minBaths", filters.minBaths);

        // Use search API if there's a query, otherwise use appropriate API based on listing type
        let apiUrl;
        if (searchQuery && searchQuery.trim().length > 0) {
          apiUrl = "/api/bridge/search";
        } else if (listingType === "rent") {
          apiUrl = "/api/bridge/rent";
        } else if (listingType === "new-development") {
          apiUrl = "/api/bridge/new-development";
        } else if (listingType === "sell") {
          apiUrl = "/api/bridge/sell";
        } else {
          apiUrl = "/api/bridge/buy"; // Default to buy for sale
        }

        if (process.env.NODE_ENV === "development") {
          console.log("🗺️ Fetching map listings from:", apiUrl);
        }

        // Fetch first page to get total count
        const fullUrl = `${apiUrl}?${params}`;

        if (process.env.NODE_ENV === "development") {
          console.log("🗺️ Fetching map listings from:", fullUrl);
        }

        const response = await fetch(fullUrl);

        if (!response.ok) {
          // Handle 404 and other errors gracefully
          const errorText = await response.text().catch(() => "Unknown error");
          // Check if response is HTML (404 page)
          const isHTML = errorText.trim().startsWith("<!DOCTYPE") || errorText.trim().startsWith("<html");

          console.error(`❌ HTTP error fetching map listings: ${response.status}`, {
            url: fullUrl,
            status: response.status,
            statusText: response.statusText,
            isHTML,
            errorPreview: isHTML ? "HTML error page" : errorText.substring(0, 200)
          });

          // Handle 503 (Service Unavailable) - Bridge API timeout or unavailable
          if (response.status === 503) {
            console.warn("⚠️ Bridge API temporarily unavailable (503). Keeping existing listings or using empty state.");
            // Don't throw - keep existing listings as fallback, or set empty if none exist
            if (allMapListings.length === 0) {
              setAllMapListings([]);
            }
            setMapLoading(false);
            return;
          }

          // For 404, return empty results instead of throwing
          if (response.status === 404) {
            console.warn("⚠️ API route not found (404). This may indicate the route is not available yet or the URL is incorrect.");
            if (allMapListings.length === 0) {
              setAllMapListings([]);
            }
            setMapLoading(false);
            return;
          }

          // For other errors, still handle gracefully but log the error
          console.warn(`⚠️ HTTP error ${response.status} fetching map listings. Keeping existing listings.`);
          if (allMapListings.length === 0) {
            setAllMapListings([]);
          }
          setMapLoading(false);
          return;
        }

        // Check content type before parsing JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("❌ Expected JSON but got:", contentType || "unknown content type", "Response preview:", text.substring(0, 200));
          // For non-JSON responses, return empty results
          if (allMapListings.length === 0) {
            setAllMapListings([]);
          }
          return;
        }

        const data = await response.json();

        if (currentMapFetchId !== mapFetchIdRef.current) return;

        if (data.error) {
          console.error("❌ Error fetching map listings:", data.error);
          // Don't set to empty - keep existing listings as fallback
          if (allMapListings.length === 0) {
            setAllMapListings([]);
          }
        } else {
          let fetchedListings = data.listings || [];
          const totalProperties = data.total || 0;

          if (process.env.NODE_ENV === "development") {
            console.log("✅ Map listings first page:", {
              count: fetchedListings.length,
              total: totalProperties,
            });
          }

          // When SEARCHING: Only use first 200 properties to focus on searched location
          // When NOT searching: Can fetch more pages on zoom in
          if (searchQuery && searchQuery.trim().length > 0) {
            // Limit to exactly 200 properties when searching - this ensures map focuses on search location
            fetchedListings = fetchedListings.slice(0, 200);
            setFetchedPages(1); // Only 1 page when searching
            
            if (process.env.NODE_ENV === "development") {
              console.log("✅ Search: Limited to 200 properties for map focus:", {
                totalFetched: fetchedListings.length,
                totalAvailable: totalProperties
              });
            }
          } else {
            // Not searching: fetch first page, more on zoom in
            const totalPages = Math.ceil(totalProperties / 200);
            const MAX_INITIAL_PAGES = 1;
            setFetchedPages(MAX_INITIAL_PAGES);

            if (process.env.NODE_ENV === "development") {
              console.log("✅ Map listings initial page fetched:", {
                totalFetched: fetchedListings.length,
                pagesFetched: MAX_INITIAL_PAGES,
                totalPages: totalPages
              });
            }
          }

          let allFetchedListings = fetchedListings;

          // Also fetch sold properties from sell API (only if not searching)
          if (!searchQuery || searchQuery.trim().length === 0) {
            try {
              const sellParams = new URLSearchParams({
                page: "1",
                limit: "200", // Bridge API max is 200
              });

              const sellResponse = await fetch(`/api/bridge/sell?${sellParams}`);
              if (sellResponse.ok) {
                // Check content type before parsing JSON
                const contentType = sellResponse.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                  throw new Error(`Sell API returned non-JSON: ${contentType || "unknown"}`);
                }
                const sellData = await sellResponse.json();
                // Pagination: Only fetch first page (200 properties) to prevent too many API calls
                let sellListings = sellData.listings || [];

                // Don't fetch all pages - only first page is enough for map performance
                if (process.env.NODE_ENV === "development") {
                  const sellTotal = sellData.total || 0;
                  if (sellTotal > 200) {
                    console.log("ℹ️ Sold properties: Only fetching first page (200) for map performance");
                  }
                }

                // Mark as from sell API
                const markedSold = sellListings.map(l => ({
                  ...l,
                  StandardStatus: l.StandardStatus || "Sold",
                  Status: l.Status || "Sold",
                  isFromSellAPI: true
                }));

                allFetchedListings = [...allFetchedListings, ...markedSold];

                if (process.env.NODE_ENV === "development") {
                  console.log("✅ Sold properties from sell API:", markedSold.length);
                }
              }
            } catch (err) {
              console.warn("⚠️ Could not fetch sold properties from sell API:", err);
            }
          }

          if (currentMapFetchId === mapFetchIdRef.current) {
            setAllMapListings(allFetchedListings);
            if (process.env.NODE_ENV === "development") {
              console.log("✅ Total map listings (including sold):", allFetchedListings.length);
            }
          }
        }
      } catch (err) {
        if (currentMapFetchId === mapFetchIdRef.current) {
          // Determine API URL for error logging
          let errorApiUrl;
          if (searchQuery && searchQuery.trim().length > 0) {
            errorApiUrl = "/api/bridge/search";
          } else if (listingType === "rent") {
            errorApiUrl = "/api/bridge/rent";
          } else if (listingType === "new-development") {
            errorApiUrl = "/api/bridge/new-development";
          } else if (listingType === "sell") {
            errorApiUrl = "/api/bridge/sell";
          } else {
            errorApiUrl = "/api/bridge/buy";
          }

          // Handle network errors and timeouts gracefully
          const isNetworkError = err.message.includes("network") ||
            err.message.includes("timeout") ||
            err.message.includes("503") ||
            err.message.includes("Service Unavailable");

          if (isNetworkError) {
            console.warn("⚠️ Network error or timeout fetching map listings. Keeping existing listings or using empty state.");
          } else {
            console.error("❌ Error fetching all map listings:", {
              error: err.message,
              stack: err.stack,
              apiUrl: errorApiUrl,
              listingType,
              hasSearchQuery: !!(searchQuery && searchQuery.trim().length > 0)
            });
          }
          // Don't clear existing listings on error - keep them as fallback
          if (allMapListings.length === 0) {
            setAllMapListings([]);
          }
        }
      } finally {
        if (currentMapFetchId === mapFetchIdRef.current) {
          setMapLoading(false);
        }
      }
    }

    fetchAllMapListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingType, searchQuery, filters.minPrice, filters.maxPrice, filters.minBeds, filters.minBaths]);

  // Dynamic loading: Fetch more properties when user zooms in
  useEffect(() => {
    // Don't fetch more if searching (search results are already limited)
    if (searchQuery && searchQuery.trim().length > 0) {
      return;
    }

    // Don't fetch if already loading
    if (mapLoading) {
      return;
    }

    // Determine how many pages to fetch based on zoom level
    // Each page = 200 properties
    // Zoom < 10: 1 page (200 properties) - zoomed out
    // Zoom 10-12: 3 pages (600 properties) - moderate zoom
    // Zoom 13-15: 5 pages (1000 properties) - zoomed in
    // Zoom > 15: 10 pages (2000 properties) - very zoomed in
    let targetPages;
    if (mapZoomLevel < 10) {
      targetPages = 1; // Zoomed out - 200 properties
    } else if (mapZoomLevel <= 12) {
      targetPages = 3; // Moderate zoom - 600 properties
    } else if (mapZoomLevel <= 15) {
      targetPages = 5; // Zoomed in - 1000 properties
    } else {
      targetPages = 10; // Very zoomed in - 2000 properties
    }

    // Only fetch if we need more pages
    if (targetPages <= fetchedPages) {
      return;
    }

    // Debounce: Wait 2000ms after zoom stops changing to prevent map refresh during zoom
    // Increased delay to ensure zoom animation completes, markers update, and user has stopped zooming
    const timeoutId = setTimeout(async () => {
      const currentFetchId = ++mapFetchIdRef.current;

      try {
        const params = new URLSearchParams();
        params.append("limit", "200");

        if (filters.minPrice) params.append("minPrice", filters.minPrice);
        if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
        if (filters.minBeds) params.append("minBeds", filters.minBeds);
        if (filters.minBaths) params.append("minBaths", filters.minBaths);

        // Determine API endpoint
        let apiUrl;
        if (listingType === "rent") {
          apiUrl = "/api/bridge/rent";
        } else if (listingType === "new-development") {
          apiUrl = "/api/bridge/new-development";
        } else if (listingType === "sell") {
          apiUrl = "/api/bridge/sell";
        } else {
          apiUrl = "/api/bridge/buy";
        }

        // Fetch additional pages (from fetchedPages + 1 to targetPages)
        const pagesToFetch = [];
        for (let page = fetchedPages + 1; page <= targetPages; page++) {
          pagesToFetch.push(page);
        }

        if (pagesToFetch.length === 0) {
          return; // No pages to fetch
        }

        if (process.env.NODE_ENV === "development") {
          console.log(`📥 [MAP] Fetching additional pages ${pagesToFetch.join(', ')} for zoom level ${mapZoomLevel}`);
        }

        // Fetch pages in parallel (but limit to 3 at a time to avoid overwhelming)
        const fetchPromises = pagesToFetch.slice(0, 3).map(async (page) => {
          const pageParams = new URLSearchParams(params);
          pageParams.set("page", page.toString());

          try {
            const response = await fetch(`${apiUrl}?${pageParams}`);
            if (response.ok) {
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                return data.listings || [];
              }
            }
            return [];
          } catch (err) {
            if (process.env.NODE_ENV === "development") {
              console.warn(`⚠️ Failed to fetch page ${page}:`, err.message);
            }
            return [];
          }
        });

        const results = await Promise.all(fetchPromises);
        const newListings = results.flat();

        if (currentFetchId === mapFetchIdRef.current && newListings.length > 0) {
          // Use functional update to merge smoothly without causing full refresh
          setAllMapListings(prev => {
            // Merge new listings, avoiding duplicates
            const existingIds = new Set(prev.map(l => l.ListingId || l.Id || l.MlsNumber));
            const uniqueNew = newListings.filter(l => {
              const id = l.ListingId || l.Id || l.MlsNumber;
              return id && !existingIds.has(id);
            });

            // Only update if we have new listings to prevent unnecessary re-renders
            if (uniqueNew.length === 0) {
              return prev; // No change, return same reference
            }

            return [...prev, ...uniqueNew];
          });
          setFetchedPages(targetPages);

          if (process.env.NODE_ENV === "development") {
            console.log(`✅ [MAP] Loaded ${newListings.length} additional properties. Total pages: ${targetPages}`);
          }
        }
      } catch (err) {
        // Handle network errors gracefully - don't break the map
        const isNetworkError = err.message.includes("network") ||
          err.message.includes("timeout") ||
          err.message.includes("503");

        if (isNetworkError) {
          if (process.env.NODE_ENV === "development") {
            console.warn("⚠️ Network error fetching additional map listings. Will retry on next zoom.");
          }
        } else {
          if (process.env.NODE_ENV === "development") {
            console.error("❌ Error fetching additional map listings:", err);
          }
        }
      }
    }, 1000); // 1000ms debounce - wait longer to prevent refresh during zoom

    return () => clearTimeout(timeoutId);
  }, [mapZoomLevel, fetchedPages, mapLoading, searchQuery, listingType, filters.minPrice, filters.maxPrice, filters.minBeds, filters.minBaths]);

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

    async function fetchNearby() {
      try {
        const params = new URLSearchParams({
          type: listingType,
          page: "1",
          limit: "200",
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

        // Fetch one more page for better coverage (limit to 2 pages for faster load)
        const totalPages = Math.min(Math.ceil(totalNearby / 200), 2);
        if (totalPages > 1) {
          const p2 = new URLSearchParams(params);
          p2.set("page", "2");
          const res2 = await fetch(`/api/bridge/nearby?${p2}`);
          if (res2.ok) {
            const contentType2 = res2.headers.get("content-type");
            if (contentType2 && contentType2.includes("application/json")) {
              const data2 = await res2.json();
              if (currentNearbyFetchId !== nearbyFetchIdRef.current) return;
              if (!data2?.error) {
                combined = [...combined, ...(data2.listings || [])];
              }
            }
          }
        }

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
    nearbyListings.length,
  ]);

  // Set default view mode based on screen size on mount (mobile: list, desktop: split)
  // This runs only on client to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    // Only check window size on client (useEffect runs only on client)
    const isMobile = window.innerWidth < 768;
    setViewMode(isMobile ? "list" : "split");
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPagination = totalPages > 1;

  // Real-time search as user types (debounced) - smooth and responsive
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const trimmedValue = searchInputValue.trim();
      if (trimmedValue !== searchQuery) {
        setSearchQuery(trimmedValue);
        setPage(1);
        // Don't update URL - let it clear on refresh/back
      }
    }, 300); // 300ms debounce - balanced for smooth UX and API calls

    return () => clearTimeout(timeoutId);
  }, [searchInputValue, searchQuery]);

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


  function handleSearch(e) {
    e.preventDefault();
    // Immediate search on Enter/Submit
    const trimmedValue = searchInputValue.trim();
    setSearchQuery(trimmedValue);
    setPage(1);
    // Don't persist in URL - will clear on refresh/back
  }

  // Listings with valid coordinates for map - prioritize search results (exact or related), then allMapListings
  const mapListings = useMemo(() => {
    // Source selection:
    // - If searching and we have search results: ALWAYS prioritize `listings` (they have search results immediately)
    //   Then merge with allMapListings when it loads (to get all pages if available)
    // - If search returned 0: use `nearbyListings` (bounds-based) fallback; else fall back to `allMapListings`
    // - If not searching: use `allMapListings` for full map view
    let sourceListings;

    if (hasSearchQuery) {
      if (hasSearchResults) {
        // When searching and we have results, ALWAYS use listings FIRST (they have search results immediately)
        // This ensures search results show on map right away, even if allMapListings is still loading
        if (listings.length > 0) {
          // Start with listings (search results)
          const listingIds = new Set();
          listings.forEach(l => {
            const id = l.ListingId || l.Id || l.MlsNumber || l.MLSNumber;
            if (id) listingIds.add(String(id));
          });

          // Then merge with allMapListings if available (to get all pages)
          if (allMapListings.length > 0) {
            const additionalFromAllMap = allMapListings.filter(l => {
              const id = l.ListingId || l.Id || l.MlsNumber || l.MLSNumber;
              return id && !listingIds.has(String(id));
            });
            sourceListings = [...listings, ...additionalFromAllMap];
          } else {
            // allMapListings not loaded yet, use listings immediately so markers show right away
            sourceListings = listings;
          }
        } else if (allMapListings.length > 0) {
          // Fallback: if listings is empty but allMapListings has data, use it
          sourceListings = allMapListings;
        } else {
          // Both empty, use empty array
          sourceListings = [];
        }
      } else {
        // Search returned 0 results, use nearbyListings fallback
        sourceListings = nearbyListings.length > 0 ? nearbyListings : allMapListings;
      }
    } else {
      // Not searching, use allMapListings for full map view
      sourceListings = allMapListings.length > 0 ? allMapListings : listings;
    }

    const filtered = sourceListings.filter(
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

    // Debug: Log when search is active to verify related properties are being passed
    if (hasSearchQuery) {
      console.log("🗺️ Map Listings for Search:", {
        searchQuery,
        isRelatedResults,
        totalListings: listings.length,
        allMapListingsCount: allMapListings.length,
        sourceListingsCount: sourceListings.length,
        listingsWithCoords: filtered.length,
        source: hasSearchResults
          ? (listings.length > 0
            ? (allMapListings.length > 0 ? "merged (listings + allMapListings)" : "listings (immediate)")
            : (allMapListings.length > 0 ? "allMapListings (fallback)" : "empty"))
          : (nearbyListings.length > 0 ? "nearbyListings (bounds fallback)" : "allMapListings (fallback)"),
        sampleCoords: filtered.length > 0 ? {
          lat: filtered[0].Latitude || filtered[0].LatitudeDecimal,
          lng: filtered[0].Longitude || filtered[0].LongitudeDecimal
        } : null,
        sampleListing: filtered.length > 0 ? {
          address: filtered[0].Address || filtered[0].FullAddress || filtered[0].StreetAddress,
          id: filtered[0].ListingId || filtered[0].Id || filtered[0].MlsNumber
        } : null
      });
    }

    // Note: Pagination is now handled in PropertyListingsMapGoogle based on zoom level
    // We pass all filtered listings here, and the map component will limit based on zoom
    // This allows zoom in to show all properties, zoom out to show limited (300)
    return filtered;
  }, [allMapListings, listings, hasSearchQuery, hasSearchResults, nearbyListings, searchQuery, isRelatedResults]);

  // When map is zoomed/panned: show listings in visible area + buffer so bagal (nearby) properties stay visible
  // IMPORTANT: When searching and results found, ALWAYS show ALL search results (don't filter by map bounds)
  const displayedListings = useMemo(() => {
    // If searching and we have results, ALWAYS show ALL search results (don't filter by map bounds)
    if (hasSearchQuery && hasSearchResults) {
      return listings; // Show all search results regardless of map bounds
    }

    if (!mapBounds) {
      if (hasSearchQuery && !hasSearchResults && nearbyListings.length > 0) return nearbyListings;
      return listings;
    }

    // When search returned 0 results, prefer nearbyListings (already bounds-based).
    // Otherwise use allMapListings for accurate "visible on map" filtering.
    const sourceListings =
      hasSearchQuery && !hasSearchResults && nearbyListings.length > 0
        ? nearbyListings
        : (allMapListings.length > 0 ? allMapListings : listings);

    const { north, south, east, west } = mapBounds;
    return sourceListings.filter((listing) => {
      const lat = parseFloat(listing.Latitude || listing.LatitudeDecimal);
      const lng = parseFloat(listing.Longitude || listing.LongitudeDecimal);
      if (isNaN(lat) || isNaN(lng)) return false;
      return lat >= south && lat <= north && lng >= west && lng <= east;
    });
  }, [listings, allMapListings, nearbyListings, mapBounds, hasSearchQuery, hasSearchResults]);

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
                <div className="flex-1 relative">
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
                      setPage(1);
                    }}
                    placeholder="Search by address, city..."
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                  />
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
                  // Reset to page 1
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
                <div className="flex-1 relative">
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
                      setPage(1);
                    }}
                    placeholder="Search..."
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                  />
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
        className="w-full pt-10 mx-auto bg-white flex flex-col"
        style={{
          height: isMounted && window.innerWidth < 768
            ? 'calc(100vh - 180px)' // Mobile: account for header + filters
            : 'calc(100vh - 100px)', // Desktop (default for SSR)
          overflow: 'hidden'
        }}>
       

        {/* Split View - Hidden on small devices */}
        {viewMode === "split" && (
          <div className="hidden md:flex flex-1 min-h-0" style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
            {/* Left Panel - Listings - Scrollable with visible scrollbar */}
            <div className="w-1/2 flex flex-col" style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
              <div className="flex-1 overflow-y-scroll px-6 py-4 property-sidebar-scroll" style={{ minHeight: 0, maxHeight: '100%' }}>
                {loading && page === 1 ? (
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
                searchQuery={searchQuery}
                hasSearchResults={hasSearchResults}
                listingType={listingType}
                onMapClick={(locationName) => {
                  // Update search when map is clicked
                  setSearchInputValue(locationName);
                  setSearchQuery(locationName);
                  setPage(1);
                }}
                onZoomChange={(zoom) => {
                  setMapZoomLevel(zoom);
                }}
              />
            </div>
          </div>
        )}

        {/* List Only View - Available on all devices */}
        {viewMode === "list" && (
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            {loading && page === 1 ? (
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
                onMapClick={(locationName) => {
                  // Update search when map is clicked
                  setSearchInputValue(locationName);
                  setSearchQuery(locationName);
                  setPage(1);
                }}
                onZoomChange={(zoom) => {
                  setMapZoomLevel(zoom);
                }}
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
                      setPage(1);
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
                      setPage(1);
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
                    // Reset to page 1
                    setPage(1);
                  }}
                  className="flex-1 border border-gray-300 rounded-lg py-3 text-sm font-medium hover:border-red-500"
                >
                  Reset
                </button>

                <button
                  onClick={() => {
                    setShowMobileFilters(false);
                    setPage(1);
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