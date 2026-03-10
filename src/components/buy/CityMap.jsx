"use client";

import { useEffect, useState, useMemo } from "react";
import PropertyListingsMap from "@/components/listings/PropertyListingsMap";

export default function CityMap({ city, filters = {} }) {
  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAllCityListings() {
      if (!city) return;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "200", // Bridge API max is 200 per request
        });

        params.append("city", city);

        if (filters.minPrice) params.append("minPrice", filters.minPrice);
        if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
        if (filters.minBeds) params.append("minBeds", filters.minBeds);
        if (filters.minBaths) params.append("minBaths", filters.minBaths);

        // Fetch first page to get total count
        const res = await fetch(`/api/bridge/buy?${params}`);

        if (!res.ok) throw new Error("Failed to fetch properties");

        const data = await res.json();
        let fetchedListings = data.listings || [];
        const total = data.total || 0;

        // Calculate total pages needed (200 per page)
        const totalPages = Math.ceil(total / 200);

        // Fetch ALL remaining pages in parallel for faster loading
        if (totalPages > 1) {
          const pagePromises = [];

          // Create promises for all remaining pages (2, 3, 4, ... totalPages)
          for (let page = 2; page <= totalPages; page++) {
            const pageParams = new URLSearchParams(params);
            pageParams.set("page", page.toString());

            pagePromises.push(
              fetch(`/api/bridge/buy?${pageParams}`)
                .then(res => res.ok ? res.json() : null)
                .then(pageData => pageData?.listings || [])
                .catch(err => {
                  console.warn(`Failed to fetch page ${page} for city map:`, err);
                  return [];
                })
            );
          }

          // Wait for all pages to fetch in parallel
          const additionalListingsArrays = await Promise.all(pagePromises);

          // Flatten all results into single array
          const additionalListings = additionalListingsArrays.flat();
          fetchedListings = [...fetchedListings, ...additionalListings];
        }

        const totalFetched = fetchedListings.length;

        // REMOVE listings without coordinates
        fetchedListings = fetchedListings.filter(
          (l) =>
            (l.Latitude || l.LatitudeDecimal) &&
            (l.Longitude || l.LongitudeDecimal)
        );

        setAllListings(fetchedListings);

        if (process.env.NODE_ENV === "development") {
          console.log(`🗺️ City Map (${city})`, {
            totalProperties: total,
            fetchedAllPages: totalFetched,
            withCoordinates: fetchedListings.length,
            pagesFetched: totalPages,
          });
        }
      } catch (err) {
        console.error("Map error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAllCityListings();
  }, [city, filters.minPrice, filters.maxPrice, filters.minBeds, filters.minBaths]);

  if (loading) {
    return (
      <section className="bg-white py-24">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="h-[600px] flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#091d35] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading all properties on map...</p>
            <p className="text-sm text-gray-400 mt-2">Fetching all pages...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white py-24">
        <div className="max-w-[1600px] mx-auto px-6">
          <p className="text-red-600">Error loading map: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-24">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="mb-12 max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Property Locations
          </span>

          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-[#091D35]">
            All Properties in {city} on Map
          </h2>

          <p className="mt-6 text-gray-600">
            Showing {allListings.length} properties with map coordinates.
          </p>
        </div>

        <div
          className="relative overflow-hidden rounded-2xl shadow-2xl"
          style={{ height: "600px" }}
        >
          <PropertyListingsMap listings={allListings} />
        </div>
      </div>
    </section>
  );
}