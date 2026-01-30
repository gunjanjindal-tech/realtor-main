"use client";

export default function AboutServices({ services, activeBg, setActiveBg }) {
  return (
    <section
      className="relative py-32"
      style={{
        backgroundImage: `url(${activeBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/90" />

      <div className="relative max-w-[1400px] mx-auto px-6">

        {/* SECTION HEADING */}
        <div className="mb-16 max-w-3xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            What We Do
          </span>

          <h2 className="mt-3 text-4xl md:text-5xl font-extrabold leading-tight text-[#091D35]">
            Strategic Real Estate Services <br />
            Built Around Your Goals
          </h2>

          <div className="mt-5 h-[3px] w-24 bg-red-600" />

          <p className="mt-6 text-lg text-gray-600">
            From residential sales to investment strategy, we provide clear,
            data-driven guidance designed to create long-term value.
          </p>
        </div>

        {/* SERVICES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, i) => (
            <div
              key={i}
              onMouseEnter={() => setActiveBg(service.img)}
              className="
                group bg-white rounded-2xl p-8 cursor-pointer
                border border-[#091D35]/20
                hover:-translate-y-2 hover:shadow-2xl
                transition-all duration-300
              "
            >
              <h3 className="font-semibold text-xl group-hover:text-[rgb(229,14,11)] transition">
                {service.title}
              </h3>

              <p className="mt-4 text-gray-600 text-sm leading-relaxed">
                {service.text}
              </p>

              <span
                className="
                  inline-block mt-5 text-sm font-semibold
                  text-[rgb(229,14,11)]
                  opacity-0 group-hover:opacity-100
                  transition
                "
              >
                Learn More →
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
