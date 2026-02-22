"use client";

import { Suspense } from "react";
import PropertyListingsContent from "./PropertyListingsContent";

export default function PropertyListingsView() {
  return (
    <Suspense fallback={<div>Loading listings...</div>}>
      <PropertyListingsContent />
    </Suspense>
  );
}