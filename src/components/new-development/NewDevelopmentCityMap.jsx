"use client";

import { useEffect, useState, useMemo } from "react";
import PropertyListingsMap from "@/components/listings/PropertyListingsMap";

export default function NewDevelopmentCityMap({ city, filters = {}, searchQuery = "", listings = null, externalLoading = false }) {
  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If listings are provided via prop and loading is finished, use them
    if (listings !== null && !externalLoading) {
      setAllListings(listings);
      setLoading(false);
      return;
    }

    // Still use listings if they are provided, but respect externalLoading
    if (listings && listings.length > 0) {
      setAllListings(listings);
      if (!externalLoading) setLoading(false);
      return;
    }

    async function fetchAllCityListings() {
      if (!city && !searchQuery) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: "1", limit: "200" });
        const hasSearchQuery = searchQuery && searchQuery.trim().length > 0;

        if (hasSearchQuery) {
          params.append("q", searchQuery.trim());
          if (filters.minPrice) params.append("minPrice", filters.minPrice);
          if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
          if (filters.minBeds) params.append("minBeds", filters.minBeds);
          if (filters.minBaths) params.append("minBaths", filters.minBaths);

          const res = await fetch(`/api/bridge/search?${params}`);
          if (!res.ok) {
            setAllListings([]);
            setLoading(false);
            return;
          }
          const data = await res.json();
          let fetchedListings = data.listings || [];
          fetchedListings = fetchedListings.filter(listing => {
            const yearBuilt = listing.YearBuilt || 0;
            const currentYear = new Date().getFullYear();
            const isNewDev = (currentYear - yearBuilt) <= 5;
            const subType = (listing.PropertySubType || "").toLowerCase();
            return isNewDev || subType.includes("new") || subType.includes("pre-construction");
          });
          fetchedListings = fetchedListings.filter((l) => (l.Latitude || l.LatitudeDecimal) && (l.Longitude || l.LongitudeDecimal));
          setAllListings(fetchedListings);
          setLoading(false);
          return;
        }

        params.append("city", city);
        if (filters.minPrice) params.append("minPrice", filters.minPrice);
        if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
        if (filters.minBeds) params.append("minBeds", filters.minBeds);
        if (filters.minBaths) params.append("minBaths", filters.minBaths);

        const res = await fetch(`/api/bridge/new-development?${params}`);
        if (!res.ok) throw new Error("Failed to fetch properties");
        const data = await res.json();
        let fetchedListings = data.listings || [];
        const total = data.total || 0;
        const totalPages = Math.ceil(total / 200);

        if (totalPages > 1) {
          const pagePromises = [];
          for (let page = 2; page <= totalPages; page++) {
            const pageParams = new URLSearchParams(params);
            pageParams.set("page", page.toString());
            pagePromises.push(
              fetch(`/api/bridge/new-development?${pageParams}`)
                .then(res => res.ok ? res.json() : null)
                .then(pageData => pageData?.listings || [])
                .catch(() => [])
            );
          }
          const additionalListingsArrays = await Promise.all(pagePromises);
          fetchedListings = [...fetchedListings, ...additionalListingsArrays.flat()];
        }

        fetchedListings = fetchedListings.filter((l) => (l.Latitude || l.LatitudeDecimal) && (l.Longitude || l.LongitudeDecimal));
        setAllListings(fetchedListings);
      } catch (err) {
        console.error("Map error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (!externalLoading && listings === null) {
      fetchAllCityListings();
    }
  }, [city, filters.minPrice, filters.maxPrice, filters.minBeds, filters.minBaths, searchQuery, listings, externalLoading]);

  // Use externalLoading if provided, otherwise fallback to local loading
  // BUT: if we have listings prop and we are NOT externally loading, we should NOT show the spinner.
  const isCurrentlyLoading = externalLoading || (loading && listings === null);

  if (isCurrentlyLoading && allListings.length === 0) {
    return (
      <section className="bg-white py-14">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="h-[600px] flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#091d35] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading all properties on map...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white py-14">
        <div className="max-w-[1600px] mx-auto px-6">
          <p className="text-red-600">Error loading map: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white pb-14">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="mb-12 max-w-3xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
           New Development Locations
          </span>

          <h2 className="mt-3 text-4xl md:text-5xl font-extrabold text-[#091D35]">
          Discover New Developments in {city}
          </h2>
 <div className="mt-6 h-[3px] w-24 bg-red-600" />
          <p className="mt-6 text-gray-600">
            Showing {allListings.length} properties with map coordinates.
          </p>
        </div>

        <div
          className="relative overflow-hidden rounded-2xl shadow-2xl"
          style={{ height: "600px" }}
        >
          <PropertyListingsMap listings={allListings} loading={isCurrentlyLoading} />
        </div>
      </div>
    </section>
  );
}

