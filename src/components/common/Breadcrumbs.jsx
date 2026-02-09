"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

export default function Breadcrumbs({ lastLabel }) {
  const pathname = usePathname();

  if (!pathname) return null;

  const segments = pathname.split("/").filter(Boolean);

  const format = (text) =>
    text
      .replaceAll("-", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <nav className="flex items-center flex-wrap text-sm text-gray-500 mb-6">
      <Link href="/" className="hover:text-[#091D35]">
        Home
      </Link>

      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");

        const isLast = index === segments.length - 1;

        return (
          <div key={href} className="flex items-center">
            <ChevronRight className="mx-2 w-4 h-4" />

            {isLast ? (
              <span className="font-medium text-[#091D35]">
                {lastLabel || format(segment)}
              </span>
            ) : (
              <Link href={href} className="hover:text-[#091D35]">
                {format(segment)}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
