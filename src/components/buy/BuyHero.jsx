export default function BuyHero({ city }) {
  return (
       <section className="relative  pt-10 md:pt-0 h-[75vh] md:h-[65vh] flex items-center justify-center bg-[#0E2A47] text-white">

      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 text-center px-6">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold">
          {city ? `Homes in ${city}` : "Find Your Next Home"}
        </h1>

        {/* RED UNDERLINE */}
        <div className="mx-auto mt-5 h-[3px] w-20 md:w-24 bg-red-600" />

        <p className="mt-4 text-base md:text-lg text-white/80 max-w-3xl mx-auto">
          {city
            ? `Browse available listings in ${city}, Nova Scotia`
            : "Discover homes, communities, and opportunities across Nova Scotia."}
        </p>
      </div>
    </section>
  );
}