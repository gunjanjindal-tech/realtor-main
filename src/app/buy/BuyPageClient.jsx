"use client";

import AgentTrust from "@/components/AgentTrust";
import BuyHero from "@/components/buy/BuyHero";
import BuyRegions from "@/components/buy/BuyRegions";
import FeaturedProperties from "@/components/buy/FeaturedProperties";
import BuyerTrustCTA from "@/components/BuyerTrustCTA";
import PremiumBuyerCTA from "@/components/PremiumBuyerCTA";
import WhyNovaScotia from "@/components/WhyNovaScotia";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function BuyPageClient() {
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
        <Link href="/listings">
          View All Listings with Map
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