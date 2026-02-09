const CITY_IMAGES = {
  Halifax:
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=1600",
  Dartmouth:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600",
  Bedford:
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1600",
  "Lower Sackville":
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600",
  default:
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600",
};

export default function BuyCityHero({ city }) {
  if (!city) {
    return null;
  }

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
          Homes in {city}
        </h1>

        <div className="mx-auto mt-6 h-[3px] w-24 bg-red-600" />

        <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
          Browse available properties in {city}, Nova Scotia.
        </p>
      </div>
    </section>
  );
}
