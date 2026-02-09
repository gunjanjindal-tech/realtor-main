"use client";

import Image from "next/image";
import {
  Phone,
  Mail,
  Linkedin,
  Instagram,
} from "lucide-react";
import SaveContactButton from "../contact/SaveContactButton";

export default function ListingAgentCard() {
  return (
    <div className="rounded-3xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-8">
      
      {/* HEADER */}
      <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">
        Listing Agent
      </p>

      <div className="flex items-center gap-5">
        {/* IMAGE */}
        <div className="relative h-28 w-28 rounded-full overflow-hidden">
          <Image
            src="/images/A7_09488.jpg"
            alt="Akshay Bansal"
            fill
            className="object-cover "
          />
        </div>

        {/* NAME */}
        <div>
          <h3 className="text-xl font-bold text-[#091D35]">
            Akshay Bansal
          </h3>
          <p className="text-sm text-gray-600">
            Nova Scotia Real Estate Advisor
          </p>
        </div>
      </div>

      {/* CONTACT */}
      <div className="mt-6 space-y-4 text-sm">
        <a
          href="tel:+19023995007"
          className="flex items-center gap-3 text-[#091D35] hover:underline"
        >
          <Phone size={16} />
          902-399-5007
        </a>

        <a
          href="mailto:akshay@remaxnova.ca"
          className="flex items-center gap-3 text-[#091D35] hover:underline"
        >
          <Mail size={16} />
          akshay@remaxnova.ca
        </a>
      </div>

      {/* SOCIAL */}
      <div className="mt-6 flex gap-4">
        <a
          href="https://linkedin.com/in/akshaytherealtor"
          target="_blank"
          className="rounded-full border p-2 hover:bg-gray-100 transition"
        >
          <Linkedin size={16} />
        </a>

        <a
          href="https://instagram.com/akshaytherealtor"
          target="_blank"
          className="rounded-full border p-2 hover:bg-gray-100 transition"
        >
          <Instagram size={16} />
        </a>
      </div>

      {/* CTA */}
      <div className="mt-8 flex flex-col gap-4 text-center">
        <a
          href="https://akshay42hj.setmore.com"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#091D35] py-4 text-center text-sm font-semibold text-white hover:bg-white hover:text-[#091D35] hover:border transition"
        >
          Get in Touch
        </a>

        <SaveContactButton />
      </div>
    </div>
  );
}
