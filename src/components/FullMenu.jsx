"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Phone, X, Calendar, Search } from "lucide-react";

export default function FullMenu({ close }) {

  /* 🔒 LOCK BODY SCROLL */
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
      {/* ===== OVERLAY ===== */}
      <button
        aria-label="Close menu overlay"
        onClick={close}
        className="fixed inset-0 z-40 bg-black/40"
      />

      {/* ===== MENU WRAPPER ===== */}
      <div className="fixed inset-0 z-50 flex justify-center px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="relative w-full max-w-[1600px] h-full max-h-[92vh] rounded-3xl bg-[#071C34] text-white shadow-2xl flex flex-col overflow-hidden">

          {/* ================= TOP BAR ================= */}
          <div className="flex items-center justify-between px-5 sm:px-10 py-5 border-b border-white/10">

            {/* LOGO */}
            <Link
              href="/"
              onClick={close}
              className="text-xl sm:text-2xl font-extrabold text-red-500 tracking-wide"
            >
              BANSAL .
            </Link>

            {/* RIGHT ACTIONS */}
            <div className="flex items-center gap-2 sm:gap-4">

              {/* PHONE */}
              <a
                href="tel:19023995007"
                className="hidden md:flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition"
              >
                <Phone size={14} />
                902-399-5007
              </a>

              {/* SCHEDULE */}
              <Link
                href="https://akshay42hj.setmore.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700"
              >
                <Calendar size={14} />
                Schedule
              </Link>

              {/* FIND HOME */}
              <Link
                href="/buy"
                onClick={close}
                className="hidden lg:flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#071C34]"
              >
                <Search size={14} />
                Find a Home
              </Link>

              {/* CLOSE */}
              <button
                onClick={close}
                className="rounded-full border border-white/20 p-2 hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ================= CONTENT ================= */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-10 lg:px-12 py-14">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">

              {/* LEFT IMAGE */}
              <div className="hidden lg:flex items-center justify-center">
                <div className="h-[420px] w-[320px] rounded-2xl bg-white/10 flex items-center justify-center text-white/40 text-sm">
                  Realtor Image Here
                </div>
              </div>

              {/* MAIN NAV */}
              <div className="flex flex-col justify-center space-y-7 text-3xl sm:text-[34px] font-semibold">
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

              {/* RIGHT LINKS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-14 text-sm">

                {/* COMMUNITIES */}
                <div className="sm:col-span-2">
                  <p className="mb-4 text-xs uppercase tracking-widest text-white/50">
                    Community Listings
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-white/80">
                    {[
                      "Halifax Real Estate",
                      "Bedford Real Estate",
                      "Dartmouth Real Estate",
                      "Sackville Real Estate",
                      "Clayton Park Real Estate",
                      "Fall River Real Estate",
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
                    className="inline-block mt-4 text-xs font-medium text-white underline"
                  >
                    View All Communities →
                  </Link>
                </div>

                {/* CONTACT */}
                <div>
                  <p className="mb-4 text-xs uppercase tracking-widest text-white/50">
                    Contact
                  </p>
                  <ul className="space-y-2 text-white/80">
                    <li><a href="tel:19023995007">902-399-5007</a></li>
                    <li><a href="mailto:akshay@remaxnova.ca">akshay@remaxnova.ca</a></li>
                    <li>Nova Scotia, Canada</li>
                  </ul>
                </div>

                {/* LEGAL */}
                <div>
                  <p className="mb-4 text-xs uppercase tracking-widest text-white/50">
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
