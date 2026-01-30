"use client";

import Link from "next/link";
import { Phone, X, Calendar, Search } from "lucide-react";

export default function FullMenu({ close }) {
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
      {/* ===== Overlay (NOT FULLSCREEN PANEL) ===== */}
      <div
        onClick={close}
        className="fixed inset-0 z-50 flex justify-center px-4 py-4 overflow-hidden"
      />

      {/* ===== Floating Menu Card ===== */}
      <div className="fixed inset-0 z-50 flex justify-center pt-4 px-6">
        <div className="relative w-full max-w-[1600px] h-full max-h-[90vh] rounded-3xl bg-[#071C34] text-white shadow-2xl flex flex-col">

          {/* ================= TOP BAR ================= */}
          <div className="flex items-center justify-between px-10 py-6 border-b border-white/10">
            <Link
              href="/"
              onClick={close}
              className="text-2xl font-extrabold tracking-wide"
            >
              THE<span className="text-red-500">REALTOR</span>
            </Link>

            <div className="flex items-center gap-4">
              <a
                href="tel:19023995007"
                className="hidden md:flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition"
              >
                <Phone size={14} />
                902-399-5007
              </a>

               {/* Schedule Meeting */}
              <Link
                href="https://akshay42hj.setmore.com"
                target="_blank"
           rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700"
              >
                <Calendar size={14} />
                Schedule Meeting
              </Link>


              <Link
                href="/buy"
                className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#071C34]"
              >
                <Search size={14} />
                Find a Home
              </Link>

              <button
                onClick={close}
                className="rounded-full border border-white/20 p-2 hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>


          

          {/* ================= MAIN GRID ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 px-6 sm:px-10 lg:px-12 py-20 overflow-y-auto flex-1">

            {/* LEFT — IMAGE SPACE */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="h-[420px] w-[320px] rounded-2xl bg-white/10 flex items-center justify-center text-white/40 text-sm">
                Realtor Image Here
              </div>
            </div>

            {/* CENTER — PRIMARY NAV (WITH RED LINE EFFECT) */}
            <div className="flex flex-col justify-center space-y-7 text-[34px] font-semibold">
              {mainLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={close}
                  className="group flex items-center gap-5"
                >
                  {/* RED LINE */}
                  <span className="h-[2px] w-0 bg-red-500 transition-all duration-300 group-hover:w-10" />

                  {/* TEXT */}
                  <span className="transition-all duration-300 group-hover:translate-x-2 group-hover:text-red-500">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>

            {/* RIGHT — SECONDARY NAV */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-14 text-sm">

            

           {/* Community Listings – FULL WIDTH */}
<div className="lg:col-span-2">
  <p className="mb-4 text-sm uppercase tracking-widest text-white/50">
    Community Listings
  </p>

  <div className="grid grid-cols-1 sm:grid-cols-2 space-y-4 space-x-10 text-white/80">
    {[
      "Halifax Real Estate",
      "Bedford Real Estate",
      "Sackville Real Estate",
      "Clayton Park Real Estate",
      "Timberlea Real Estate",
      "Spryfield Real Estate",
      "Dartmouth Real Estate",
      "Cole Harbour Real Estate",
      "Forest Hills Real Estate",
      "Fall River Real Estate",
      "Hammonds Plains Real Estate",
      "Purcell’s Cove Real Estate",
    ].map((c) => (
      <Link
        key={c}
        href="/communities"
        onClick={close}
        className="hover:text-white hover:underline underline-offset-2 transition"
      >
        {c}
      </Link>
    ))}
  </div>

  <Link
    href="/communities"
    onClick={close}
    className="inline-block mt-4 text-sm font-medium text-white underline"
  >
    View All Communities »
  </Link>
</div>



              {/* Contact */}
              <div>
                <p className="mb-4 text-sm uppercase tracking-widest text-white/50">
                  Contact
                </p>
                <ul className="space-y-2 text-white/80">
                  <li><a href="tel:19023995007">902-399-5007</a></li>
                  <li><a href="mailto:akshay@remaxnova.ca">akshay@remaxnova.ca</a></li>
                  <li>Nova Scotia, Canada</li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <p className="mb-4 text-sm uppercase tracking-widest text-white/50">
                  Legal
                </p>
                <ul className="space-y-2 text-white/80">
                  <li><Link href="/privacy-policy" onClick={close}>Privacy Policy</Link></li>
                  <li><Link href="/cookies-policy" onClick={close}>Cookies Policy</Link></li>
                  <li><Link href="/terms-of-use" onClick={close}>Terms of Use</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="border-t border-white/10 py-3 text-center text-xs text-white/40">
            © 2026 TheRealtor. All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
}
