export default function WhyNovaScotia() {
  const highlights = [
    {
      title: "Coastal Lifestyle",
      value: "550+ km",
      description:
        "of pristine coastline, beaches, and waterfront communities",
    },
    {
      title: "Market Growth",
      value: "Stable",
      description:
        "home price appreciation supported by growing national demand",
    },
    {
      title: "Quality of Life",
      value: "Top Tier",
      description:
        "healthcare, education, safety, and strong community living",
    },
    {
      title: "Investment Appeal",
      value: "Strong ROI",
      description:
        "low entry prices with consistent rental demand and growth",
    },
  ];

  return (
    <section className="relative bg-white py-32">
      {/* Subtle dividers */}
      <div className="absolute top-0 left-0 h-px w-full bg-gray-200" />
      <div className="absolute bottom-0 left-0 h-px w-full bg-gray-200" />

      <div className="mx-auto max-w-[1600px] px-6 grid gap-20 lg:grid-cols-2">

        {/* LEFT CONTENT */}
        <div>
          <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Why Nova Scotia
          </span>

          <h2 className="mt-4 text-5xl font-extrabold leading-tight text-[#091D35]">
            Where Lifestyle <br />
            Meets Long-Term Value
          </h2>

          <div className="mt-6 h-[3px] w-24 bg-red-600" />

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-gray-600">
            Nova Scotia offers a rare balance — breathtaking natural beauty,
            strong community values, and a real estate market positioned for
            long-term growth.
          </p>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
            Whether you’re purchasing your first home or building a property
            portfolio, Nova Scotia delivers stability, lifestyle, and
            opportunity.
          </p>
        </div>

        {/* RIGHT METRICS */}
        <div className="grid gap-12 sm:grid-cols-2">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="border-l-2 border-red-600 pl-6"
            >
              <h3 className="text-sm uppercase tracking-widest text-gray-400">
                {item.title}
              </h3>

              <p className="mt-2 text-3xl font-bold text-[#091D35]">
                {item.value}
              </p>

              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
