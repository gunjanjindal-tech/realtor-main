"use client";

import { Suspense, useEffect, useState } from "react";
import AgentTrust from "@/components/AgentTrust";
import BuyHero from "@/components/buy/BuyHero";
import BuyRegions from "@/components/buy/BuyRegions";
import FeaturedProperties from "@/components/buy/FeaturedProperties";
import BuyerTrustCTA from "@/components/BuyerTrustCTA";
import PremiumBuyerCTA from "@/components/PremiumBuyerCTA";
import WhyNovaScotia from "@/components/WhyNovaScotia";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function BuyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cityFromUrl, setCityFromUrl] = useState("");

  useEffect(() => {
    const city =
      searchParams?.get("City") ||
      searchParams?.get("city") ||
      "";

    setCityFromUrl(city);
  }, [searchParams]);

  return (
    <>
      <BuyHero />

      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
        >
          <span>View All Listings with Map</span>
        </Link>
      </div>

      <BuyRegions
        onSelectCity={(city) =>
          router.push(`/buy/${city.toLowerCase().replace(/\s+/g, "-")}`)
        }
      />

      <FeaturedProperties city={cityFromUrl} />

      <AgentTrust />
      <PremiumBuyerCTA />
      <WhyNovaScotia />
      <BuyerTrustCTA />
    </>
  );
}

export default function BuyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BuyPageContent />
    </Suspense>
  );
}