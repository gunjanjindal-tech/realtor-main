"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import FullMenu from "./FullMenu";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500
          ${scrolled
            ? "bg-[#091D35]/95 backdrop-blur-md shadow-lg"
            : "bg-transparent"}
        `}
      >
        <div className="mx-auto flex h-20 max-w-[1800px] items-center justify-between px-4 sm:px-6 xl:px-10 text-white">

          {/* LOGO */}
          <Link href="/" className="text-xl md:text-2xl text-red-500 font-extrabold tracking-wide">
           BANSAL .
          </Link>

          {/* NAV – Desktop Only */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
            <Link href="/buy">Buy</Link>
            <Link href="/rent">Rent</Link>
            <Link href="/sell">Sell</Link>
            <Link href="/new-development">New Development</Link>
          </nav>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-3 sm:gap-4">

            {/* PHONE – Laptop+ */}
            <a
              href="tel:19023995007"
              className="hidden lg:block text-sm font-semibold hover:text-white/80"
            >
              902-399-5007
            </a>

            {/* SEARCH – Tablet+ */}
            <div className="hidden md:flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm text-black">
              <span className="font-medium text-gray-500">NS</span>
              <input
                placeholder="Search residences"
                className="w-40 bg-transparent outline-none placeholder:text-gray-500"
              />
              <Search size={16} className="text-gray-500" />
            </div>

            {/* CTA – Desktop Only */}
           <a
  href="https://akshay42hj.setmore.com"
  target="_blank"
  rel="noopener noreferrer"
  className="hidden xl:inline-flex rounded-full bg-red-600 px-6 py-2 text-sm font-semibold hover:bg-red-700"
>
  Schedule Meeting
</a>


            {/* MENU – Always */}
            <button
              onClick={() => setOpen(true)}
              className="rounded-full border border-white px-4 py-2 text-sm hover:bg-white hover:text-black transition"
            >
              Menu ☰
            </button>
          </div>
        </div>
      </header>

      {open && <FullMenu close={() => setOpen(false)} />}
    </>
  );
}
