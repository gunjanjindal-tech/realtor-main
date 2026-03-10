"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import PropertyGallery from "@/components/property/PropertyGallery";
import PropertyHeader from "@/components/property/PropertyHeader";
import PropertyContent from "@/components/property/PropertyContent";
import PropertySidebar from "@/components/property/PropertySidebar";
import PropertyMap from "@/components/property/PropertyMap";
import PremiumBuyerCTA from "@/components/PremiumBuyerCTA";
import ContactForm from "@/components/contact/ContactForm";

export default function PropertyDetailClient() {
  const params = useParams();
  const [city, setCity] = useState("");
  const [listingId, setListingId] = useState("");
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
const [showPopup, setShowPopup] = useState(false);
const [submitted, setSubmitted] = useState(false);
const [popupCount, setPopupCount] = useState(0);
  
useEffect(() => {
  if (submitted || popupCount >= 3) return;

  const timers = [5000, 15000, 15000];

  const timer = setTimeout(() => {
    setShowPopup(true);
  }, timers[popupCount]);

  return () => clearTimeout(timer);
}, [popupCount, submitted]);
  
  

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

      
      
{showPopup && !submitted && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
<div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-[fadeIn_.25s_ease]">

      {/* Close Button */}
      <button
 onClick={() => {
  setShowPopup(false);
  setPopupCount((prev) => prev + 1);
}}
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 shadow hover:bg-gray-100 transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-gray-600"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 
            111.414 1.414L11.414 10l4.293 4.293a1 1 0 
            01-1.414 1.414L10 11.414l-4.293 
            4.293a1 1 0 01-1.414-1.414L8.586 
            10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Property Image */}
      {listing?.Images?.[0] && (
        <div className="w-full h-24 sm:h-36 overflow-hidden">
          <img
            src={listing.Images[0]}
            alt="property"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="px-6 sm:px-6 py-4">


        {/* Address */}
        <p className="text-center text-[#091D35] font-semibold text-md mb-2">
          {listing?.UnparsedAddress}
        </p>



        {/* Form */}
        <ContactForm
          propertyAddress={listing?.UnparsedAddress}
          price={listing?.ListPrice}
         onSuccess={() => {
  setSubmitted(true);
  setShowPopup(false);
  setPopupCount(3);
}}
        />


      </div>
    </div>
  </div>
)}
     
    </>
  );
}





