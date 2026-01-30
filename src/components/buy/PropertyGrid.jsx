"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import PropertyCard from "./PropertyCard";

export default function PropertyGrid() {
  const searchParams = useSearchParams();
  const city = searchParams.get("city");

  const [listings, setListings] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef(null);

  async function loadListings(reset = false) {
    if (loading) return;
    setLoading(true);

   const res = await fetch(
  `/api/bridge/buy?limit=12&offset=${offset}&city=${city}`
);

    const data = await res.json();
    const newItems = data.bundle || [];

    setListings((prev) => (reset ? newItems : [...prev, ...newItems]));
    setOffset((prev) => prev + 12);
    setLoading(false);
  }

  // Reload when city changes
  useEffect(() => {
    setOffset(0);
    loadListings(true);
  }, [city]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && loadListings(),
      { threshold: 1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [offset]);

  return (
    <section className="bg-white py-20">
      <div className="max-w-[1600px] mx-auto px-6">

        {city && (
          <h3 className="mb-10 text-2xl font-bold text-[#091D35]">
            Homes for Sale in {city}
          </h3>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {listings.map((item) => (
            <PropertyCard key={item.ListingId} listing={item} />
          ))}
        </div>

        <div ref={loaderRef} className="h-20 flex justify-center items-center">
          {loading && <span className="text-gray-500">Loading...</span>}
        </div>
      </div>
    </section>
  );
}
