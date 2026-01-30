"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  };

  const rejectCookies = () => {
    localStorage.setItem("cookie_consent", "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-[#0B1F3A] text-white">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <p className="text-sm text-center md:text-left">
          We use cookies to improve your experience, analyze site traffic, and
          support our services. By clicking “Accept”, you consent to our use of
          cookies.{" "}
          <Link
            href="/cookies-policy"
            className="underline text-[#FACC15]"
          >
            Learn more
          </Link>
        </p>

        <div className="flex gap-3">
          <button
            onClick={rejectCookies}
            className="px-4 py-2 text-sm border border-white/40 rounded-full hover:bg-white/10 transition"
          >
            Reject
          </button>

          <button
            onClick={acceptCookies}
            className="px-5 py-2 text-sm font-semibold rounded-full bg-[#FACC15] text-black hover:bg-yellow-400 transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
