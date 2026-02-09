"use client";

import AgentTrust from "@/components/AgentTrust";
import BuyHero from "@/components/buy/BuyHero";
import BuyRegions from "@/components/buy/BuyRegions";
import FeaturedProperties from "@/components/buy/FeaturedProperties";
import BuyerTrustCTA from "@/components/BuyerTrustCTA";
import PremiumBuyerCTA from "@/components/PremiumBuyerCTA";
import WhyNovaScotia from "@/components/WhyNovaScotia";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BuyPage() {
  const router = useRouter();

  return (
    <>
      <BuyHero />
    
      {/* View All Listings Button */}
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

      <BuyRegions
        onSelectCity={(city) =>
          router.push(`/buy/${city.toLowerCase().replace(/\s+/g, "-")}`)
        }
      />

      <FeaturedProperties />

      <AgentTrust />
      <PremiumBuyerCTA />
      <WhyNovaScotia />
      <BuyerTrustCTA />
    </>
  );
}

