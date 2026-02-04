// import BuyHero from "@/components/buy/BuyHero";
// import BuyRegions from "@/components/buy/BuyRegions";
// import FeaturedProperties from "@/components/buy/FeaturedProperties";

// export default function BuyPage() {
//   return (
//     <>
//       {/* HERO SECTION */}
//       <BuyHero />

//       {/* REGIONS SECTION */}
//       <BuyRegions />

//       {/* FEATURED LISTINGS */}
//       <FeaturedProperties />
//     </>
//   );
// }


"use client";

import AgentTrust from "@/components/AgentTrust";
import BuyHero from "@/components/buy/BuyHero";
import BuyRegions from "@/components/buy/BuyRegions";
import FeaturedProperties from "@/components/buy/FeaturedProperties";
import BuyerTrustCTA from "@/components/BuyerTrustCTA";
import PremiumBuyerCTA from "@/components/PremiumBuyerCTA";
import WhyNovaScotia from "@/components/WhyNovaScotia";
import { useRouter } from "next/navigation";

export default function BuyPage() {
  const router = useRouter();

  return (
    <>
      <BuyHero />

      <BuyRegions
        onSelectCity={(city) =>
          router.push(`/buy/${city.toLowerCase().replace(/\s+/g, "-")}`)
        }
      />

      <FeaturedProperties />
      

      <AgentTrust />
      <PremiumBuyerCTA />
      <WhyNovaScotia />
   <BuyerTrustCTA/>
      
    </>
  );
}

