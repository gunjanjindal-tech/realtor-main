"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PropertyCard from "./buy/PropertyCard";

export default function FeaturedProperties() {
  const router = useRouter();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      try {
        setLoading(true);
        const res = await fetch(`/api/bridge/buy?page=1&limit=6`);

        if (!res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            const errorData = await res.json();
            if (process.env.NODE_ENV === "development") {
              console.error("❌ [HOME] API Error:", errorData);
            }
          } else {
            if (process.env.NODE_ENV === "development") {
              console.error("❌ [HOME] API returned non-JSON response");
            }
          }
          setListings([]);
          return;
        }

        const contentType = res.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          console.error("❌ [HOME] API returned non-JSON response");
          setListings([]);
          return;
        }

        const data = await res.json();
        if (process.env.NODE_ENV === "development") {
          console.log("📊 [HOME] Featured Properties received:", {
            listingsCount: data.listings?.length || 0,
            total: data.total,
          });
        }

        setListings(data.listings || data.bundle || []);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("❌ [HOME] Failed to fetch featured listings", err);
        }
        setListings([]);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, []);

  return (
    <section className="bg-white py-24 overflow-hidden">
      <div className="mx-auto max-w-[1600px] px-6">

        {/* Heading */}
        <div className="mb-16 max-w-3xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Featured Listings
          </span>

          <h2 className="mt-3 text-4xl font-bold text-[#091D35]">
            Handpicked Homes Across Nova Scotia
          </h2>

          <div className="mt-4 h-[3px] w-24 bg-red-600" />

          <p className="mt-6 text-lg text-gray-600">
            Discover a curated selection of exceptional properties,
            chosen for their location, design, and lifestyle appeal.
          </p>
        </div>
      </div>

      {/* 🔥 MOBILE SCROLL / DESKTOP GRID */}
      {loading ? (
        <div className="text-center py-20">
          <p className="text-gray-500">Loading featured properties...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500">No featured properties available at the moment.</p>
        </div>
      ) : (
        <div
          className="
            flex gap-6 overflow-x-auto px-6
            snap-x snap-mandatory scroll-px-6
            sm:grid sm:grid-cols-2 sm:gap-10 sm:overflow-visible sm:px-6
            md:grid-cols-3 scrollbar-hide
          "
        >
          {listings.map((listing, index) => (
            <div
              key={listing.ListingId || listing.Id}
              className="snap-start min-w-[280px] sm:min-w-0"
            >
              <PropertyCard listing={listing} priority={index === 0} />
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-16 flex justify-center">
        <button
          onClick={() => router.push("/buy")}
          className="rounded-full bg-red-600 px-10 py-4 text-sm font-semibold tracking-wide text-white transition hover:bg-red-700"
        >
          View More Properties
        </button>
      </div>
    </section>
  );
}
