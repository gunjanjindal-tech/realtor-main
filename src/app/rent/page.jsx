import RentHero from "@/components/rent/RentHero";
import RentRegions from "@/components/rent/RentRegions";
import FeaturedProperties from "@/components/rent/FeaturedProperties";

export default async function RentPage({ searchParams }) {
  const params = searchParams != null ? await searchParams : {};
  const city = params?.city ?? "";

  return (
    <>
      <RentHero />
      <RentRegions />
      <FeaturedProperties city={city} />
    </>
  );
}
