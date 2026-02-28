"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import PropertyGallery from "@/components/property/PropertyGallery";
import PropertyHeader from "@/components/property/PropertyHeader";
import PropertyContent from "@/components/property/PropertyContent";
import PropertySidebar from "@/components/property/PropertySidebar";
import PropertyMap from "@/components/property/PropertyMap";
import PremiumBuyerCTA from "@/components/PremiumBuyerCTA";

export default function PropertyDetailClient() {
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
          setError("Property not found");
          setListing(null);
          return;
        }

        const data = await res.json();
        setListing(data.listing);
      } catch (err) {
        setError("Failed to load property details");
        setListing(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [listingId]);

  if (!city || !listingId) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Loading Skeleton */}
        <div className="h-[520px] bg-gray-200 animate-pulse mt-[96px]" />
        <div className="max-w-[1600px] mx-auto px-6 py-10">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
        </div>
        <div className="max-w-[1600px] mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-8 space-y-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
            <div className="lg:col-span-4">
              <div className="h-64 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Property Not Found</h1>
          <p className="text-gray-600">{error || "The property you're looking for doesn't exist."}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PropertyGallery images={listing.Images || []} />

      <section className="bg-white">
        <div className="max-w-[1600px] mx-auto px-6 py-10">
          <PropertyHeader listing={listing} />
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-[1600px] mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-8">
              <PropertyContent property={listing} />
            </div>

            <div className="lg:col-span-4">
              <PropertySidebar />
            </div>
          </div>
        </div>
      </section>

      <PremiumBuyerCTA />
      <PropertyMap listing={listing} />
    </>
  );
}