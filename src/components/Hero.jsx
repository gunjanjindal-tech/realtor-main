"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="relative min-h-[100svh] overflow-hidden">

      {/* Background Video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/videos/nova-scotia.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60" />

      {/* Content */}
      <div
        className="
          relative z-10 flex min-h-[100svh] flex-col items-center justify-center
          px-6 pt-[env(safe-area-inset-top)]
          text-center text-white
        "
      >
        {/* Heading */}
        <div className="relative mt-16 sm:mt-20 md:mt-0 animate-slide-right-luxury">
          <div className="absolute -inset-4 rounded-3xl backdrop-blur-2xl" />

          <h1
            className="
              relative font-bold tracking-tight leading-tight
              text-[34px]
              sm:text-4xl
              md:text-5xl
              lg:text-6xl
              drop-shadow-[0_10px_40px_rgba(0,0,0,0.7)]
            "
          >
            Make Your Move to Nova Scotia
          </h1>
        </div>

        {/* Subheading */}
        <p
          className="
            mt-6 sm:mt-7
            max-w-[90%]
            sm:max-w-xl
            md:max-w-2xl
            text-sm
            sm:text-base
            md:text-lg
            lg:text-xl
            text-white/90
            animate-fade-up-luxury delay-200
          "
        >
          Discover homes, communities, and opportunities across Nova Scotia.
        </p>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="
            mt-10 sm:mt-12 md:mt-14
            flex w-full
            max-w-[95%]
            sm:max-w-xl
            md:max-w-2xl
            lg:max-w-3xl
            overflow-hidden rounded-full
            bg-white/90 backdrop-blur-2xl
            shadow-2xl
            animate-fade-up-luxury delay-400
          "
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search homes by city, address, or MLS® number"
            className="
              flex-1 bg-transparent
              px-4 sm:px-6
              py-4
              text-sm sm:text-base
              text-black outline-none
              placeholder:text-gray-500
            "
          />

          <button
            type="submit"
            className="
              bg-[#091D35]
              px-6 sm:px-8 md:px-10
              text-sm sm:text-base
              font-semibold text-white
              transition hover:bg-[#0c2a4d]
            "
          >
            Search
          </button>
        </form>
      </div>
    </section>
  );
}