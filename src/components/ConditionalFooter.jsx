"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const Footer = dynamic(() => import("@/components/Footer"), { ssr: true });

export default function ConditionalFooter() {
  // Show footer on all pages including listings page
  return <Footer />;
}

