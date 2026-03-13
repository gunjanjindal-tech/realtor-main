import dynamic from "next/dynamic";
import Hero from "@/components/Hero";
import FeaturedProperties from "@/components/FeaturedProperties";

const FeaturedShowcase = dynamic(() => import("@/components/FeaturedShowcase"), { ssr: true });
const Communities = dynamic(() => import("@/components/Communities"), { ssr: true });
const WhyNovaScotia = dynamic(() => import("@/components/WhyNovaScotia"), { ssr: true });
const LocalMarketMap = dynamic(() => import("@/components/LocalMarketMap"), { ssr: true });
const PremiumBuyerCTA = dynamic(() => import("@/components/PremiumBuyerCTA.jsx"), { ssr: true });
const AgentTrust = dynamic(() => import("@/components/AgentTrust"), { ssr: true });
const BuyerTrustCTA = dynamic(() => import("@/components/BuyerTrustCTA"), { ssr: true });

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedProperties />
      <FeaturedShowcase />
      <Communities />
      <WhyNovaScotia />
      <LocalMarketMap />
      <PremiumBuyerCTA />
      <AgentTrust />
      <BuyerTrustCTA />
    </>
  );
}
