export default function LocalMarketMap() {
  return (
    <section className="bg-white py-32">
      <div className="mx-auto max-w-[1600px] px-6 grid gap-16 lg:grid-cols-2 items-center">

        {/* LEFT CONTENT */}
        <div>
          <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Local Expertise
          </span>

          <h2 className="mt-4 text-5xl font-extrabold leading-tight text-[#091D35]">
            Local Market Expertise <br />
            That Truly Matters
          </h2>

          <div className="mt-6 h-[3px] w-24 bg-red-600" />

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-gray-600">
            Deep local knowledge, neighborhood-level insights, and real-time
            market data help our clients make confident buying and selling
            decisions across Nova Scotia.
          </p>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
            From Halifax to coastal communities, we understand pricing trends,
            demand patterns, and what truly drives value in each region.
          </p>
        </div>

        {/* RIGHT MAP */}
        <div className="relative overflow-hidden rounded-2xl shadow-2xl">
          <iframe
            title="Nova Scotia Map"
            src="https://www.google.com/maps?q=Nova%20Scotia,%20Canada&z=6&output=embed"
            className="h-[420px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

      </div>
    </section>
  );
}
