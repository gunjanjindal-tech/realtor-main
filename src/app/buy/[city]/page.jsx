"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import BuyCityHero from "@/components/buy/BuyCityHero";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ListingsToolbar from "@/components/buy/ListingsToolbar";
import MobileFilters from "@/components/buy/MobileFilters";
import FeaturedProperties from "@/components/buy/FeaturedProperties";
import CityMap from "@/components/buy/CityMap";

export default function CityBuyPage() {
  const params = useParams();
  const router = useRouter();
  const [city, setCity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const debounceTimerRef = useRef(null);
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

  // Fetch ALL city listings once
  useEffect(() => {
    async function fetchCityData() {
      if (!city) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/bridge/buy?city=${encodeURIComponent(city)}&limit=all`);
        if (res.ok) {
          const data = await res.json();
          setAllListings(data.listings || []);
        }
      } catch (err) {
        console.error("Failed to fetch city data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCityData();
  }, [city]);

  // Handle Local Filtering
  const filteredListings = useMemo(() => {
    return allListings.filter((item) => {
      // 1. Search Query Filter (local address/city/street check)
      if (debouncedSearchQuery) {
        const q = debouncedSearchQuery.toLowerCase();
        const addressMatch = item.UnparsedAddress?.toLowerCase().includes(q);
        const streetMatch = item.StreetName?.toLowerCase().includes(q);
        const cityMatch = item.City?.toLowerCase().includes(q);
        if (!addressMatch && !streetMatch && !cityMatch) return false;
      }

      // 2. Price Filter
      if (filters.minPrice && item.ListPrice < Number(filters.minPrice)) return false;
      if (filters.maxPrice && item.ListPrice > Number(filters.maxPrice)) return false;

      // 3. Beds/Baths Filter
      if (filters.minBeds && (item.BedroomsTotal || 0) < Number(filters.minBeds)) return false;
      if (filters.minBaths && (item.BathroomsTotalInteger || 0) < Number(filters.minBaths)) return false;

      return true;
    });
  }, [allListings, debouncedSearchQuery, filters]);

  // Debounce search query
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
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
        <p className="text-gray-500">Loading properties in {city || "your city"}...</p>
      </div>
    );
  }

  return (
    <>
      {/* HERO */}
      <BuyCityHero city={city} />

      {/* BREADCRUMBS omitted as per existing code */}

      {/* LISTINGS */}
      <section className="bg-white py-12">
        <div className="max-w-[1600px] px-6 ">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 px-6 bg-gray-50 py-6 rounded-lg mb-10">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#091D35] leading-tight">
                Homes for Sale in {city}
              </h2>
              <div className="mt-3 h-[3px] w-24 bg-red-600 rounded-full " />
              <p className="mt-4 text-sm md:text-base text-gray-700">
                Found {filteredListings.length} properties matching your search.
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

      <CityMap 
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
