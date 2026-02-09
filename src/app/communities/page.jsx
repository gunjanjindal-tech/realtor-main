"use client";

const COMMUNITIES = [
  {
    name: "Halifax",
    subtitle: "Halifax Real Estate",
    description:
      "Halifax is the economic and cultural heart of Nova Scotia, offering waterfront living, top universities, major hospitals, and a strong real estate market ideal for professionals and investors.",
    image: "/images/communities/halifax.jpg",
    slug: "halifax",
  },
  {
    name: "Bedford",
    subtitle: "Bedford Real Estate",
    description:
      "Bedford is known for family-friendly neighbourhoods, excellent schools, modern homes, and scenic views along the Bedford Basin, making it ideal for growing families.",
    image: "/images/communities/bedford.jpg",
    slug: "bedford",
  },
  {
    name: "Dartmouth",
    subtitle: "Dartmouth Real Estate",
    description:
      "Dartmouth offers lakeside living, expanding developments, and easy access to Halifax via bridges and ferries, with great value compared to downtown Halifax.",
    image: "/images/communities/dartmouth.jpg",
    slug: "dartmouth",
  },
  {
    name: "Cole Harbour",
    subtitle: "Cole Harbour Real Estate",
    description:
      "Cole Harbour features coastal scenery, walking trails, and affordable family homes, making it popular with first-time buyers and long-term residents.",
    image: "/images/communities/cole-harbour.jpg",
    slug: "cole-harbour",
  },
  {
    name: "Lower Sackville",
    subtitle: "Lower Sackville Real Estate",
    description:
      "Lower Sackville offers great housing value, growing infrastructure, and easy highway access, making it one of the most affordable suburban communities near Halifax.",
    image: "/images/communities/lower-sackville.jpg",
    slug: "lower-sackville",
  },
  {
    name: "Timberlea",
    subtitle: "Timberlea Real Estate",
    description:
      "Timberlea combines suburban comfort with access to lakes and trails, offering newer developments and a strong sense of community just outside Halifax.",
    image: "/images/communities/timberlea.jpg",
    slug: "timberlea",
  },
  {
    name: "Hammonds Plains",
    subtitle: "Hammonds Plains Real Estate",
    description:
      "Hammonds Plains is perfect for buyers seeking larger lots, nature-focused living, and quiet neighbourhoods while remaining close to city amenities.",
    image: "/images/communities/hammonds-plains.jpg",
    slug: "hammonds-plains",
  },
  {
    name: "Fall River",
    subtitle: "Fall River Real Estate",
    description:
      "Fall River offers upscale homes, lakefront properties, and quick access to the airport and Halifax, making it ideal for executives and luxury buyers.",
    image: "/images/communities/fall-river.jpg",
    slug: "fall-river",
  },
  {
    name: "Spryfield",
    subtitle: "Spryfield Real Estate",
    description:
      "Spryfield provides affordable housing close to downtown Halifax, with improving infrastructure and strong potential for future appreciation.",
    image: "/images/communities/spryfield.jpg",
    slug: "spryfield",
  },
  {
    name: "Clayton Park",
    subtitle: "Clayton Park Real Estate",
    description:
      "Clayton Park is one of Halifax’s most desirable areas, known for schools, parks, condos, and proximity to shopping and business districts.",
    image: "/images/communities/clayton-park.jpg",
    slug: "clayton-park",
  },
  {
    name: "Forest Hills",
    subtitle: "Forest Hills Real Estate",
    description:
      "Forest Hills is a well-established Dartmouth community with schools, parks, and family-friendly neighbourhoods offering excellent long-term value.",
    image: "/images/communities/forest-hills.jpg",
    slug: "forest-hills",
  },
  {
    name: "Purcell’s Cove",
    subtitle: "Purcell’s Cove Real Estate",
    description:
      "Purcell’s Cove offers luxury coastal living just minutes from downtown Halifax, with stunning ocean views and exclusive properties.",
    image: "/images/communities/purcells-cove.jpg",
    slug: "purcells-cove",
  },
];

export default function CommunitiesPage() {
  return (
    <main className="bg-white">
      {/* ================= HERO ================= */}
      <section className="bg-[#091D35] pt-36 pb-24 text-center">
        <div className="mx-auto max-w-4xl px-6">
          
          {/* SIGNATURE LINE */}
          <span className="text-sm font-semibold uppercase tracking-widest text-white/60">
            Nova Scotia Communities
          </span>

          {/* MAIN HEADING */}
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-white leading-tight">
            Explore Nova Scotia Communities
          </h1>

          {/* RED UNDERLINE */}
          <div className="mx-auto mt-6 h-[3px] w-28 bg-red-600" />

          {/* SUBTEXT */}
          <p className="mt-6 max-w-3xl mx-auto text-lg text-white/70">
            Discover the lifestyle, neighbourhoods, and real estate opportunities
            across Nova Scotia’s most desirable communities.
          </p>
        </div>
      </section>

      {/* ================= SECTIONS ================= */}
      <section className="space-y-32 py-32">
        {COMMUNITIES.map((community, index) => {
          const isEven = index % 2 === 0;

          return (
            <div
              key={community.slug}
              className="mx-auto max-w-[1600px] px-6"
            >
              <div
                className={`grid gap-16 items-center lg:grid-cols-2 ${
                  !isEven ? "lg:grid-flow-col-dense" : ""
                }`}
              >
                {/* IMAGE */}
                <div
                  className={`relative h-[360px] sm:h-[420px] rounded-3xl overflow-hidden shadow-xl ${
                    !isEven ? "lg:col-start-2" : ""
                  }`}
                >
                  <img
                    src={community.image}
                    alt={community.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                </div>

                {/* CONTENT */}
                <div className="max-w-xl">
                  <span className="text-sm uppercase tracking-widest text-red-600 font-semibold">
                    {community.subtitle}
                  </span>

                  <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#091D35]">
                    {community.name}
                  </h2>

                  <p className="mt-6 text-lg text-gray-600">
                    {community.description}
                  </p>

                  <a
                    href={`/buy/${community.slug}`}
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#091D35] px-8 py-4 text-sm font-semibold text-white transition hover:bg-red-600"
                  >
                    View Homes →
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}

