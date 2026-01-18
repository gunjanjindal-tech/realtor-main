"use client";

export default function FullMenu({ close }) {
  return (
    <div className="fixed inset-0 z-50 bg-[rgb(9,29,53)]/95 backdrop-blur-2xl">
      
      {/* CLOSE BUTTON — TOP RIGHT OF SCREEN */}
      <button
        onClick={close}
        className="absolute right-10 top-8 z-50 rounded-full border border-white/20 px-3 py-1 text-2xl text-white/70 hover:bg-white/10 hover:text-white transition"
      >
        ✕
      </button>

      <div className="relative mx-auto flex h-full max-w-7xl px-14 text-white">

        {/* Watermark */}
        <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[420px] font-bold text-white/5">
          R
        </div>

        {/* Content Wrapper */}
        <div className="relative ml-auto flex w-full max-w-5xl flex-col py-14">

          {/* Main Layout */}
          <div className="mt-16 flex items-center">

            {/* LEFT — Navigation */}
            <div className="ml-auto w-[420px] space-y-6 pr-10 text-[34px] font-semibold">
              {[
                "Buy",
                "Rent",
                "Sell",
                "New Development",
                "Coming Soon",
                "Contact Us",
                "Shop",
              ].map((item) => (
                <div
                  key={item}
                  className="group flex items-center gap-6 cursor-pointer"
                >
                  <span className="h-[1px] w-0 bg-red-500 transition-all duration-300 group-hover:w-10" />
                  <span className="transition-all duration-300 group-hover:translate-x-2 group-hover:text-red-500">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="mx-10 h-[70%] w-px bg-white/15" />

            {/* RIGHT — Company & Insights */}
            <div className="flex w-64 flex-col justify-center gap-10">
              <div>
                <h4 className="mb-3 text-xs uppercase tracking-[0.3em] text-white/50">
                  Company
                </h4>
                <div className="space-y-2 text-sm text-white/80">
                  <p>About Us</p>
                  <p>Careers</p>
                  <p>Offices</p>
                  <p>Press & Media</p>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-xs uppercase tracking-[0.3em] text-white/50">
                  Insights
                </h4>
                <div className="space-y-2 text-sm text-white/80">
                  <p>Market Knowledge</p>
                  <p>Community Listings</p>
                  <p>Buyer & Seller Guides</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
