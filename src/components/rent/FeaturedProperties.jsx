"use client";

import { useEffect, useState } from "react";
import PropertyCard from "@/components/buy/PropertyCard";

export default function RentFeaturedProperties({ city }) {
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const limit = 9;
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (city) params.append("city", city);

        const res = await fetch(`/api/bridge/rent?${params}`);
        const data = await res.json();

        if (data.error) {
          setError(data.error);
          setListings([]);
          setTotal(0);
          return;
        }

        const rawListings = data.listings || data.bundle || [];
        setListings(Array.isArray(rawListings) ? rawListings.filter(Boolean) : []);
        setTotal(typeof data.total === "number" ? data.total : 0);
        setError(data.message || null);
      } catch (err) {
        setError(err.message);
        setListings([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, [page, city]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <section className="bg-white py-24">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="mb-14">
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-[#091D35]">
            Rental Listings
          </h2>
          <div className="mt-4 h-[3px] w-24 bg-red-600 rounded-full" />
          <p className="mt-4 text-gray-600 max-w-2xl">
            {total > 0
              ? `${total.toLocaleString()}+ rental${total !== 1 ? "s" : ""} from Bridge MLS.`
              : "Rental listings from Bridge MLS."}
          </p>
        </div>

        {loading && page === 1 ? (
          <div className="text-center py-12 text-gray-500">Loading rentals...</div>
        ) : error ? (
          <div className="text-center py-12 max-w-lg mx-auto">
            <p className="text-[#091D35] font-medium">{error}</p>
            <p className="text-sm text-gray-500 mt-3">
              This MLS dataset does not provide rental/lease listings. Use <a href="/buy" className="text-red-600 hover:underline">Buy</a> or <a href="/listings" className="text-red-600 hover:underline">Listings</a> for properties for sale.
            </p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No rental listings found. Try removing filters or check back later.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {listings.map((listing, index) =>
                listing ? (
                  <PropertyCard
                    key={listing.ListingId || listing.Id || `rent-${index}`}
                    listing={listing}
                    listingType="rent"
                  />
                ) : null
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-16 flex justify-center items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                >
                  Previous
                </button>
                <span className="px-4 text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
