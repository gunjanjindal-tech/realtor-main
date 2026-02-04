import SearchResults from "@/components/search/SearchResults";

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = params?.q || params?.query || "";

  return (
    <>
      <div className="pt-20 pb-10 bg-[#091D35] text-white">
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
      <SearchResults query={query} />
    </>
  );
}

