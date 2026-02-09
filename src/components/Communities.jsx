"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Default communities with descriptions
const DEFAULT_COMMUNITIES = [
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
    name: "Lower Sackville",
    description: "Family-friendly communities with great amenities",
  },
  {
    name: "Wolfville",
    description: "Charming university town with historic charm",
  },
  {
    name: "Kentville",
    description: "Vibrant community in the Annapolis Valley",
  },
  {
    name: "Lunenburg",
    description: "UNESCO World Heritage site with coastal beauty",
  },
  {
    name: "Bridgewater",
    description: "Growing town with excellent quality of life",
  },
  {
    name: "Yarmouth",
    description: "Historic port town with maritime heritage",
  },
  {
    name: "Antigonish",
    description: "University town with rich cultural scene",
  },
];

export default function Communities() {
  const router = useRouter();
  const [communities, setCommunities] = useState(DEFAULT_COMMUNITIES);
  const [propertyCounts, setPropertyCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch property counts for each community
        const countsRes = await fetch("/api/bridge/regions");
        if (countsRes.ok) {
          const counts = await countsRes.json();
          setPropertyCounts(counts);
          
          // Update communities with property counts, prioritize communities with listings
          const communitiesWithCounts = DEFAULT_COMMUNITIES.map(comm => ({
            ...comm,
            count: counts[comm.name] || 0,
          })).sort((a, b) => b.count - a.count);
          
          setCommunities(communitiesWithCounts);
        }
      } catch (err) {
        console.error("❌ [COMMUNITIES] Failed to fetch property counts:", err);
        // Keep default communities if API fails
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-[1600px] px-6">

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

        {/* RESPONSIVE GRID */}
<div
  className="
    flex gap-4 overflow-x-auto pb-4
    snap-x snap-mandatory
    px-4

    scrollbar-hide

    sm:grid sm:grid-cols-2 sm:gap-6
    sm:overflow-visible sm:px-0
    lg:grid-cols-3
  "
>
  {communities.map((community, index) => {
    const citySlug = community.name.toLowerCase().replace(/\s+/g, "-");
    const handleCardClick = () => {
      router.push(`/buy/${citySlug}`);
    };

    return (
      <div
        key={community.name}
        onClick={handleCardClick}
        className="
          group relative snap-start cursor-pointer
          min-w-[260px]
          overflow-hidden rounded-2xl border border-gray-200 bg-white p-6
          transition-all duration-300
          hover:-translate-y-1 hover:border-red-500 hover:shadow-xl

          sm:min-w-0 sm:p-8
        "
      >
        {/* Hover Gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-50 via-white to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <h3 className="relative text-lg sm:text-xl font-semibold text-[#091D35] group-hover:text-red-600">
          {community.name}
        </h3>

        <p className="relative mt-3 text-sm leading-relaxed text-gray-600">
          {community.description}
        </p>

        {propertyCounts[community.name] !== undefined && (
          <p className="relative mt-2 text-xs font-medium text-gray-500">
            {propertyCounts[community.name] || 0} {propertyCounts[community.name] === 1 ? 'property' : 'properties'} available
          </p>
        )}

        <div className="relative mt-6 inline-flex items-center text-sm font-semibold text-red-600 group-hover:text-red-700 transition">
          View Homes →
        </div>
      </div>
    );
  })}
</div>



        {/* CTA */}
        <div className="mt-16 text-center">
          <button
            onClick={() => router.push("/buy")}
            className="rounded-full bg-red-600 px-10 py-4 text-sm font-semibold tracking-wide text-white transition hover:bg-red-700"
          >
            View All Communities
          </button>
        </div>

      </div>
    </section>
  );
}
