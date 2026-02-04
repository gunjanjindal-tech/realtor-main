import BuyHero from "@/components/buy/BuyHero";
import BuyRegions from "@/components/buy/BuyRegions";
import FeaturedProperties from "@/components/buy/FeaturedProperties";

export default async function BuyPage({ searchParams }) {
  // Next.js 15+ requires await for searchParams
  const params = await searchParams;
  const city = params?.city ?? "";

  return (
    <>
      <BuyHero />
      <BuyRegions />
      <FeaturedProperties city={city} />
    </>
  );
}
