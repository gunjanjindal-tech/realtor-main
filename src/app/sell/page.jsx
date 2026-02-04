import SellHero from "@/components/sell/SellHero";
import SellRegions from "@/components/sell/SellRegions";
import FeaturedProperties from "@/components/sell/FeaturedProperties";

export default async function SellPage({ searchParams }) {
  // Next.js 15+ requires await for searchParams
  const params = await searchParams;
  const city = params?.city ?? "";

  return (
    <>
      <SellHero />
      <SellRegions />
      <FeaturedProperties city={city} />
    </>
  );
}

