"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import NewDevelopmentCityHero from "@/components/new-development/NewDevelopmentCityHero";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ListingsToolbar from "@/components/buy/ListingsToolbar";
import MobileFilters from "@/components/buy/MobileFilters";
import FeaturedProperties from "@/components/new-development/FeaturedProperties";

export default function NewDevelopmentCityPage() {
  const params = useParams();

  const [city, setCity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    minBeds: "",
    minBaths: "",
  });

  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (params?.city) {
      const decodedCity = decodeURIComponent(params.city)
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      setCity(decodedCity);
    }
  }, [params]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setFiltersOpen(false);
  };

  const handleSearchSubmit = (query) => {
    const q = (query || searchQuery || "").trim();
    if (q) {
      window.location.href = `/search?q=${encodeURIComponent(q)}`;
    }
  };

  if (!city) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
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
                Verified MLS listings, pre-construction homes, and investment opportunities.
              </p>
            </div>

            <ListingsToolbar
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onSearchSubmit={handleSearchSubmit}
              onOpenFilters={() => setFiltersOpen(true)}
            />
          </div>

          <FeaturedProperties city={city} filters={filters} />
        </div>
      </section>

      <MobileFilters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApplyFilters={handleApplyFilters}
      />
    </>
  );
}
