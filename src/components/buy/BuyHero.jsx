export default function BuyHero({ city }) {
  return (
    <section className="relative h-[65vh] flex items-center justify-center bg-[#0E2A47] text-white">
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 text-center px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold">
          {city ? `Homes in ${city}` : "Find Your Next Home"}
        </h1>

        {/* RED UNDERLINE */}
        <div className="mx-auto mt-6 h-[3px] w-24 bg-red-600" />

        <p className="mt-4 text-lg text-white/80 max-w-3xl mx-auto">
          {city
            ? `Browse available listings in ${city}, Nova Scotia`
            : "Discover homes, communities, and opportunities across Nova Scotia."}
        </p>
      </div>
    </section>
  );
}
