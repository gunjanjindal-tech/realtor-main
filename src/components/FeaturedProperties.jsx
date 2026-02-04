export default function FeaturedProperties() {
  const properties = [
    {
      id: 1,
      title: "Waterfront Luxury Residence",
      location: "Halifax, NS",
      price: "$1,249,000",
      image:
        "https://images.unsplash.com/photo-1650073475221-042960a60883?auto=format&fit=crop&w=1400&q=80",
    },
    {
      id: 2,
      title: "Modern Family Home",
      location: "Bedford, NS",
      price: "$749,000",
      image:
        "https://images.unsplash.com/photo-1688307193832-a6f711942705?auto=format&fit=crop&w=1400&q=80",
    },
    {
      id: 3,
      title: "Elegant Contemporary Property",
      location: "Dartmouth, NS",
      price: "$689,000",
      image:
        "https://images.unsplash.com/photo-1645406310264-de3fd67ae341?auto=format&fit=crop&w=1400&q=80",
    },
  ];

  return (
    <section className="bg-white py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">

        {/* Heading */}
        <div className="mb-16 max-w-3xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Featured Listings
          </span>

          <h2 className="mt-3 text-4xl font-bold text-[#091D35]">
            Handpicked Homes Across Nova Scotia
          </h2>

          <div className="mt-4 h-[3px] w-24 bg-red-600" />

          <p className="mt-6 text-lg text-gray-600">
            Discover a curated selection of exceptional properties,
            chosen for their location, design, and lifestyle appeal.
          </p>
        </div>
      </div>

      {/* 🔥 MOBILE SCROLL / DESKTOP GRID */}
      <div
        className="
          flex gap-6 overflow-x-auto px-6
          snap-x snap-mandatory scroll-px-6
          sm:grid sm:grid-cols-2 sm:gap-10 sm:overflow-visible sm:px-6
          md:grid-cols-3 scrollbar-hide
        "
      >
        {properties.map((property, index) => (
          <div
            key={property.id}
            className="
              snap-start
              min-w-[280px]
              rounded-2xl border bg-white shadow-sm
              transition-all duration-300
              hover:-translate-y-1 hover:shadow-xl
              sm:min-w-0
            "
          >
            {/* Image */}
            <div className="relative h-72 overflow-hidden rounded-t-2xl">
              <img
                src={property.image}
                alt={property.title}
                className="h-full w-full object-cover transition duration-500 hover:scale-105"
              />

              <span className="absolute left-4 top-4 rounded-full bg-[#091D35] px-4 py-1 text-xs font-semibold text-white">
                For Sale
              </span>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="text-lg font-semibold text-[#091D35]">
                {property.title}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {property.location}
              </p>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-xl font-bold text-[#091D35]">
                  {property.price}
                </span>

                <button className="rounded-full border border-[#091D35] px-5 py-2 text-sm font-medium text-[#091D35] transition hover:bg-[#091D35] hover:text-white">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-16 flex justify-center">
        <button className="rounded-full bg-red-600 px-10 py-4 text-sm font-semibold tracking-wide text-white transition hover:bg-red-700">
          View More Properties
        </button>
      </div>
    </section>
  );
}
