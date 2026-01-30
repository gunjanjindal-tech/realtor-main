export default function Communities() {
  const communities = [
    {
      name: "Halifax",
      description: "Urban living, waterfront views, dining, and vibrant culture",
    },
    {
      name: "Dartmouth",
      description: "Scenic lakes, parks, and fast-growing neighbourhoods",
    },
    {
      name: "Bedford",
      description: "Family-friendly communities with modern homes",
    },
    {
      name: "Cole Harbour",
      description: "Coastal lifestyle with trails and ocean views",
    },
    {
      name: "Eastern Passage",
      description: "Relaxed seaside living near the city",
    },
    {
      name: "Lawrencetown",
      description: "Beachside living and outdoor-focused lifestyle",
    },
    {
      name: "Hammonds Plains",
      description: "Spacious homes surrounded by nature",
    },
    {
      name: "Beaver Bank",
      description: "Growing communities with great value homes",
    },
    {
      name: "Beechville",
      description: "Quiet suburban living with easy city access",
    },
    {
      name: "Spryfield",
      description: "Affordable housing close to downtown Halifax",
    },
    {
      name: "Timberlea",
      description: "Family-friendly neighbourhoods near lakes and trails",
    },
  ];

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">

        {/* Heading */}
        <div className="mb-16 max-w-3xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Browse by Community
          </span>

          <h2 className="mt-3 text-4xl font-extrabold text-[#091D35]">
            Explore Popular Communities in Nova Scotia
          </h2>

          <div className="mt-4 h-[3px] w-24 bg-red-600" />

          <p className="mt-6 text-lg text-gray-600">
            Discover homes across Nova Scotia’s most desirable cities and
            neighbourhoods — each offering a unique lifestyle and long-term
            investment opportunity.
          </p>
        </div>

        {/* ✅ GRID (FIXED) */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {communities.map((community) => (
            <div
              key={community.name}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-red-500 hover:shadow-xl"
            >
              {/* Hover Gradient */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-50 via-white to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <h3 className="relative text-xl font-semibold text-[#091D35] transition group-hover:text-red-600">
                {community.name}
              </h3>

              <p className="relative mt-3 text-sm leading-relaxed text-gray-600">
                {community.description}
              </p>

              <div className="relative mt-6 inline-flex items-center text-sm font-semibold text-red-600">
             <a
  href={`/buy/${community.name.toLowerCase().replace(/\s+/g, "-")}`}
  className="mt-6 inline-flex items-center text-sm font-semibold text-red-600"
>
  View Homes →
</a>


              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <button className="rounded-full bg-red-600 px-10 py-4 text-sm font-semibold tracking-wide text-white transition hover:bg-red-700">
            View All Communities
          </button>
        </div>

      </div>
    </section>
  );
}
