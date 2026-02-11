"use client";

import { Linkedin, Instagram, Facebook } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const handleCookiePreferences = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("cookie_consent");
      window.location.reload();
    }
  };

  return (
    <footer className="bg-[#0B1F3B] text-gray-400">
      <div className="mx-auto w-full max-w-[1800px] px-6 xl:px-10 py-20">

        {/* ================= TOP GRID ================= */}
        <div className="grid gap-16 lg:grid-cols-5">

          {/* BRAND */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-extrabold text-red-500  tracking-wide">
           BANSAL .
            </h3>

            <p className="mt-6 max-w-md text-sm leading-relaxed">
              Trusted Nova Scotia real estate guidance for buyers, sellers,
              and investors. Local expertise, data-driven insights, and a
              client-first approach — without pressure or gimmicks.
            </p>
          </div>

          {/* COMMUNITY LISTINGS */}
          <div className="lg:col-span-2">
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-widest text-white">
              Community Listings
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-2 space-x-10 space-y-3 text-sm">
             {[
  "Halifax Real Estate",
  "Bedford Real Estate",
  "Dartmouth Real Estate",
  "Forest Hills Real Estate",
  "Cole Harbour Real Estate",
  "Timberlea Real Estate",
  "Spryfield Real Estate",
  "Hammonds Plains Real Estate",
  "Purcell’s Cove Real Estate",
  "Sackville Real Estate",
  "Clayton Park Real Estate",
  "Fall River Real Estate",
].map((c) => {
  const city = c.replace(" Real Estate", "");
  const slug = city.toLowerCase().replace(/\s+/g, "-");

  return (
    <Link
      key={c}
      href={`/buy/${slug}`}
      className="hover:text-white hover:underline underline-offset-2 transition"
    >
      {c}
    </Link>
  );
})}

            </div>

           
          </div>

          {/* CONTACT */}
          <div>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-widest text-white">
              Contact
            </h4>

            <ul className="space-y-4 text-sm">
              <li>
                <span className="block text-white">Phone</span>
                <a href="tel:19023995007" className="hover:text-white transition">
                  902-399-5007
                </a>
              </li>

              <li>
                <span className="block text-white">Email</span>
                <a
                  href="mailto:info@therealtor.ca"
                  className="hover:text-white transition"
                >
                  info@therealtor.ca
                </a>
              </li>

              <li>
                <span className="block text-white">Location</span>
                Nova Scotia, Canada
              </li>
            </ul>
          </div>
        </div>



{/* ================= LEGAL ================= */}
<div className="mt-20 rounded-2xl bg-white/5 px-8 py-6 text-xs leading-relaxed text-gray-400 max-w-5xl ">
  By using this website, you agree to our{" "}
  <Link href="/terms-of-use" className="underline hover:text-white">
    Terms of Use
  </Link>
  ,{" "}
  <Link href="/privacy-policy" className="underline hover:text-white">
    Privacy Policy
  </Link>
  ,{" "}
  <Link href="/cookies-policy" className="underline hover:text-white">
    Cookies Policy
  </Link>
  ,{" "}
  <Link href="/accessibility" className="underline hover:text-white">
    Accessibility
  </Link>
  , and{" "}
  <button
    onClick={handleCookiePreferences}
    className="underline hover:text-white"
  >
    Cookie Preferences
  </button>
  .
</div>

{/* ================= BOTTOM BAR ================= */}
<div className="mt-16 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/10 pt-6 text-sm">
  <p>© 2026 TheRealtor. All rights reserved.</p>

  <div className="flex items-center gap-6">
    <a
      href="https://www.linkedin.com/company/remaxnova/"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-white"
    >
      <Linkedin size={18} />
    </a>

    <a
      href="https://www.instagram.com/remaxnova"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-white"
    >
      <Instagram size={18} />
    </a>

    <a
      href="https://www.facebook.com/REMAXnovaHRM/"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-white"
    >
      <Facebook size={18} />
    </a>
  </div>
</div>


      </div>
    </footer>
  );
}

function Office({ city, address, phone }) {
  return (
    <div className="px-6 py-4">
      <h5 className="mb-2 font-semibold text-white">{city}</h5>
      <p className="text-gray-400 leading-relaxed">{address}</p>
      <p className="mt-2 text-gray-300">Phone: {phone}</p>
    </div>
  );
}





