import Link from "next/link";

export default function RentHero() {
  return (
    <section className="relative h-[65vh] flex items-center justify-center bg-[#0E2A47] text-white">
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 text-center px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold">
          Rent in Nova Scotia
        </h1>
        <div className="mx-auto mt-6 h-[3px] w-24 bg-red-600" />
        <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
          Find rental properties and homes for lease across Nova Scotia.
        </p>
        <Link
          href="/listings?type=rent"
          className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
        >
          View All Rentals
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
