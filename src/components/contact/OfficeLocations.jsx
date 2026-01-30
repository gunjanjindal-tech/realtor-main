"use client";

import { useState } from "react";
import { MapPin, Phone, Clock, Mail } from "lucide-react";
import { offices } from "@/data/offices";

export default function OfficeLocations() {
  const [active, setActive] = useState(0);
  const office = offices[active];

  return (
    <section className="mt-24">
      {/* SECTION TITLE */}
      <h2 className="text-3xl font-extrabold text-[#091D35]">
        REMAX Nova Offices
      </h2>

      {/* CITY TABS */}
      <div className="mt-8 flex flex-wrap gap-3">
        {offices.map((o, i) => (
          <button
            key={o.city}
            onClick={() => setActive(i)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition
              ${
                active === i
                  ? "bg-[#091D35] text-white"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-100"
              }`}
          >
            {o.city}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10 rounded-3xl border border-gray-200 bg-white p-8 shadow-xl">
        
        {/* LEFT – DETAILS */}
        <div className="space-y-6 text-gray-700">
          <h3 className="text-xl font-bold text-[#091D35]">
            {office.city} Real Estate Office
          </h3>

          <div className="flex items-start gap-3">
            <MapPin className="mt-1 text-[#091D35]" size={18} />
            <p>{office.address}</p>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="text-[#091D35]" size={18} />
            <a href={`tel:${office.phone}`} className="hover:underline">
              {office.phone}
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="text-[#091D35]" size={18} />
            <a
              href={`mailto:${office.email}`}
              className="hover:underline"
            >
              {office.email}
            </a>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="mt-1 text-[#091D35]" size={18} />
            <ul className="space-y-1">
              {office.hours.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT – MAP */}
        <div className="h-[350px] w-full overflow-hidden rounded-2xl border">
          <iframe
            src={office.map}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
