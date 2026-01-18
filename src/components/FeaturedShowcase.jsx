"use client";

const showcaseItems = [
  {
    title: "Halifax Waterfront",
    subtitle: "Urban Living",
    image:
      "https://images.unsplash.com/photo-1650073475221-042960a60883?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "South Shore",
    subtitle: "Coastal Lifestyle",
    image:
      "https://images.unsplash.com/photo-1688307193832-a6f711942705?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Annapolis Valley",
    subtitle: "Nature & Vineyards",
    image:
      "https://images.unsplash.com/photo-1645406310264-de3fd67ae341?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Cape Breton",
    subtitle: "Scenic Living",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80",
  },
];

export default function FeaturedShowcase() {
  return (
    <section className="bg-[#0B1F3B] py-24">
      <div className="mx-auto max-w-7xl px-6">

        {/* Heading */}
        <div className="mb-14 max-w-3xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Explore Nova Scotia
          </span>

          <h2 className="mt-3 text-4xl font-extrabold text-white">
            Discover Distinct Places & Lifestyles
          </h2>

          <div className="mt-4 h-[3px] w-24 bg-red-600" />

          <p className="mt-6 text-lg text-gray-300">
            From vibrant waterfront cities to scenic coastal communities,
            explore what makes Nova Scotia a place to live, invest, and thrive.
          </p>
        </div>

        {/* Horizontal Scroll */}
        <div className="relative">
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {showcaseItems.map((item, index) => (
              <div
                key={index}
                className="group relative min-w-[320px] md:min-w-[420px] h-[480px] overflow-hidden rounded-2xl bg-gray-200"
              >
                {/* Image */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 p-6">
                  <p className="text-sm uppercase tracking-widest text-gray-200">
                    {item.subtitle}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-white">
                    {item.title}
                  </h3>

                  <div className="mt-4 inline-flex items-center text-sm font-semibold text-white">
                    Explore Area
                    <span className="ml-2 transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
