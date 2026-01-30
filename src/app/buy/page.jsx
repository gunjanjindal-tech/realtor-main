import BuyHero from "@/components/buy/BuyHero";
import BuyRegions from "@/components/buy/BuyRegions";
import FeaturedProperties from "@/components/buy/FeaturedProperties";

export default function BuyPage({ searchParams }) {
  const city = searchParams?.city ?? "";

  return (
    <>
      <BuyHero />
      <BuyRegions />
      <FeaturedProperties city={city} />
    </>
  );
}
