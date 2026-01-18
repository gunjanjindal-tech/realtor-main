"use client";

import { useEffect, useState } from "react";
import FullMenu from "./FullMenu";
import { Search } from "lucide-react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    onScroll(); // 👈 important: initial check
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 w-full z-50
          transition-all duration-500
          ${
            scrolled
              ? "bg-[rgb(9,29,53)]/95 backdrop-blur-md shadow-lg"
              : "bg-transparent"
          }
        `}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 text-white">
          
          {/* LOGO */}
          <div className="text-2xl font-bold tracking-wide">
            THE<span className="text-[rgb(229,14,11)]">REALTOR</span>
          </div>

          {/* NAV */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
            <a href="#">Buy</a>
            <a href="#">Rent</a>
            <a href="#">Sell</a>
            <a href="#">New Development</a>
          </nav>

          {/* RIGHT */}
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-sm font-semibold">
              902-399-5007
            </span>

            {/* SEARCH (transparent-friendly) */}
            <div
  className={`
    hidden md:flex items-center gap-3 rounded-full px-4 py-2 text-sm
    transition
    ${
      scrolled
        ? "bg-white text-black"
        : "bg-white/90 text-black"
    }
  `}
>
  {/* Region */}
  <span className="text-gray-500 font-medium">NS</span>

  {/* Input */}
  <input
    type="text"
    placeholder="Search residences"
    className="w-40 bg-transparent outline-none placeholder:text-gray-500"
  />

  {/* Search Icon */}
  <Search
    size={16}
    className="text-gray-500 cursor-pointer hover:text-black transition"
  />
</div>


            {/* CTA */}
            <button className="rounded-full bg-[rgb(229,14,11)] px-5 py-2 text-sm font-semibold hover:opacity-90">
              Schedule Meeting
            </button>

            {/* MENU */}
            <button
              onClick={() => setOpen(true)}
              className="rounded-full border border-white px-4 py-2 text-sm"
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
