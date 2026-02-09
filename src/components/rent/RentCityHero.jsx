const CITY_IMAGES = {
  Halifax: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=1600",
  Dartmouth: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600",
  Bedford: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1600",
  "Lower Sackville": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600",
  "Cole Harbour": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600",
  Wolfville: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600",
  Kentville: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=1600",
  Lunenburg: "https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?q=80&w=1600",
  Chester: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1600",
  Bridgewater: "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600",
  Yarmouth: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1600",
  Antigonish: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=1600",
  default: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600",
};

export default function RentCityHero({ city }) {
  if (!city) return null;

  const bg = CITY_IMAGES[city] || CITY_IMAGES.default;

  return (
    <section
      className="relative h-[55vh] flex items-center justify-center text-white"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 text-center px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold">
          Rentals in {city}
        </h1>
        <div className="mx-auto mt-6 h-[3px] w-24 bg-red-600" />
        <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
          Find rental properties and homes for lease in {city}, Nova Scotia.
        </p>
      </div>
    </section>
  );
}
