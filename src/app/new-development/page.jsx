"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import NewDevelopmentHero from "@/components/new-development/NewDevelopmentHero";
import NewDevelopmentRegions from "@/components/new-development/NewDevelopmentRegions";
import FeaturedProperties from "@/components/new-development/FeaturedProperties";

function NewDevelopmentContent() {
  const searchParams = useSearchParams();
  const city = searchParams?.get("city") || "";

  return (
    <>
      <NewDevelopmentHero />
      <NewDevelopmentRegions />
      <FeaturedProperties city={city} />
    </>
  );
}

export default function NewDevelopmentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <NewDevelopmentContent />
    </Suspense>
  );
}



