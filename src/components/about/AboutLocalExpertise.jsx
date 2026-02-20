"use client";

export default function AboutLocalExpertise() {
  const cities = ["Halifax", "Dartmouth", "Bedford"];

  return (
    <section className="py-32 bg-white">
      <div className="max-w-[1400px] mx-auto px-6">

        {/* SECTION HEADING */}
        <div className="mb-20 max-w-3xl ">
          <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Area Focus
          </span>

          <h2 className="mt-3 text-4xl md:text-5xl font-extrabold leading-tight text-[#091D35]">
            Local Market Expertise Across<br />
             Nova Scotia
          </h2>

        <div className="mt-5 h-[3px] w-24 bg-red-600" />

          <p className="mt-6 text-lg text-gray-600">
            In-depth knowledge of pricing, neighbourhoods, and market trends
            allows us to guide clients with clarity and confidence.
          </p>
        </div>

        {/* CARDS GRID (UNCHANGED) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {cities.map((city) => (
            <div
              key={city}
              className="
                group relative overflow-hidden rounded-2xl
                bg-white shadow-lg
                hover:-translate-y-2 hover:shadow-2xl
                transition-all duration-300
              "
            >
              {/* RED SIDE STRIP */}
              <div className="absolute left-0 top-0 h-full w-[6px] bg-red-600" />

              {/* DARK PANEL */}
              <div className="
                absolute inset-0 bg-[#091D35]
                translate-y-full group-hover:translate-y-0
                transition-transform duration-500
              " />

              {/* CONTENT */}
              <div className="relative z-10 p-10 text-left">
                <span className="text-xs font-semibold tracking-widest uppercase text-red-600">
                  City Expertise
                </span>

                <h3 className="
                  mt-2 text-2xl font-semibold
                  text-[#091D35]
                  group-hover:text-white
                  transition
                ">
                  {city}
                </h3>

                <p className="
                  mt-4 text-gray-600 leading-relaxed
                  group-hover:text-white/80
                  transition
                ">
                  Deep local insight into pricing, neighbourhoods, and long-term growth.
                </p>

                <div className="
                  mt-8 inline-block text-sm font-semibold
                  text-[#091D35]
                  group-hover:text-white
                  transition
                ">
                  Explore Market →
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
