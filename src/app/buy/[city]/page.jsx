"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import BuyCityHero from "@/components/buy/BuyCityHero";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ListingsToolbar from "@/components/buy/ListingsToolbar";
import MobileFilters from "@/components/buy/MobileFilters";
import FeaturedProperties from "@/components/buy/FeaturedProperties";

export default function CityBuyPage() {
  const params = useParams();
  const router = useRouter();
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
      router.push(`/search?q=${encodeURIComponent(q)}`);
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
      {/* HERO */}
      <BuyCityHero city={city} />

      {/* BREADCRUMBS */}
      <section className="bg-white px-6">
        <div className="max-w-[1600px] mx-auto px-6 pt-6">
          <Breadcrumbs city={city} />
        </div>
      </section>

     {/* LISTINGS */}
<section className="bg-white py-12">
  <div className="max-w-[1600px] mx-auto px-6 ">

    {/* HEADER ROW */}
<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 px-6 bg-gray-50 py-6 rounded-lg mb-10">

  {/* LEFT */}
  <div className="max-w-2xl">
    <h2 className="text-3xl md:text-4xl font-extrabold text-[#091D35] leading-tight">
      Homes for Sale in {city}
    </h2>

    <div className="mt-3 h-[3px] w-24 bg-red-600 rounded-full" />

    <p className="mt-4 text-sm md:text-base text-gray-700">
      Verified MLS listings, local market insight, and expert guidance — all in one place.
    </p>

    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-red-600">
      <span>• Verified listings</span>
      <span>• Local market expertise</span>
      <span>• No pressure buying</span>
    </div>
  </div>

  {/* RIGHT */}
  <ListingsToolbar
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            onOpenFilters={() => setFiltersOpen(true)}
          />
</div>





    {/* GRID */}
    <FeaturedProperties city={city} filters={filters} />
  </div>
</section>


      {/* MOBILE FILTER SLIDE-IN */}
      <MobileFilters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApplyFilters={handleApplyFilters}
      />
    </>
  );
}
