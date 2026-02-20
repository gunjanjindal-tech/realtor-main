"use client";

import { Users, Zap, Rocket, ShieldCheck } from "lucide-react";

export default function AboutStory() {
  return (
    <section className="pt-40 pb-32 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 2xl:px-12">

        {/* ========= IMAGE + STORY ========= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">

          {/* LEFT IMAGE */}
          <div className="flex justify-center">
            <div className="lg:hidden mb-12">
              <img
                src="/images/founder.png"
                alt="Founder"
                className="w-full max-w-[360px] h-auto object-cover rounded-2xl mx-auto"
              />
            </div>

            <div className="hidden lg:flex sticky top-48 h-[520px] items-center">
              <img
                src="/images/founder.png"
                alt="Founder"
                className="w-[360px] max-h-[520px] object-cover rounded-2xl"
              />
            </div>
          </div>

          {/* RIGHT STORY ONLY DARK */}
          <div className="bg-[#0B1E3D] text-white rounded-3xl px-8 md:px-16 py-20">
            <h2 className="text-3xl md:text-4xl font-bold">
              Our Story
            </h2>

            <div className="mt-8 space-y-6 max-w-xl text-base md:text-lg text-gray-300 leading-relaxed">
              <p>I’ve proudly called Halifax home for over four years, and I genuinely love everything this city has to offer.</p>
              <p>My journey into real estate began with a passion for architecture and design.</p>
              <p>With a background in sales and customer service, I guide my clients with honesty, care, and confidence.</p>
              <p>I’ve built lasting relationships by always putting people first.</p>
            </div>
          </div>
        </div>

        {/* ========= FOUNDER + VALUES (SAME ROW, SEPARATE DIVS, SAME DARK BG) ========= */}
        <div className="mt-24 grid grid-cols-1 lg:grid-cols-2 gap-20">

          {/* FOUNDER */}
          <div className="bg-[#0B1E3D] text-white rounded-3xl px-8 md:px-16 py-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              Our Founder
            </h2>

            <div className="space-y-6 text-base md:text-lg text-gray-300 leading-relaxed">
              <p>
                I’ve proudly called Halifax home for over four years — and I genuinely love everything this city has to offer.
              </p>

              <p>
                Real estate is more than just a transaction — it’s about building trust, creating connections, and helping you make confident decisions about your future.
              </p>

              <p>
                Outside of work, you’ll find me riding my motorcycle during the summer or exploring new places.
              </p>
            </div>
          </div>

          {/* VALUES */}
          <div className="bg-[#0B1E3D] text-white rounded-3xl px-8 md:px-16 py-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">
              Our Values
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              <Value icon={Users} title="Amplify Together" desc="We grow as one. Collaboration fuels success." />
              <Value icon={Zap} title="Be Relentless" desc="Driven, focused, and disciplined in pursuit of results." />
              <Value icon={Rocket} title="Disrupt for Good" desc="Challenging the norm to create better outcomes." />
              <Value icon={ShieldCheck} title="Built on Trust" desc="Integrity, transparency, and honesty always." />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

/* VALUE ITEM */
function Value({ icon: Icon, title, desc }) {
  return (
    <div className="flex gap-4">
      <Icon className="h-6 w-6 text-[rgb(229,14,11)]" />
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-300">{desc}</p>
      </div>
    </div>
  );
}