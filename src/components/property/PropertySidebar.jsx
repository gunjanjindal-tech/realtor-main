"use client";

import ScheduleTourCard from "./ScheduleTourCard";
import ListingAgentCard from "./ListingAgentCard";


export default function PropertySidebar() {
  return (
    <aside className="space-y-10 lg:sticky lg:top-28">
      {/* REQUEST TOUR */}
      <ScheduleTourCard />

      {/* LISTING AGENT */}
      <ListingAgentCard />


    </aside>
  );
}
