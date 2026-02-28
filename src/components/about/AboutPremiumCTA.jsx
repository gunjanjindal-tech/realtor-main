function AboutPremiumCTA() {
  return (
    <section className="py-28 bg-white">
      <div className="max-w-[1400px] mx-auto px-4">

        <div
          className="
            relative overflow-hidden rounded-3xl
            bg-[#091D35] px-10 py-20 md:px-20
            text-white
          "
        >
          {/* subtle background accents */}
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/5" />
          <div className="absolute bottom-0 left-0 h-[3px] w-40 bg-[rgb(229,14,11)]" />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* LEFT */}
            <div>
              <span className="text-sm tracking-widest text-[rgb(229,14,11)] font-semibold uppercase">
                Ready When You Are
              </span>

              <h2 className="mt-4 text-4xl font-bold leading-tight">
                Make Confident Real Estate Decisions
              </h2>

              <p className="mt-6 text-white/80 text-lg leading-relaxed max-w-xl">
                Whether you’re buying, selling, or investing — we help you
                move forward with clarity, strategy, and confidence.
              </p>
            </div>

          {/* RIGHT */}
<div className="flex flex-col sm:flex-row gap-6 lg:justify-end">

  {/* BOOK A CONSULTATION – SETMORE */}
  <a
    href="https://akshay42hj.setmore.com"
    target="_blank"
    rel="noopener noreferrer"
    className="
      inline-flex items-center justify-center
      px-10 py-4 rounded-xl
      bg-[rgb(229,14,11)]
      text-white font-semibold text-lg
      hover:opacity-90 hover:-translate-y-1
      transition-all duration-300
    "
  >
    Book a Consultation
  </a>

  {/* CONTACT US – INTERNAL PAGE */}
  <a
    href="/contact"
    className="
      inline-flex items-center justify-center
      px-10 py-4 rounded-xl
      border border-white/30
      text-white font-semibold text-lg
      hover:bg-white hover:text-[#091D35]
      transition-all duration-300
    "
  >
    Contact Us
  </a>

</div>


          </div>
        </div>

      </div>
    </section>
  );
}

export default AboutPremiumCTA;