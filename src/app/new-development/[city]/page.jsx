"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import NewDevelopmentCityHero from "@/components/new-development/NewDevelopmentCityHero";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ListingsToolbar from "@/components/buy/ListingsToolbar";
import MobileFilters from "@/components/buy/MobileFilters";
import FeaturedProperties from "@/components/new-development/FeaturedProperties";
import NewDevelopmentCityMap from "@/components/new-development/NewDevelopmentCityMap";

export default function NewDevelopmentCityPage() {
  const params = useParams();

  const [city, setCity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    minBeds: "",
    minBaths: "",
  });

  const [filtersOpen, setFiltersOpen] = useState(false);

  // Data fetching state
  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.city) {
      const decodedCity = decodeURIComponent(params.city)
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      setCity(decodedCity);
    }
  }, [params]);

  // Fetch ALL new development listings for city once
  useEffect(() => {
    async function fetchCityData() {
      if (!city) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/bridge/new-development?city=${encodeURIComponent(city)}&limit=all`);
        if (res.ok) {
          const data = await res.json();
          setAllListings(data.listings || []);
        }
      } catch (err) {
        console.error("Failed to fetch new development city data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCityData();
  }, [city]);

  // Handle Local Filtering
  const filteredListings = useMemo(() => {
    return allListings.filter((item) => {
      // 1. Search Query Filter
      if (debouncedSearchQuery) {
        const q = debouncedSearchQuery.toLowerCase();
        const addressMatch = item.UnparsedAddress?.toLowerCase().includes(q);
        const streetMatch = item.StreetName?.toLowerCase().includes(q);
        const descriptionMatch = item.Description?.toLowerCase().includes(q);
        if (!addressMatch && !streetMatch && !descriptionMatch) return false;
      }

      // 2. Price Filter
      if (filters.minPrice && item.ListPrice < Number(filters.minPrice)) return false;
      if (filters.maxPrice && item.ListPrice > Number(filters.maxPrice)) return false;

      // 3. Beds/Baths Filter
      if (filters.minBeds && (item.BedroomsTotal || 0) < Number(filters.minBeds)) return false;
      if (filters.minBaths && (item.BathroomsTotalInteger || 0) < Number(filters.minBaths)) return false;

      return true;
    });
  }, [allListings, debouncedSearchQuery, filters.minPrice, filters.maxPrice, filters.minBeds, filters.minBaths]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setFiltersOpen(false);
  };

  const handleSearchSubmit = (query) => {
    const q = (query || searchQuery || "").trim();
    if (q) setSearchQuery(q);
  };

  if (!city || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500">Loading new developments in {city || "your city"}...</p>
      </div>
    );
  }

  return (
    <>
      <NewDevelopmentCityHero city={city} />

      <section className="bg-white px-6">
        <div className="max-w-[1600px] mx-auto px-6 pt-6">
          <Breadcrumbs lastLabel={`New Developments in ${city}`} />
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="max-w-[1600px]   px-6">

          <div className="flex  flex-col lg:flex-row lg:items-center lg:justify-between gap-8 px-6 bg-gray-50 py-6 rounded-lg mb-10">

            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#091D35]">
                New Developments in {city}
              </h2>

              <div className="mt-3 h-[3px] w-24 bg-red-600 rounded-full" />

              <p className="mt-4 text-sm md:text-base text-gray-700">
                Found {filteredListings.length} new construction projects.
              </p>
            </div>

            <ListingsToolbar
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onSearchSubmit={handleSearchSubmit}
              onOpenFilters={() => setFiltersOpen(true)}
            />
          </div>

          <FeaturedProperties 
            city={city} 
            filters={filters}
            searchQuery={debouncedSearchQuery}
            initialListings={filteredListings}
            externalLoading={loading}
          />
        </div>
      </section>

      <NewDevelopmentCityMap 
        city={city} 
        filters={filters}
        searchQuery={debouncedSearchQuery}
        listings={filteredListings} 
        externalLoading={loading} 
      />

      <MobileFilters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
      />
    </>
  );
}
