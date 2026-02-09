"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import NewDevelopmentCityHero from "@/components/new-development/NewDevelopmentCityHero";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import FeaturedProperties from "@/components/new-development/FeaturedProperties";

export default function NewDevelopmentCityPage() {
  const params = useParams();
  const [city, setCity] = useState("");

  useEffect(() => {
    if (params?.city) {
      const decodedCity = decodeURIComponent(params.city)
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      setCity(decodedCity);
    }
  }, [params]);

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
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="max-w-2xl px-6 mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#091D35] leading-tight">
              New Developments in {city}
            </h2>
            <div className="mt-3 h-[3px] w-24 bg-red-600 rounded-full" />
            <p className="mt-4 text-sm md:text-base text-gray-700">
              New construction and pre-construction properties in {city}, Nova Scotia.
            </p>
          </div>

          <FeaturedProperties city={city} />
        </div>
      </section>
    </>
  );
}
