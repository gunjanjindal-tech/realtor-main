export const dynamic = "force-dynamic";

import { Suspense } from "react";
import PropertyDetailClient from "./PropertyDetailClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PropertyDetailClient />
    </Suspense>
  );
}