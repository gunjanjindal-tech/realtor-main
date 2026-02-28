export default function SellHero() {
  return (
    <section className="relative h-[65vh] flex items-center justify-center bg-[#0E2A47] text-white">
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 text-center px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold">
          Sell Your Property
        </h1>
        {/* RED UNDERLINE */}
        <div className="mx-auto mt-6 h-[3px] w-24 bg-red-600" />
        <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
          List your property and connect with potential buyers across Nova Scotia.
        </p>
      </div>
    </section>
  );
}




