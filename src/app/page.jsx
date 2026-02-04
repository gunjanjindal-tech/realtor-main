import Hero from "@/components/Hero";
import FeaturedProperties from "@/components/FeaturedProperties";
import Communities from "@/components/Communities";
import Regions from "@/components/Regions";
import WhyNovaScotia from "@/components/WhyNovaScotia";
import LocalMarketMap from "@/components/LocalMarketMap";
import FeaturedShowcase from "@/components/FeaturedShowcase";
import PremiumBuyerCTA from "@/components/PremiumBuyerCTA.jsx";
import AgentTrust from "@/components/AgentTrust";
import BuyerTrustCTA from "@/components/BuyerTrustCTA";

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
      <BuyerTrustCTA/>
    </>
  );
}
