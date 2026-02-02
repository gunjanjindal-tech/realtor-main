"use client";

import { useState } from "react";
import BuyCityHero from "@/components/buy/BuyCityHero";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ListingsToolbar from "@/components/buy/ListingsToolbar";
import MobileFilters from "@/components/buy/MobileFilters";
import FeaturedProperties from "@/components/buy/FeaturedProperties";

export default function CityBuyPage({ params }) {
  const city = decodeURIComponent(params.city)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <>
      {/* HERO */}
      <BuyCityHero city={city} />

      {/* BREADCRUMBS */}
      <section className="bg-white">
        <div className="max-w-[1600px] mx-auto px-6 pt-6">
          <Breadcrumbs city={city} />
        </div>
      </section>

      {/* LISTINGS */}
      <section className="bg-white py-12">
        <div className="max-w-[1600px] mx-auto px-6">
          
          {/* HEADING + TOOLBAR (SAME ROW) */}
         <div className="flex justify-end mb-10">
  <ListingsToolbar onOpenFilters={() => setFiltersOpen(true)} />
</div>


          {/* GRID ONLY (NO HEADING INSIDE) */}
          <FeaturedProperties city={city} />
        </div>
      </section>

      {/* MOBILE FILTER SLIDE-IN */}
      <MobileFilters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
      />
    </>
  );
}
