"use client";

import Link from "next/link";

export default function Breadcrumbs({ city }) {
  if (!city) return null;

  return (
    <nav className="text-sm text-gray-500 mb-6">
      <Link href="/buy" className="hover:text-[#091D35]">
        Buy
      </Link>
      <span className="mx-2">→</span>
      <span className="font-medium text-[#091D35]">
        {city}
      </span>
    </nav>
  );
}
