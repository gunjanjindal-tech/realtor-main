import { Linkedin, Instagram, Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0B1F3B] text-gray-400">
      <div className="mx-auto max-w-7xl px-6 py-20">

        {/* Top Grid */}
        <div className="grid gap-14 md:grid-cols-2 lg:grid-cols-5">

          {/* Brand */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-white">
              THE<span className="text-red-500">REALTOR</span>
            </h3>

            <p className="mt-5 max-w-md text-sm leading-relaxed">
              Trusted Nova Scotia real estate guidance for buyers, sellers,
              and investors. Local expertise, data-driven insights, and a
              client-first approach — without pressure or gimmicks.
            </p>
          </div>

          {/* Buyers / Sellers */}
          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
              Buyers / Sellers
            </h4>

            <ul className="space-y-3 text-sm">
              <li className="hover:text-white transition">Buy a Home</li>
              <li className="hover:text-white transition">Sell a Home</li>
              <li className="hover:text-white transition">New Developments</li>
              <li className="hover:text-white transition">Market Insights</li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
              Resources
            </h4>

            <ul className="space-y-3 text-sm">
              <li className="hover:text-white transition">Communities</li>
              <li className="hover:text-white transition">Why Nova Scotia</li>
              <li className="hover:text-white transition">Buyer Guide</li>
              <li className="hover:text-white transition">Seller Guide</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
              Contact
            </h4>

            <ul className="space-y-4 text-sm">
              <li>
                <span className="block text-white">Phone</span>
                902-399-5007
              </li>

              <li>
                <span className="block text-white">Email</span>
                info@therealtor.ca
              </li>

              <li>
                <span className="block text-white">Location</span>
                Nova Scotia, Canada
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
<div className="mt-20 h-px w-full bg-white/10" />

{/* Legal Note */}
<div className="mt-10 rounded-xl bg-white/5 px-6 py-6 text-xs leading-relaxed text-gray-400">
  <p>
    The information provided on this website is for general informational purposes
    only and should not be considered professional or legal advice. Real estate
    market conditions may change, and all listings are subject to availability.
  </p>

  <p className="mt-4">
    By using this website, you agree to our{" "}
    <span className="text-gray-300 hover:text-white transition">
      Terms of Use
    </span>
    ,{" "}
    <span className="text-gray-300 hover:text-white transition">
      Privacy Policy
    </span>
    , and{" "}
    <span className="text-gray-300 hover:text-white transition">
      Cookies Policy
    </span>
    . We use cookies to improve your browsing experience, analyze site traffic,
    and personalize content.
  </p>
</div>

{/* Bottom Bar */}
{/* Bottom Bar */}
<div className="mt-10 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-6 text-sm text-gray-400 md:flex-row">
  
  <p>© 2026 TheRealtor. All rights reserved.</p>

  <div className="flex items-center gap-8">
    {/* Legal Links */}
    <div className="flex gap-6">
      <span className="hover:text-white transition cursor-pointer">
        Privacy Policy
      </span>
      <span className="hover:text-white transition cursor-pointer">
        Terms of Use
      </span>
      <span className="hover:text-white transition cursor-pointer">
        Cookies Policy
      </span>
    </div>

    {/* Social Icons */}
    <div className="flex items-center gap-4 border-l border-white/10 pl-6">
      <a
        href="#"
        aria-label="LinkedIn"
        className="text-gray-400 hover:text-white transition"
      >
        <Linkedin size={18} />
      </a>

      <a
        href="#"
        aria-label="Instagram"
        className="text-gray-400 hover:text-white transition"
      >
        <Instagram size={18} />
      </a>

      <a
        href="#"
        aria-label="Facebook"
        className="text-gray-400 hover:text-white transition"
      >
        <Facebook size={18} />
      </a>
    </div>
  </div>
</div>

        </div>
    </footer>
  );
}
