"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import NewDevelopmentHero from "@/components/new-development/NewDevelopmentHero";
import NewDevelopmentRegions from "@/components/new-development/NewDevelopmentRegions";
import FeaturedProperties from "@/components/new-development/FeaturedProperties";
import { useRouter } from "next/navigation";
import BuyerTrustCTA from "@/components/BuyerTrustCTA";
import PremiumBuyerCTA from "@/components/PremiumBuyerCTA";
import WhyNovaScotia from "@/components/WhyNovaScotia";
import AgentTrust from "@/components/AgentTrust";
import Link from "next/link";


function NewDevelopmentContent() {
  const searchParams = useSearchParams();
  const city = searchParams?.get("city") || "";

  return (
    <>
      <NewDevelopmentHero />
         {/* Back to Home / View All Listings Button */}
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
        >
          <span>View All Listings with Map</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </Link>
      </div>
      <NewDevelopmentRegions />
      <FeaturedProperties city={city} />
       <AgentTrust />
            <PremiumBuyerCTA />
            <WhyNovaScotia />
            <BuyerTrustCTA />
    </>
  );
}

export default function NewDevelopmentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <NewDevelopmentContent />
    </Suspense>
  );
}



