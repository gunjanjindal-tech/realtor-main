import RentHero from "@/components/rent/RentHero";
import FeaturedProperties from "@/components/rent/FeaturedProperties";

export default async function RentPage({ searchParams }) {
  const params = await searchParams;
  const city = params?.city ?? "";

  return (
    <>
      <RentHero />
      <FeaturedProperties city={city} />
    </>
  );
}
