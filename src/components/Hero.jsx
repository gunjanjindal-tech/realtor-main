export default function Hero() {
  return (
    <section className="relative h-screen overflow-hidden">

      {/* Background Video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/videos/nova-scotia.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Cinematic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">

        {/* Glass Floating Heading */}
        <div className="animate-slide-right-luxury relative">

          {/* Blue glass outline */}
          <div className="absolute -inset-4 rounded-3xl border border-blue-300/25 bg-white/5 backdrop-blur-2xl" />

          <h1 className="relative text-5xl md:text-6xl font-bold leading-tight tracking-tight drop-shadow-[0_10px_40px_rgba(0,0,0,0.7)]">
            Make Your Move to Nova Scotia
          </h1>
        </div>

        {/* Subheading */}
        <p className="animate-fade-up-luxury delay-200 mt-7 max-w-2xl text-lg md:text-xl text-white/90">
          Discover homes, communities, and opportunities across Nova Scotia.
        </p>

        {/* Search */}
        <div className="animate-fade-up-luxury delay-400 mt-14 flex w-full max-w-3xl overflow-hidden rounded-full bg-white/90 backdrop-blur-2xl shadow-2xl">
          <input
            type="text"
            placeholder="Search homes by city, address, or MLS® number"
            className="flex-1 bg-transparent px-6 py-4 text-black outline-none placeholder:text-gray-500"
          />
          <button className="bg-[#091D35] px-10 text-white font-semibold transition hover:bg-[#0c2a4d]">
            Search
          </button>
        </div>

      </div>
    </section>
  );
}
