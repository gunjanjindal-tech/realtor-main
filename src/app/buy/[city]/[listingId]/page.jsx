"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import PropertyGallery from "@/components/property/PropertyGallery";
import PropertyHeader from "@/components/property/PropertyHeader";
import PropertyContent from "@/components/property/PropertyContent";
import PropertySidebar from "@/components/property/PropertySidebar";
import PropertyMap from "@/components/property/PropertyMap";
import PremiumBuyerCTA from "@/components/PremiumBuyerCTA";

export default function PropertyDetailPage() {
  const params = useParams();
  const [city, setCity] = useState("");
  const [listingId, setListingId] = useState("");
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (params?.city && params?.listingId) {
      const decodedCity = decodeURIComponent(params.city)
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      setCity(decodedCity);
      setListingId(params.listingId);
    }
  }, [params]);

  useEffect(() => {
    if (!listingId) return;

    async function fetchProperty() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/bridge/property/${listingId}`);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Failed to fetch property" }));
          setError(errorData.error || "Property not found");
          setListing(null);
          return;
        }

        const data = await res.json();
        setListing(data.listing);
      } catch (err) {
        console.error("❌ Failed to fetch property:", err);
        setError("Failed to load property details");
        setListing(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [listingId]);

  if (!city || !listingId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading property details...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading property details...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-2">{error || "Property not found"}</p>
          <p className="text-gray-500">The property you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* HERO */}
      <PropertyGallery images={listing.Images || []} />

      {/* HEADER */}
      <section className="bg-white">
        <div className="max-w-[1600px] mx-auto px-6 py-10">
          <PropertyHeader listing={listing} />
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="bg-white">
        <div className="max-w-[1600px] mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

            {/* LEFT CONTENT */}
            <div className="lg:col-span-8">
              <PropertyContent property={listing} />
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="lg:col-span-4">
              <PropertySidebar />
            </div>

          </div>
        </div>
      </section>


      {/* PREMIUM CTA */}
      <PremiumBuyerCTA />

      {/* MAP */}
      <PropertyMap listing={listing} />

    </>
  );
}
