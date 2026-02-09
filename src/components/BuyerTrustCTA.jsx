"use client";

import { ShieldCheck, CalendarDays, UserPlus } from "lucide-react";

export default function BuyerTrustCTA() {
  return (
    <section className="mb-24">
      <div className="mx-auto max-w-[1600px] px-6">
        <div className="relative overflow-hidden rounded-3xl bg-[#091D35] px-8 py-12 sm:px-16">

          {/* Background Accent */}
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-600/20 blur-3xl" />

          <div className="relative z-10 grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center">

            {/* ================= LEFT CONTENT ================= */}
            <div>
              {/* TRUST LINE */}
              <div className="flex items-center gap-3 text-red-500">
                <ShieldCheck size={20} />
                <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase">
                  Trusted Local Realtor • Nova Scotia
                </span>
              </div>

              {/* HEADLINE */}
              <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white">
                Buying a Home Is a Big Decision.
                <span className="text-red-500">
                  {" "}You Don’t Have to Do It Alone.
                </span>
              </h2>

              {/* SALES COPY */}
              <p className="mt-6 max-w-2xl text-base sm:text-lg text-gray-300">
                With deep local expertise, honest advice, and a client-first
                approach, I help buyers secure the right property at the right
                price — without pressure or confusion.
              </p>

              <p className="mt-4 max-w-2xl text-sm sm:text-base text-gray-400">
                Whether you’re a first-time buyer, investor, or relocating to
                Nova Scotia, let’s build a clear strategy that works for you.
              </p>

              {/* CTA BUTTONS */}
              <div className="mt-10 flex flex-wrap items-center gap-5">
                {/* Schedule Meeting */}
                <a
                  href="https://akshay42hj.setmore.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 rounded-full bg-red-600 px-8 py-4 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  <CalendarDays size={18} />
                  Schedule a Meeting
                </a>

                {/* Save Contact (VCF) */}
                <a
                  href="/akshay-bansal.vcf"
                  download
                  className="inline-flex items-center gap-3 rounded-full border border-white/30 px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <UserPlus size={18} />
                  Save as Contact
                </a>
              </div>
            </div>

            {/* ================= RIGHT IMAGE ================= */}
            <div className="relative hidden lg:block">
              <div className="relative h-[420px] w-full overflow-hidden rounded-3xl">
                <img
                  src="/images/founder.png"
                  alt="Akshay Bansal - Realtor"
                  className="h-full w-full object-contain"
                />
                {/* subtle overlay */}
                <div className="absolute inset-0 bg-black/20" />
              </div>

              {/* Name badge */}
              {/* <div className="absolute -bottom-6 left-6 rounded-2xl bg-white px-6 py-2 shadow-xl">
                <p className="text-sm font-semibold text-[#091D35] text-center">
                  Akshay Bansal
                </p>
                <p className="text-xs text-gray-700">
                  Realtor • REMAX Nova
                </p>
              </div> */}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
