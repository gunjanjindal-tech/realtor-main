"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Phone, X, Calendar, Search } from "lucide-react";

export default function FullMenu({ close }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const mainLinks = [
    { label: "Buy", href: "/buy" },
    { label: "Rent", href: "/rent" },
    { label: "Sell", href: "/sell" },
    { label: "New Development", href: "/new-development" },
    { label: "About", href: "/about" },
    { label: "Contact Us", href: "/contact" },
  ];

  return (
    <>
      {/* OVERLAY */}
      <button
        aria-label="Close menu overlay"
        onClick={close}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      />

      {/* WRAPPER */}
      <div className="fixed inset-0 z-50 flex justify-center px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="relative w-full max-w-[1600px] h-full max-h-[92vh] 
        rounded-3xl bg-[#071C34] text-white shadow-2xl flex flex-col overflow-hidden">

          {/* Base Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#071C34] via-[#0A2747] to-[#071C34]" />

          {/* 🔥 Sliding Watermark Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap 
            text-[18vw] font-extrabold text-white/5 tracking-widest animate-slide-text">
              BANSAL &nbsp; BANSAL &nbsp; BANSAL &nbsp; BANSAL &nbsp; BANSAL
            </div>
          </div>

          {/* CONTENT WRAPPER */}
          <div className="relative z-10 flex flex-col h-full">

            {/* TOP BAR */}
            <div className="flex items-center justify-between px-5 sm:px-10 py-5 border-b border-white/10">

              <Link
                href="/"
                onClick={close}
                className="text-lg sm:text-2xl font-extrabold text-red-500 tracking-wide"
              >
                BANSAL .
              </Link>

              <div className="flex items-center gap-2 sm:gap-4">

                <div className="hidden md:flex items-center gap-4">

                  <a
                    href="tel:19023995007"
                    className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition"
                  >
                    <Phone size={14} />
                    902-399-5007
                  </a>

                  <Link
                    href="https://akshay42hj.setmore.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700 transition"
                  >
                    <Calendar size={14} />
                    Schedule
                  </Link>

                  <Link
                    href="/buy"
                    onClick={close}
                    className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#071C34]"
                  >
                    <Search size={14} />
                    Find a Home
                  </Link>

                </div>

                <button
                  onClick={close}
                  className="rounded-full border border-white/20 p-2 hover:bg-white/10 transition"
                >
                  <X size={18} />
                </button>

              </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-10 lg:px-12 py-12 sm:py-14">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">

                {/* IMAGE */}
                <div className="hidden lg:flex items-center justify-center">
                  <div className="h-[420px] w-[320px] rounded-2xl bg-white/10 overflow-hidden">
                    <img
                      src="/images/founder.png"
                      alt="Akshay Bansal - Realtor"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>

                {/* MAIN LINKS */}
                <div className="flex flex-col justify-center space-y-6
                text-xl sm:text-2xl md:text-[28px] lg:text-[34px]
                font-semibold leading-tight">
                  {mainLinks.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={close}
                      className="group flex items-center gap-5"
                    >
                      <span className="h-[2px] w-0 bg-red-500 transition-all duration-300 group-hover:w-10" />
                      <span className="transition-all duration-300 group-hover:translate-x-2 group-hover:text-red-500">
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </div>

                {/* SIDE INFO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-12 text-sm">

                  <div className="sm:col-span-2">
                    <p className="mb-4 text-xs uppercase tracking-widest text-white/50">
                      Community Listings
                    </p>


                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-white/80 ">
                      {[
                        "Halifax",
                        "Bedford",
                        "Dartmouth",
                        "Forest Hills",
                        "Cole Harbour",
                        "Timberlea",
                        "Spryfield",
                        "Hammonds Plains",
                        "Purcell’s Cove",
                        "Sackville",
                        "Clayton Park",
                        "Fall River",
                      ].map((city) => {
                        const slug = city.toLowerCase().replace(/\s+/g, "-");

                        return (
                          <Link
                            key={city}
                            href={`/buy/${slug}`}
                            onClick={close}
                            className="hover:text-white hover:underline underline-offset-2 transition"
                          >
                            {city}
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-4 text-xs uppercase tracking-widest text-white/50">
                      Contact
                    </p>
                    <ul className="space-y-2 text-white/80 text-sm">
                      <li>902-399-5007</li>
                      <li>akshay@remaxnova.ca</li>
                      <li>Nova Scotia, Canada</li>
                    </ul>
                  </div>

                  <div>
                    <p className="mb-4 text-xs uppercase tracking-widest text-white/50">
                      Legal
                    </p>
                    <ul className="space-y-2 text-white/80 text-sm">
                      <li><Link href="/privacy-policy" onClick={close}>Privacy Policy</Link></li>
                      <li><Link href="/cookies-policy" onClick={close}>Cookies Policy</Link></li>
                      <li><Link href="/terms-of-use" onClick={close}>Terms of Use</Link></li>
                    </ul>
                  </div>

                </div>
              </div>
            </div>

            <div className="border-t border-white/10 py-3 text-center text-xs text-white/40">
              © 2026 TheRealtor. All rights reserved.
            </div>

          </div>
        </div>
      </div>
    </>
  );
}