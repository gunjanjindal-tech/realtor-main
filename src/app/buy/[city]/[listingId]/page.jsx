"use client";

import { useState } from "react";
import PropertyGallery from "@/components/property/PropertyGallery";
import PropertyHeader from "@/components/property/PropertyHeader";
import PropertyContent from "@/components/property/PropertyContent";
import PropertySidebar from "@/components/property/PropertySidebar";
import PropertyMap from "@/components/property/PropertyMap";
import PremiumBuyerCTA from "@/components/PremiumBuyerCTA";

export default function PropertyDetailPage({ params }) {
  const { city, listingId } = params;

  return (
    <>
      {/* HERO */}
      <PropertyGallery listingId={listingId} />

      {/* HEADER */}
      <section className="bg-white">
        <div className="max-w-[1600px] mx-auto px-6 py-10">
          <PropertyHeader />
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="bg-white">
        <div className="max-w-[1600px] mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

            {/* LEFT CONTENT */}
            <div className="lg:col-span-8">
              <PropertyContent />
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
      <PropertyMap />

    </>
  );
}
