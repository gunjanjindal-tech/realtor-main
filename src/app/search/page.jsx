import SearchResults from "@/components/search/SearchResults";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = params?.q || params?.query || "";

  return (
    <>
      {/* HERO */}
      <div className="pt-40 pb-20 bg-[#091D35] text-white">
        <div className="max-w-[1600px] mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-extrabold">
            Search Results
          </h1>

          {query && (
            <p className="mt-4 text-lg text-white/80">
              Results for: <span className="font-semibold">"{query}"</span>
            </p>
          )}
        </div>
      </div>
      

      {/* BREADCRUMB — ADD HERE */}
      <div className="bg-white ">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-black">
              Home
            </Link>

            <ChevronRight className="w-4 h-4" />

            <span className="text-[#091D35] font-semibold">
              Search Results
            </span>

            {query && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-[#091D35] font-semibold">
                  {query}
                </span>
              </>
            )}
          </div>
              {/* Back to Home / View All Listings Button */}
      <div className="max-w-[1600px]  pt-8">
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
        >
          <span>View All Listings with Map</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </Link>
      </div>
        </div>
      </div>

      {/* RESULTS */}
      <SearchResults query={query} />
    </>
  );
}
