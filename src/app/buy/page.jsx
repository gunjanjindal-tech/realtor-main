"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import BuyPageClient from "./BuyPageClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BuyPageClient />
    </Suspense>
  );
}